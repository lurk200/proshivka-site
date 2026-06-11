import {
  logPageview,
  logClick,
  getAnalyticsSummary,
} from '../server/analytics/analyticsStore.js';

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

    // ── Public: track click ────────────────────────────────────────────────
    if (url.pathname === '/api/analytics/click') {
      if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
      try {
        const raw = await readBody(req);
        const { target, label, path, sessionId } = raw ? JSON.parse(raw) : {};
        if (target && sessionId) logClick({ target, label, path, sessionId });
        return sendJson(res, 200, { ok: true });
      } catch {
        return sendJson(res, 400, { error: 'bad request' });
      }
    }

    // ── Admin: analytics summary ───────────────────────────────────────────
    if (url.pathname === '/api/admin/analytics') {
      if (!isAdminRequest(req)) {
        return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      }
      if (req.method !== 'GET') { res.statusCode = 405; return res.end(); }
      try {
        return sendJson(res, 200, getAnalyticsSummary());
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
