import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const PAGEVIEWS_FILE = path.join(DATA_DIR, 'pageviews.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const CLICKS_FILE = path.join(DATA_DIR, 'clicks.json');

const MAX_PAGEVIEWS = 10000;
const MAX_SESSIONS = 2000;
const MAX_CLICKS = 5000;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min
const ARCHIVE_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

// Targets that count as a "conversion" (contact intent)
const CONVERSION_TARGETS = new Set([
  'phone', 'whatsapp', 'telegram', 'viber', 'vk',
  'service_cta', 'send_repair_cta', 'map_route',
]);

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file) {
  ensureDir();
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {}
  return [];
}

function writeJson(file, data) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ── Traffic source classification ─────────────────────────────────────────────

function classifySource(referrer, utm) {
  if (utm?.source) {
    const src = utm.source.toLowerCase();
    if (src.includes('google')) return 'Google Реклама';
    if (src.includes('yandex') || src.includes('яндекс')) return 'Яндекс.Директ';
    if (src.includes('vk') || src.includes('vkontakte')) return 'VKontakte';
    if (src.includes('telegram') || src.includes('tg')) return 'Telegram';
    if (src.includes('whatsapp') || src.includes('wa')) return 'WhatsApp';
    if (src === 'direct') return 'Прямые переходы';
    return utm.source;
  }
  if (!referrer) return 'Прямые переходы';
  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    if (hostname.includes('google.')) return 'Google';
    if (hostname.includes('yandex.')) return 'Яндекс';
    if (hostname === 'vk.com' || hostname.endsWith('.vk.com')) return 'VKontakte';
    if (hostname === 't.me' || hostname.includes('telegram')) return 'Telegram';
    if (hostname.includes('whatsapp') || hostname === 'wa.me') return 'WhatsApp';
    if (hostname.includes('2gis')) return '2GIS';
    if (hostname.includes('maps.')) return 'Карты';
    if (hostname.includes('ok.ru')) return 'Одноклассники';
    return hostname.replace(/^www\./, '');
  } catch {
    return 'Другое';
  }
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export function upsertSession({ sessionId, path: p, referrer, utm }) {
  const now = new Date().toISOString();
  const sessions = readJson(SESSIONS_FILE);
  const idx = sessions.findIndex(s => s.id === sessionId);
  const since = sessions[idx]?.firstSeen ?? now;
  const lastSeen = sessions[idx]?.lastSeen;
  const isActive = lastSeen && (Date.now() - new Date(lastSeen).getTime()) < SESSION_TIMEOUT_MS;

  if (idx >= 0) {
    sessions[idx] = {
      ...sessions[idx],
      lastSeen: now,
      pageCount: (sessions[idx].pageCount ?? 1) + (isActive ? 1 : 0),
      lastPath: p,
    };
  } else {
    sessions.unshift({
      id: sessionId,
      firstSeen: now,
      lastSeen: now,
      firstPath: p,
      lastPath: p,
      referrer: referrer || null,
      utm: utm || null,
      source: classifySource(referrer, utm),
      pageCount: 1,
    });
    if (sessions.length > MAX_SESSIONS) sessions.splice(MAX_SESSIONS);
  }
  writeJson(SESSIONS_FILE, sessions);
}

// ── Pageviews ─────────────────────────────────────────────────────────────────

export function logPageview({ path: p, sessionId, referrer, utm }) {
  const now = new Date().toISOString();
  const views = readJson(PAGEVIEWS_FILE);
  views.unshift({ path: p, sessionId, referrer: referrer || null, utm: utm || null, at: now });
  if (views.length > MAX_PAGEVIEWS) views.splice(MAX_PAGEVIEWS);
  writeJson(PAGEVIEWS_FILE, views);
  upsertSession({ sessionId, path: p, referrer, utm });
}

// ── Clicks ────────────────────────────────────────────────────────────────────

export function logClick({ target, label, path: p, sessionId }) {
  const now = new Date().toISOString();
  const clicks = readJson(CLICKS_FILE);
  clicks.unshift({ target, label: label || null, path: p, sessionId, at: now });
  if (clicks.length > MAX_CLICKS) clicks.splice(MAX_CLICKS);
  writeJson(CLICKS_FILE, clicks);
}

