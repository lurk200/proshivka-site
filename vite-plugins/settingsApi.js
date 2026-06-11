import { readSettings, writeSettings } from '../server/settings/settingsStore.js';

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function isAdmin(req, url) {
  const pwd = process.env.VITE_ADMIN_PASSWORD || 'proshivka';
  return req.headers['x-admin-password'] === pwd || url.searchParams.get('adminPassword') === pwd;
}

const ALLOWED_KEYS = new Set(['company', 'documents']);

export function settingsApiPlugin() {
  function setup(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url, 'http://localhost');
      const m = url.pathname.match(/^\/api\/admin\/settings\/([a-z]+)$/);
      if (!m) return next();

      const key = m[1];
      if (!ALLOWED_KEYS.has(key)) return sendJson(res, 404, { error: 'NOT_FOUND' });
      if (!isAdmin(req, url)) return sendJson(res, 401, { error: 'UNAUTHORIZED' });

      if (req.method === 'GET') {
        return sendJson(res, 200, readSettings(key));
      }

      if (req.method === 'PUT' || req.method === 'PATCH') {
        try {
          const body = JSON.parse(await readBody(req));
          const saved = writeSettings(key, body);
          return sendJson(res, 200, saved);
        } catch (e) {
          return sendJson(res, 400, { error: e.message });
        }
      }

      return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    });
  }

  return {
    name: 'settings-api',
    configureServer: setup,
    configurePreviewServer: setup,
  };
}
