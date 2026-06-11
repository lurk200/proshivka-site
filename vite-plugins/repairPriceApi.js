import {
  getModelSuggestions,
  getRepairQuote,
  getRepairPriceSettings,
  saveRepairSettings,
} from '../server/prise/repairQuoteService.js';
import { computeSimplePrice } from '../src/data/repairCategorySettings.js';
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
  bulkUpdateServices,
  bulkAdjustPrices,
  markServicesChecked,
  servicesToCsv,
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getFreshnessStatus,
} from '../server/prise/servicesStore.js';
import {
  logSearch,
  getPopular,
  getStats,
  getGaps,
} from '../server/prise/searchAnalyticsStore.js';

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function sendText(res, status, text, type = 'text/plain') {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  res.end(text);
}

function readQueryParam(url, ...keys) {
  for (const key of keys) {
    const value = url.searchParams.get(key)?.trim();
    if (value) return value;
  }
  return '';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function idFromPath(pathname, prefix) {
  // e.g. /api/admin/services/svc_abc123 → svc_abc123
  return pathname.slice(prefix.length) || null;
}

function registerRepairPriceApi(server) {
  server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        const { pathname } = url;

        // ── Repair-price settings ──────────────────────────────────────────
        if (pathname === '/api/repair-price/settings') {
          try {
            if (req.method === 'GET') return sendJson(res, 200, getRepairPriceSettings());
            if (req.method === 'PUT' || req.method === 'POST') {
              const raw = await readBody(req);
              const saved = saveRepairSettings(raw ? JSON.parse(raw) : {});
              return sendJson(res, 200, saved);
            }
            res.statusCode = 405; return res.end();
          } catch {
            return sendJson(res, 400, { error: 'Неверный формат настроек' });
          }
        }

        if (pathname === '/api/repair-price/models') {
          try {
            const q = url.searchParams.get('q') ?? '';
            const models = await getModelSuggestions(q);
            return sendJson(res, 200, { models });
          } catch {
            return sendJson(res, 503, { error: 'Сервис временно недоступен', code: 'SERVICE_UNAVAILABLE' });
          }
        }

        if (pathname === '/api/repair-price') {
          const model = readQueryParam(url, 'model', 'q');
          const label = url.searchParams.get('label')?.trim() ?? '';
          if (!model) return sendJson(res, 400, { error: 'Укажите модель устройства', code: 'MISSING_MODEL' });
          try {
            const payload = await getRepairQuote(model, label);
            if (!payload) return sendJson(res, 404, { error: 'Запчасть не найдена в наличии в Ставрополе', code: 'NOT_IN_STOCK' });
            return sendJson(res, 200, payload);
          } catch {
            return sendJson(res, 503, { error: 'Не удалось проверить наличие. Попробуйте позже.', code: 'SERVICE_UNAVAILABLE' });
          }
        }

        // ── Public services catalog ────────────────────────────────────────
        if (pathname === '/api/services') {
          try {
            const category = url.searchParams.get('category') || undefined;
            const deviceType = url.searchParams.get('deviceType') || undefined;
            const partType = url.searchParams.get('partType') || undefined;
            const brand = url.searchParams.get('brand') || undefined;
            const search = url.searchParams.get('search') || undefined;
            const sort = url.searchParams.get('sort') || 'popularity';

            // Track search query for analytics with session linkage
            if (search) {
              try {
                const sid = url.searchParams.get('sessionId') || null;
                logSearch(search, sid);
              } catch {}
            }

            let items = listServices({ category, deviceType, partType, brand, search, archived: false, available: true });

            if (sort === 'price_asc') {
              items.sort((a, b) => (a.priceFrom ?? a.price ?? 0) - (b.priceFrom ?? b.price ?? 0));
            } else if (sort === 'price_desc') {
              items.sort((a, b) => (b.priceTo ?? b.price ?? 0) - (a.priceTo ?? a.price ?? 0));
            } else {
              // Primary: popularity. Secondary: has purchase price. Tertiary: has supplier.
              items.sort((a, b) => {
                const popDiff = (b.popularity ?? 0) - (a.popularity ?? 0);
                if (popDiff !== 0) return popDiff;
                const ppDiff = (b.purchasePrice != null ? 1 : 0) - (a.purchasePrice != null ? 1 : 0);
                if (ppDiff !== 0) return ppDiff;
                return (b.supplierId ? 1 : 0) - (a.supplierId ? 1 : 0);
              });
            }

            // Enrich with computed price + availability, strip internal fields
            const catSettings = getRepairPriceSettings().categorySettings ?? {};
            const publicItems = items.map((item) => {
              const { partCost, purchasePrice, laborCost, lastChecked, history, ...pub } = item;
              const clientPrice = purchasePrice != null && purchasePrice > 0
                ? computeSimplePrice(purchasePrice, pub.partType, catSettings)
                : null;
              const freshness = getFreshnessStatus(item);
              const availability = purchasePrice != null && purchasePrice > 0
                ? (freshness === 'fresh' ? 'in_stock' : 'order')
                : 'enquire';
              return { ...pub, clientPrice, availability };
            });
            return sendJson(res, 200, { items: publicItems });
          } catch (e) {
            return sendJson(res, 500, { error: String(e.message) });
          }
        }

        // ── Public search analytics ────────────────────────────────────────
        if (pathname === '/api/search-analytics/popular') {
          try {
            const limit = Number(url.searchParams.get('limit') || 10);
            const popular = getPopular(limit);
            return sendJson(res, 200, { items: popular });
          } catch (e) {
            return sendJson(res, 500, { error: String(e.message) });
          }
        }

        // ── Admin services CRUD ────────────────────────────────────────────
        if (pathname === '/api/admin/services') {
          try {
            if (req.method === 'GET') {
              const category = url.searchParams.get('category') || undefined;
              const deviceType = url.searchParams.get('deviceType') || undefined;
              const partType = url.searchParams.get('partType') || undefined;
              const search = url.searchParams.get('search') || undefined;
              const archivedParam = url.searchParams.get('archived');
              const archived = archivedParam === 'true' ? true : archivedParam === 'false' ? false : undefined;
              const rawItems = listServices({ category, deviceType, partType, search, archived });
              const items = rawItems.map(s => ({ ...s, freshness: getFreshnessStatus(s) }));
              return sendJson(res, 200, { items });
            }
            if (req.method === 'POST') {
              const raw = await readBody(req);
              const data = JSON.parse(raw);
              const svc = createService(data);
              return sendJson(res, 201, svc);
            }
            res.statusCode = 405; return res.end();
          } catch (e) {
            return sendJson(res, 400, { error: String(e.message) });
          }
        }

        // ── Admin search analytics ─────────────────────────────────────────
        if (pathname === '/api/admin/search-analytics') {
          try {
            const services = listServices({ archived: undefined });
            const popular = getPopular(20);
            const gaps = getGaps(services, 15);
            const stats = getStats();
            return sendJson(res, 200, { popular, gaps, stats });
          } catch (e) {
            return sendJson(res, 500, { error: String(e.message) });
          }
        }

        if (pathname === '/api/admin/services/mark-checked') {
          if (req.method === 'POST') {
            try {
              const raw = await readBody(req);
              const { ids } = JSON.parse(raw);
              const count = markServicesChecked(ids);
              return sendJson(res, 200, { count });
            } catch (e) {
              return sendJson(res, 400, { error: String(e.message) });
            }
          }
        }

        if (pathname === '/api/admin/services/bulk') {
          if (req.method === 'POST') {
            try {
              const raw = await readBody(req);
              const { ids, action, patch, multiplier } = JSON.parse(raw);
              if (action === 'price_adjust') {
                const count = bulkAdjustPrices(ids, multiplier ?? 1);
                return sendJson(res, 200, { count });
              }
              const count = bulkUpdateServices(ids, patch || {});
              return sendJson(res, 200, { count });
            } catch (e) {
              return sendJson(res, 400, { error: String(e.message) });
            }
          }
        }

        if (pathname === '/api/admin/services/export-csv') {
          if (req.method === 'GET') {
            try {
              const idsParam = url.searchParams.get('ids');
              const ids = idsParam ? idsParam.split(',') : null;
              const csv = servicesToCsv(ids);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/csv; charset=utf-8');
              res.setHeader('Content-Disposition', 'attachment; filename="services.csv"');
              return res.end('﻿' + csv); // BOM for Excel
            } catch (e) {
              return sendJson(res, 500, { error: String(e.message) });
            }
          }
        }

        if (pathname.startsWith('/api/admin/services/')) {
          const id = idFromPath(pathname, '/api/admin/services/');
          if (!id) { next(); return; }
          try {
            if (req.method === 'GET') {
              const svc = getService(id);
              if (!svc) return sendJson(res, 404, { error: 'Не найдено' });
              return sendJson(res, 200, svc);
            }
            if (req.method === 'PUT' || req.method === 'PATCH') {
              const raw = await readBody(req);
              const patch = JSON.parse(raw);
              const updated = updateService(id, patch);
              if (!updated) return sendJson(res, 404, { error: 'Не найдено' });
              return sendJson(res, 200, updated);
            }
            if (req.method === 'DELETE') {
              const ok = deleteService(id);
              return sendJson(res, ok ? 200 : 404, { ok });
            }
            res.statusCode = 405; return res.end();
          } catch (e) {
            return sendJson(res, 400, { error: String(e.message) });
          }
        }

        // ── Admin suppliers CRUD ───────────────────────────────────────────
        if (pathname === '/api/admin/suppliers') {
          try {
            if (req.method === 'GET') {
              return sendJson(res, 200, { items: listSuppliers() });
            }
            if (req.method === 'POST') {
              const raw = await readBody(req);
              const sup = createSupplier(JSON.parse(raw));
              return sendJson(res, 201, sup);
            }
            res.statusCode = 405; return res.end();
          } catch (e) {
            return sendJson(res, 400, { error: String(e.message) });
          }
        }

        if (pathname.startsWith('/api/admin/suppliers/')) {
          const id = idFromPath(pathname, '/api/admin/suppliers/');
          if (!id) { next(); return; }
          try {
            if (req.method === 'PUT' || req.method === 'PATCH') {
              const raw = await readBody(req);
              const updated = updateSupplier(id, JSON.parse(raw));
              if (!updated) return sendJson(res, 404, { error: 'Не найдено' });
              return sendJson(res, 200, updated);
            }
            if (req.method === 'DELETE') {
              const ok = deleteSupplier(id);
              return sendJson(res, ok ? 200 : 404, { ok });
            }
            res.statusCode = 405; return res.end();
          } catch (e) {
            return sendJson(res, 400, { error: String(e.message) });
          }
        }

        next();
      });
}

export function repairPriceApiPlugin() {
  return {
    name: 'repair-price-api',
    configureServer: registerRepairPriceApi,
    configurePreviewServer: registerRepairPriceApi,
  };
}