// ── Performance & cleanup ─────────────────────────────────────────────────────

export function getPerformanceStats() {
  function safeSize(file) {
    try { return fs.statSync(file).size; } catch { return 0; }
  }
  const views = readJson(PAGEVIEWS_FILE);
  const sessions = readJson(SESSIONS_FILE);
  const clicks = readJson(CLICKS_FILE);
  const cutoff = Date.now() - ARCHIVE_AGE_MS;

  const oldViews = views.filter(v => new Date(v.at).getTime() < cutoff).length;
  const oldClicks = clicks.filter(c => new Date(c.at).getTime() < cutoff).length;
  const oldest = views.length > 0 ? views[views.length - 1]?.at : null;

  return {
    pageviews: { count: views.length, max: MAX_PAGEVIEWS, sizeKb: Math.round(safeSize(PAGEVIEWS_FILE) / 1024), oldCount: oldViews },
    sessions: { count: sessions.length, max: MAX_SESSIONS, sizeKb: Math.round(safeSize(SESSIONS_FILE) / 1024) },
    clicks: { count: clicks.length, max: MAX_CLICKS, sizeKb: Math.round(safeSize(CLICKS_FILE) / 1024), oldCount: oldClicks },
    oldestEvent: oldest,
    archiveThresholdDays: 90,
  };
}

export function cleanupOldEvents() {
  const cutoff = Date.now() - ARCHIVE_AGE_MS;

  let views = readJson(PAGEVIEWS_FILE);
  const beforeViews = views.length;
  views = views.filter(v => new Date(v.at).getTime() >= cutoff);
  if (views.length < beforeViews) writeJson(PAGEVIEWS_FILE, views);

  let clicks = readJson(CLICKS_FILE);
  const beforeClicks = clicks.length;
  clicks = clicks.filter(c => new Date(c.at).getTime() >= cutoff);
  if (clicks.length < beforeClicks) writeJson(CLICKS_FILE, clicks);

  return { removedViews: beforeViews - views.length, removedClicks: beforeClicks - clicks.length };
}

// ── Analytics summary ─────────────────────────────────────────────────────────

