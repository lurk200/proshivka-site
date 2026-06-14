import {
  getDefaultCmsContent,
  migrateContent,
} from '../src/data/cmsStore.js';
import {
  getCmsStoreInfo,
  loadSiteContentRaw,
  saveSiteContentRaw,
} from '../server/cms/cmsStore.js';
import { readSettings, writeSettings } from '../server/settings/settingsStore.js';

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

// ─── Company migration (runs once on first server start after this change) ────
// Copies fields from CMS company into settings if settings still has defaults.
let _companyMigrated = false;
function maybeRunCompanyMigration(cmsCompany) {
  if (_companyMigrated) return;
  _companyMigrated = true;

  const settings = readSettings('company');
  // Detect if settings still holds default placeholder values
  const isDefaultPhone = settings.phone === '+7 (988) 087-43-12' || !settings.phone;
  const hasRealCmsData = cmsCompany && (
    cmsCompany.phone !== '+7 (000) 000-00-00' && cmsCompany.phone
  );

  if (!hasRealCmsData) return;

  // Fields to migrate from CMS → settings (only if settings doesn't already differ)
  const MIGRATE_FIELDS = ['name','phone','address','brandTagline','descriptor',
    'schedule','rating','footerTagline','contacts'];
  const patch = {};
  let changed = false;

  for (const field of MIGRATE_FIELDS) {
    const cmsVal = cmsCompany[field];
    const settVal = settings[field];
    // Only copy if CMS has a real value and settings doesn't already have one
    if (cmsVal !== undefined && cmsVal !== null) {
      const settIsDefault = JSON.stringify(settVal) === JSON.stringify(
        { name:'ПРОШИВКА', tagline:'Ремонт смартфонов и электроники',
          brandTagline:'Ремонт смартфонов и электроники',
          descriptor:'Лаборатория восстановления устройств',
          footerTagline:'Диагностика · Ремонт · Восстановление данных',
          phone:'+7 (988) 087-43-12',email:'',website:'proshivka.online',
          address:'улица Пирогова, 5Ак4, Ставрополь, 355032',
          schedule:'10:00 - 20:00 Ежедневно',
          contacts:[{type:'telegram',label:'Telegram',url:''},{type:'whatsapp',label:'WhatsApp',url:''},{type:'vk',label:'ВКонтакте',url:''},{type:'max',label:'MAX',url:''}],
          rating:'5.0',reviewUrl:'https://yandex.ru/maps/org/proshivka/120325503052/',logoUrl:'' }[field]
      );
      if (settIsDefault || settVal === undefined) {
        patch[field] = cmsVal;
        changed = true;
      } else if (JSON.stringify(cmsVal) !== JSON.stringify(settVal)) {
        console.log(`[CMS→Settings migration] Field "${field}" conflict:`);
        console.log(`  CMS value:      ${JSON.stringify(cmsVal)}`);
        console.log(`  Settings value: ${JSON.stringify(settVal)}`);
        console.log(`  → Keeping settings value (single source of truth)`);
      }
    }
  }

  if (changed) {
    writeSettings('company', { ...settings, ...patch });
    console.log('[CMS→Settings migration] Company data migrated to settings/company.json');
  }
}

// Merges settings.company into the CMS content.company.
// Settings wins for fields it owns; CMS keeps fields settings doesn't have.
function mergeCompanyFromSettings(content) {
  const settings = readSettings('company');
  const SETTINGS_FIELDS = ['name','tagline','brandTagline','descriptor','footerTagline',
    'phone','email','website','address','schedule','contacts','rating','reviewUrl','logoUrl'];
  const patch = {};
  for (const field of SETTINGS_FIELDS) {
    const val = settings[field];
    if (val !== undefined && val !== null && val !== '') {
      patch[field] = val;
    }
  }
  return { ...content, company: { ...content.company, ...patch } };
}

function readPublicContent() {
  const raw = loadSiteContentRaw();
  const content = raw ? migrateContent(raw) : getDefaultCmsContent();
  maybeRunCompanyMigration(content.company);
  const merged = mergeCompanyFromSettings(content);
  return { content: merged, persisted: Boolean(raw) };
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
