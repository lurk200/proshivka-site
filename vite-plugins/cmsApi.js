import {
  getDefaultCmsContent,
  migrateContent,
} from '../src/data/cmsStore.js';
import {
  getCmsStoreInfo,
  loadSiteContentRaw,
  saveSiteContentRaw,
} from '../server/cms/cmsStore.js';

function sendJson(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [key, value] of Object.entries(extraHeaders)) {
    res.setHeader(key, value);
  }
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function getAdminPassword() {
  return process.env.VITE_ADMIN_PASSWORD || 'proshivka';
}

function isAdminRequest(req) {
  const header = req.headers['x-admin-password'];
  return header === getAdminPassword();
}

function readPublicContent() {
  const raw = loadSiteContentRaw();
  const content = raw ? migrateContent(raw) : getDefaultCmsContent();
  return { content, persisted: Boolean(raw) };
}

function registerCmsApi(server) {
  server.middlewares.use(async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/api/cms') {
      if (req.method !== 'GET') {
        res.statusCode = 405;
        return res.end();
      }
      try {
        const { content, persisted } = readPublicContent();
        return sendJson(res, 200, { content, persisted }, {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
        });
      } catch (err) {
        return sendJson(res, 500, { error: String(err.message) });
      }
    }

    if (url.pathname === '/api/admin/cms/status') {
      if (!isAdminRequest(req)) {
        return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      }
      if (req.method !== 'GET') {
        res.statusCode = 405;
        return res.end();
      }
      return sendJson(res, 200, getCmsStoreInfo());
    }

    if (url.pathname === '/api/admin/cms/export') {
      if (!isAdminRequest(req)) {
        return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      }
      if (req.method !== 'GET') {
        res.statusCode = 405;
        return res.end();
      }
      try {
        const raw = loadSiteContentRaw();
        if (!raw) {
          return sendJson(res, 404, { error: 'Нет сохранённого контента CMS' });
        }
        const stamp = new Date().toISOString().slice(0, 10);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="proshivka-cms-${stamp}.json"`);
        res.end(JSON.stringify(raw, null, 2));
        return;
      } catch (err) {
        return sendJson(res, 500, { error: String(err.message) });
      }
    }

    if (url.pathname === '/api/admin/cms') {
      if (!isAdminRequest(req)) {
        return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      }
      try {
        if (req.method === 'GET') {
          const { content } = readPublicContent();
          return sendJson(res, 200, { content });
        }
        if (req.method === 'PUT' || req.method === 'POST') {
          const raw = await readBody(req);
          const parsed = raw ? JSON.parse(raw) : {};
          saveSiteContentRaw(parsed);
          const content = migrateContent(parsed);
          return sendJson(res, 200, { ok: true, content });
        }
        res.statusCode = 405;
        return res.end();
      } catch {
        return sendJson(res, 400, { error: 'Неверный формат данных CMS' });
      }
    }

    next();
  });
}

export function cmsApiPlugin() {
  return {
    name: 'cms-api',
    configureServer: registerCmsApi,
    configurePreviewServer: registerCmsApi,
  };
}