export function getAnalyticsSummary() {
  const now = Date.now();
  const todayStr = new Date().toISOString().slice(0, 10);
  const weekAgo = now - 7 * 86400000;
  const monthAgo = now - 30 * 86400000;
  const onlineWindow = now - SESSION_TIMEOUT_MS;

  const views = readJson(PAGEVIEWS_FILE);
  const sessions = readJson(SESSIONS_FILE);
  const clicks = readJson(CLICKS_FILE);

  // ── Basic KPIs ──────────────────────────────────────────────────────────────
  const onlineNow = sessions.filter(s => new Date(s.lastSeen).getTime() >= onlineWindow).length;
  const totalPageviews = views.length;
  const totalSessions = sessions.length;
  const todayViews = views.filter(v => v.at.slice(0, 10) === todayStr).length;
  const weekViews = views.filter(v => new Date(v.at).getTime() >= weekAgo).length;
  const monthViews = views.filter(v => new Date(v.at).getTime() >= monthAgo).length;

  // ── Popular pages ───────────────────────────────────────────────────────────
  const pageCountMap = {};
  for (const v of views) {
    if (new Date(v.at).getTime() < monthAgo) continue;
    const p = v.path.split('?')[0]; // strip query string
    pageCountMap[p] = (pageCountMap[p] || 0) + 1;
  }
  const popularPages = Object.entries(pageCountMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([path, count]) => ({ path, count }));

  // ── Daily chart ─────────────────────────────────────────────────────────────
  const dailyMap = {};
  for (const v of views) {
    if (new Date(v.at).getTime() < monthAgo) continue;
    const day = v.at.slice(0, 10);
    dailyMap[day] = (dailyMap[day] || 0) + 1;
  }
  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // ── Traffic sources (classified) ─────────────────────────────────────────────
  const sourceMap = {};
  for (const s of sessions) {
    if (new Date(s.firstSeen).getTime() < monthAgo) continue;
    const src = s.source || classifySource(s.referrer, s.utm);
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  }
  const trafficSources = Object.entries(sourceMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([source, count]) => ({ source, count }));

  // ── Raw referrers ───────────────────────────────────────────────────────────
  const refMap = {};
  for (const s of sessions) {
    if (!s.referrer || new Date(s.firstSeen).getTime() < monthAgo) continue;
    try {
      const host = new URL(s.referrer).hostname.replace(/^www\./, '');
      refMap[host] = (refMap[host] || 0) + 1;
    } catch {}
  }
  const topReferrers = Object.entries(refMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([referrer, count]) => ({ referrer, count }));

  // ── UTM sources ─────────────────────────────────────────────────────────────
  const utmMap = {};
  for (const s of sessions) {
    if (!s.utm?.source || new Date(s.firstSeen).getTime() < monthAgo) continue;
    utmMap[s.utm.source] = (utmMap[s.utm.source] || 0) + 1;
  }
  const utmSources = Object.entries(utmMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));

  // ── Click analytics ──────────────────────────────────────────────────────────
  const clickMap = {};
  for (const c of clicks) {
    if (new Date(c.at).getTime() < monthAgo) continue;
    const key = c.target + (c.label ? ` — ${c.label}` : '');
    clickMap[key] = (clickMap[key] || 0) + 1;
  }
  const topClicks = Object.entries(clickMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([target, count]) => ({ target, count }));

  // ── CTA breakdown by type ────────────────────────────────────────────────────
  const ctaMap = {};
  for (const c of clicks) {
    if (new Date(c.at).getTime() < monthAgo) continue;
    ctaMap[c.target] = (ctaMap[c.target] || 0) + 1;
  }
  const ctaBreakdown = Object.entries(ctaMap)
    .sort(([, a], [, b]) => b - a)
    .map(([target, count]) => ({ target, count }));

  // ── Service heatmap (service CTA clicks) ────────────────────────────────────
  const svcMap = {};
  for (const c of clicks) {
    if (c.target !== 'service_cta' || new Date(c.at).getTime() < monthAgo) continue;
    const key = c.label || 'Услуга без названия';
    svcMap[key] = (svcMap[key] || 0) + 1;
  }
  const serviceHeatmap = Object.entries(svcMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([service, clicks]) => ({ service, clicks }));

  // ── Basic funnel (3-step) ────────────────────────────────────────────────────
  const funnelPaths = ['/', '/prise', '/otpravit-v-remont'];
  const funnelCounts = funnelPaths.map(fp =>
    views.filter(v => v.path.split('?')[0] === fp && new Date(v.at).getTime() >= monthAgo).length,
  );
  const funnel = funnelPaths.map((path, i) => ({ path, count: funnelCounts[i] }));

  // ── Extended funnel ──────────────────────────────────────────────────────────
  const monthClicks = clicks.filter(c => new Date(c.at).getTime() >= monthAgo);
  const serviceCtas = monthClicks.filter(c => c.target === 'service_cta').length;
  const contactClicks = monthClicks.filter(c =>
    ['phone', 'whatsapp', 'telegram', 'send_repair_cta'].includes(c.target),
  ).length;

  const extendedFunnel = [
    { step: 'Главная страница', path: '/', count: funnelCounts[0] },
    { step: 'Калькулятор цен', path: '/prise', count: funnelCounts[1] },
    { step: 'Записаться (услуга)', path: 'service_cta', count: serviceCtas },
    { step: 'Контакт (звонок/мессенджер)', path: 'contact_click', count: contactClicks },
  ];

  // ── Conversions total ────────────────────────────────────────────────────────
  const totalConversions = monthClicks.filter(c => CONVERSION_TARGETS.has(c.target)).length;
  const conversionRate = monthViews > 0 ? Math.round(totalConversions / monthViews * 100) : 0;

  return {
    onlineNow,
    totalPageviews,
    totalSessions,
    todayViews,
    weekViews,
    monthViews,
    popularPages,
    daily,
    trafficSources,
    topReferrers,
    utmSources,
    topClicks,
    ctaBreakdown,
    serviceHeatmap,
    funnel,
    extendedFunnel,
    totalConversions,
    conversionRate,
  };
}
