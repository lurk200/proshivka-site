import {
  logPageview,
  logClick,
  getAnalyticsSummary,
  getPerformanceStats,
  cleanupOldEvents,
} from '../server/analytics/analyticsStore.js';
import {
  logConversion,
  getSearchDemand,
  getStats as getSearchStats,
  detectDeviceModel,
  detectFaultCategory,
} from '../server/prise/searchAnalyticsStore.js';

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function getAdminPassword() {
  return process.env.VITE_ADMIN_PASSWORD || 'proshivka';
}

function isAdminRequest(req) {
  return req.headers['x-admin-password'] === getAdminPassword();
}

function parseUtm(url) {
  const source = url.searchParams.get('utm_source');
  const medium = url.searchParams.get('utm_medium');
  const campaign = url.searchParams.get('utm_campaign');
  if (!source && !medium && !campaign) return null;
  return { source, medium, campaign };
}

// Aggregate device models from search demand data
function aggregateModels(demand) {
  const map = {};
  for (const d of demand) {
    const m = d.model;
    if (!m) continue;
    if (!map[m]) map[m] = { model: m, searches: 0, conversions: 0 };
    map[m].searches += d.count;
    map[m].conversions += d.conversions || 0;
  }
  return Object.values(map)
    .sort((a, b) => b.searches - a.searches)
    .slice(0, 15)
    .map(m => ({
      ...m,
      convRate: m.searches > 0 ? Math.round(m.conversions / m.searches * 100) : 0,
    }));
}

// Aggregate fault categories from search demand data
function aggregateCategories(demand) {
  const map = {};
  for (const d of demand) {
    const c = d.category;
    if (!map[c]) map[c] = { category: c, searches: 0, conversions: 0 };
    map[c].searches += d.count;
    map[c].conversions += d.conversions || 0;
  }
  return Object.values(map)
    .sort((a, b) => b.searches - a.searches)
    .map(c => ({
      ...c,
      convRate: c.searches > 0 ? Math.round(c.conversions / c.searches * 100) : 0,
    }));
}

// Build Stavropol local block: popular devices + repair types + top queries with model
function buildStavropol(demand) {
  const withModel = demand.filter(d => d.model);
  const brands = {};
  for (const d of withModel) {
    const brand = d.model.split(' ')[0]; // iPhone, Samsung, Redmi, etc.
    if (!brands[brand]) brands[brand] = { brand, searches: 0 };
    brands[brand].searches += d.count;
  }
  const popularBrands = Object.values(brands)
    .sort((a, b) => b.searches - a.searches)
    .slice(0, 8);

  const cats = {};
  for (const d of demand) {
    const c = d.category;
    if (c === 'Прочее') continue;
    if (!cats[c]) cats[c] = { type: c, searches: 0 };
    cats[c].searches += d.count;
  }
  const popularRepairs = Object.values(cats)
    .sort((a, b) => b.searches - a.searches)
    .slice(0, 8);

  const topLocal = demand
    .filter(d => d.model && d.category !== 'Прочее')
    .slice(0, 10);

  return { popularBrands, popularRepairs, topLocal };
}

function registerAnalyticsApi(server) {
  server.middlewares.use(async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');

    // ── Public: track pageview ─────────────────────────────────────────────
    if (url.pathname === '/api/analytics/pageview') {
      if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
      try {
        const raw = await readBody(req);
        const { path, sessionId, referrer } = raw ? JSON.parse(raw) : {};
        if (path && sessionId) {
          const utm = parseUtm(new URL(path, 'http://localhost'));
          logPageview({ path, sessionId, referrer, utm });
        }
        return sendJson(res, 200, { ok: true });
      } catch {
        return sendJson(res, 400, { error: 'bad request' });
      }
    }

    // ── Public: track click / CTA ──────────────────────────────────────────
    if (url.pathname === '/api/analytics/click') {
      if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
      try {
        const raw = await readBody(req);
        const { target, label, path, sessionId } = raw ? JSON.parse(raw) : {};
        if (target && sessionId) {
          logClick({ target, label, path, sessionId });
          // Link conversion to last search query for this session
          const CONV_TARGETS = ['phone', 'whatsapp', 'telegram', 'viber', 'vk',
            'service_cta', 'send_repair_cta', 'map_route'];
          if (CONV_TARGETS.includes(target)) {
            try { logConversion(sessionId); } catch {}
          }
        }
        return sendJson(res, 200, { ok: true });
      } catch {
        return sendJson(res, 400, { error: 'bad request' });
      }
    }

    // ── Admin: full analytics summary ──────────────────────────────────────
    if (url.pathname === '/api/admin/analytics') {
      if (!isAdminRequest(req)) return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      if (req.method !== 'GET') { res.statusCode = 405; return res.end(); }
      try {
        const summary = getAnalyticsSummary();
        const demand = getSearchDemand(100);
        const searchStats = getSearchStats();
        const topModels = aggregateModels(demand);
        const topFaultCategories = aggregateCategories(demand);
        const stavropol = buildStavropol(demand);
        const performance = getPerformanceStats();
        return sendJson(res, 200, {
          ...summary,
          searchStats,
          topSearches: demand.slice(0, 10),
          topModels,
          topFaultCategories,
          stavropol,
          performance,
        });
      } catch (e) {
        return sendJson(res, 500, { error: String(e.message) });
      }
    }

    // ── Admin: search demand detail ────────────────────────────────────────
    if (url.pathname === '/api/admin/analytics/search-demand') {
      if (!isAdminRequest(req)) return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      if (req.method !== 'GET') { res.statusCode = 405; return res.end(); }
      try {
        const limit = Math.min(Number(url.searchParams.get('limit') || 100), 500);
        return sendJson(res, 200, {
          items: getSearchDemand(limit),
          stats: getSearchStats(),
        });
      } catch (e) {
        return sendJson(res, 500, { error: String(e.message) });
      }
    }

    // ── Admin: cleanup old events ──────────────────────────────────────────
    if (url.pathname === '/api/admin/analytics/cleanup') {
      if (!isAdminRequest(req)) return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
      try {
        const result = cleanupOldEvents();
        return sendJson(res, 200, { ok: true, ...result });
      } catch (e) {
        return sendJson(res, 500, { error: String(e.message) });
      }
    }

    next();
  });
}

export function analyticsApiPlugin() {
  return {
    name: 'analytics-api',
    configureServer: registerAnalyticsApi,
    configurePreviewServer: registerAnalyticsApi,
  };
}
