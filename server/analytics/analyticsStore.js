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

// ── Analytics queries ─────────────────────────────────────────────────────────

export function getAnalyticsSummary() {
  const now = Date.now();
  const todayStr = new Date().toISOString().slice(0, 10);
  const weekAgo = now - 7 * 86400000;
  const monthAgo = now - 30 * 86400000;
  const onlineWindow = now - SESSION_TIMEOUT_MS;

  const views = readJson(PAGEVIEWS_FILE);
  const sessions = readJson(SESSIONS_FILE);
  const clicks = readJson(CLICKS_FILE);

  // Online visitors (active sessions in last 30 min)
  const onlineNow = sessions.filter(s => new Date(s.lastSeen).getTime() >= onlineWindow).length;

  // Totals
  const totalPageviews = views.length;
  const totalSessions = sessions.length;

  const todayViews = views.filter(v => v.at.slice(0, 10) === todayStr).length;
  const weekViews = views.filter(v => new Date(v.at).getTime() >= weekAgo).length;
  const monthViews = views.filter(v => new Date(v.at).getTime() >= monthAgo).length;

  // Popular pages (last 30 days)
  const pageCountMap = {};
  for (const v of views) {
    if (new Date(v.at).getTime() < monthAgo) continue;
    pageCountMap[v.path] = (pageCountMap[v.path] || 0) + 1;
  }
  const popularPages = Object.entries(pageCountMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([path, count]) => ({ path, count }));

  // Daily pageviews (last 30 days)
  const dailyMap = {};
  for (const v of views) {
    const day = v.at.slice(0, 10);
    if (new Date(v.at).getTime() < monthAgo) continue;
    dailyMap[day] = (dailyMap[day] || 0) + 1;
  }
  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // Top referrers
  const refMap = {};
  for (const s of sessions) {
    if (!s.referrer) continue;
    if (new Date(s.firstSeen).getTime() < monthAgo) continue;
    try {
      const host = new URL(s.referrer).hostname.replace(/^www\./, '');
      refMap[host] = (refMap[host] || 0) + 1;
    } catch {}
  }
  const topReferrers = Object.entries(refMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([referrer, count]) => ({ referrer, count }));

  // UTM sources
  const utmMap = {};
  for (const s of sessions) {
    if (!s.utm?.source) continue;
    if (new Date(s.firstSeen).getTime() < monthAgo) continue;
    const key = s.utm.source;
    utmMap[key] = (utmMap[key] || 0) + 1;
  }
  const utmSources = Object.entries(utmMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));

  // Top clicks
  const clickMap = {};
  for (const c of clicks) {
    if (new Date(c.at).getTime() < monthAgo) continue;
    const key = c.target + (c.label ? ` — ${c.label}` : '');
    clickMap[key] = (clickMap[key] || 0) + 1;
  }
  const topClicks = Object.entries(clickMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([target, count]) => ({ target, count }));

  // Funnel: homepage → prise → otpravit-v-remont
  const funnelPaths = ['/', '/prise', '/otpravit-v-remont'];
  const funnelCounts = funnelPaths.map(fp =>
    views.filter(v => v.path === fp && new Date(v.at).getTime() >= monthAgo).length
  );
  const funnel = funnelPaths.map((path, i) => ({ path, count: funnelCounts[i] }));

  return {
    onlineNow,
    totalPageviews,
    totalSessions,
    todayViews,
    weekViews,
    monthViews,
    popularPages,
    daily,
    topReferrers,
    utmSources,
    topClicks,
    funnel,
  };
}
