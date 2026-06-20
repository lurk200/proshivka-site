import {
  getModelSuggestions,
  getRepairQuote,
  getRepairPriceSettings,
  saveRepairSettings,
} from '../server/prise/repairQuoteService.js';
import { runSync, getSyncLog, readStock, buildSupplierQuery, findStockForModel, mergeIntoStock } from '../server/prise/greenSparkSync.js';
import { syncLibertiModel } from '../server/prise/libertiProvider.js';
import { buildModelMap, getMapStats, getMapBuildLog, LIBERTI_BRANDS } from '../server/prise/libertiModelMap.js';
import { computeSimplePrice } from '../src/data/repairCategorySettings.js';
import { repairTypeLabel, ALL_KNOWN_KINDS } from '../server/prise/partClassifier.js';
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
  getTrending,
  getDeviceCoverage,
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

function isAdminRequest(req) {
  return req.headers['x-admin-password'] === (process.env.VITE_ADMIN_PASSWORD || 'proshivka');
}

function requireAdmin(req, res) {
  if (!isAdminRequest(req)) {
    sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
    return false;
  }
  return true;
}

function idFromPath(pathname, prefix) {
  // e.g. /api/admin/services/svc_abc123 → svc_abc123
  return pathname.slice(prefix.length) || null;
}

const STOCK_TTL_MS = 6 * 60 * 60 * 1000; // re-sync Liberti after 6 hours

/**
 * Shared sync logic: resolve fresh supplier items for a model label.
 * Used by both the admin /supplier-parts endpoint and the public /model-price endpoint.
 * Returns { items, syncMeta } — items are RAW supplier records (not for public exposure).
 */
async function resolveSupplierItemsForModel(label, refresh = false) {
  const libertiSup = listSuppliers().find(s => s.dataSource?.type === 'ssr_page');
  let items = findStockForModel(label);

  const libertiCached = libertiSup ? items.filter(p => p.supplierId === libertiSup.id) : [];
  const hasFreshLibertiItems = !refresh && libertiCached.some(
    p => p.fetchedAt && Date.now() - new Date(p.fetchedAt).getTime() < STOCK_TTL_MS,
  );

  let syncMeta;

  if (!libertiSup) {
    syncMeta = { ran: false, reason: 'no-liberti-supplier' };
  } else if (hasFreshLibertiItems) {
    syncMeta = { ran: false, reason: 'fresh-cache', itemsForModel: libertiCached.length };
  } else {
    try {
      const result = await syncLibertiModel(
        label, libertiSup.id, libertiSup.dataSource?.cityId ?? null,
      );
      syncMeta = {
        ran: true,
        slug: result.slug,
        url: result.slug ? `https://liberti.ru/models/${result.slug}/` : null,
        cityId: result.cityId,
        count: result.products.length,
        error: result.error ?? null,
        guessed: result.guessed ?? false,
      };
      if (result.products.length > 0) {
        mergeIntoStock(result.products);
        const allStock = readStock();
        const libertiBySlug = allStock.filter(
          p => p.supplierId === libertiSup.id && p.model === result.slug,
        );
        const otherItems = findStockForModel(label, allStock).filter(
          p => p.supplierId !== libertiSup.id,
        );
        items = [...libertiBySlug, ...otherItems];
      } else {
        items = findStockForModel(label);
      }
    } catch (e) {
      syncMeta = { ran: true, error: e.message };
    }
  }

  return { items, syncMeta };
}

// Build reverse map: "Замена дисплея" → "display"
const REPAIR_TYPE_TO_KIND = Object.fromEntries(
  ALL_KNOWN_KINDS.map(k => [repairTypeLabel(k), k]),
);

// Canonical display order for merged categories
const CANONICAL_KIND_ORDER = [
  'display', 'battery', 'port', 'camera', 'camera-glass',
  'back-glass', 'housing', 'ear-speaker', 'speaker', 'microphone',
  'face-id', 'button', 'vibration',
];

// Simplified repair time per kind (mirrors taggsmProvider DEFAULT_REPAIR_TIMES)
const LIBERTI_REPAIR_TIMES = {
  display:        '1–2 часа',   battery:       '40–60 мин',
  port:           '1–2 часа',   camera:        '1–2 часа',
  'camera-glass': '30–60 мин',  'back-glass':  '1–2 часа',
  housing:        '2–3 часа',   'ear-speaker': '30–60 мин',
  speaker:        '30–60 мин',  microphone:    '30–60 мин',
  vibration:      '30–60 мин',  button:        '40–60 мин',
  'face-id':      '2–3 часа',
};

/** Derive a customer-facing quality label from a liberti product title. */
function getLibertiQualityLabel(title) {
  if (/\bOR\s+SP\b|100%\s+OR\b|оригинал/i.test(String(title || ''))) return 'Оригинал';
  return 'Совместимый';
}

/**
 * Enriches a TagGSM repair result with Liberti data for partTypes not covered by TagGSM.
 * TagGSM data is never overridden — Liberti fills gaps only.
 * Returns the same payload shape consumed by RepairResultsPanel.
 */
async function enrichWithLibertiData(payload, label, settings) {
  if (!payload?.categories) return payload;

  // Which partType kinds does TagGSM already cover?
  const coveredKinds = new Set(
    payload.categories.map(cat => REPAIR_TYPE_TO_KIND[cat.repairType]).filter(Boolean),
  );

  const { items } = await resolveSupplierItemsForModel(label, false);
  if (!items.length) return payload;

  // Per uncovered partType: pick the best available item (in_stock → cheapest)
  const priority = s => ({ in_stock: 0, low: 1, preorder: 2, out: 3 }[s] ?? 4);
  const bestByKind = new Map();
  for (const item of items) {
    const kind = item.partType;
    if (!kind || coveredKinds.has(kind)) continue;
    const cur = bestByKind.get(kind);
    const isBetter = !cur ||
      priority(item.stockStatus) < priority(cur.stockStatus) ||
      (priority(item.stockStatus) === priority(cur.stockStatus) &&
       Number(item.price ?? Infinity) < Number(cur.price ?? Infinity));
    if (isBetter) bestByKind.set(kind, item);
  }

  if (!bestByKind.size) return payload;

  const catSettings = settings?.categorySettings ?? {};
  const libertiCategories = [];

  for (const [kind, item] of bestByKind) {
    if (!item.price || item.stockStatus === 'out') continue;
    const clientPrice = computeSimplePrice(Number(item.price), kind, catSettings);
    if (!clientPrice) continue;
    const rt = LIBERTI_REPAIR_TIMES[kind] ?? '1–2 часа';
    const ql = getLibertiQualityLabel(item.title);
    libertiCategories.push({
      repairType: repairTypeLabel(kind),
      repairTime: rt,
      options: [{
        id: `liberti-${kind}`,
        partType: ql,
        qualityLabel: ql,
        variant: ql,
        totalPrice: clientPrice,
        inStock: item.stockStatus === 'in_stock' || item.stockStatus === 'low',
        repairTime: rt,
      }],
    });
  }

  if (!libertiCategories.length) return payload;

  // Merge and sort in canonical order
  const merged = [...payload.categories, ...libertiCategories];
  merged.sort((a, b) => {
    const ia = CANONICAL_KIND_ORDER.indexOf(REPAIR_TYPE_TO_KIND[a.repairType] ?? '');
    const ib = CANONICAL_KIND_ORDER.indexOf(REPAIR_TYPE_TO_KIND[b.repairType] ?? '');
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  return { ...payload, categories: merged };
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
              if (!requireAdmin(req, res)) return;
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
          const sid = url.searchParams.get('sessionId') || null;
          if (!model) return sendJson(res, 400, { error: 'Укажите модель устройства', code: 'MISSING_MODEL' });
          try {
            let payload = await getRepairQuote(model, label);
            if (!payload) return sendJson(res, 404, { error: 'Запчасть не найдена в наличии в Ставрополе', code: 'NOT_IN_STOCK' });
            try { logSearch(label || model, sid); } catch {}
            // Enrich with Liberti for partTypes not covered by TagGSM (fire-and-forget on error)
            if (label) {
              try { payload = await enrichWithLibertiData(payload, label, getRepairPriceSettings()); } catch {}
            }
            return sendJson(res, 200, payload);
          } catch {
            return sendJson(res, 503, { error: 'Не удалось проверить наличие. Попробуйте позже.', code: 'SERVICE_UNAVAILABLE' });
          }
        }

        // ── Supplier parts for model — ADMIN ONLY (raw supplier data) ──────
        if (pathname === '/api/repair-price/supplier-parts') {
          if (!requireAdmin(req, res)) return;
          const label = url.searchParams.get('label')?.trim() || '';
          const refresh = url.searchParams.get('refresh') === '1';
          if (!label) return sendJson(res, 400, { error: 'label required' });

          const supplierQuery = buildSupplierQuery(label);
          const { items, syncMeta } = await resolveSupplierItemsForModel(label, refresh);
          return sendJson(res, 200, { supplierQuery, items, stockTotal: readStock().length, syncMeta });
        }

        // ── Public model price — returns ONLY computed clientPrice per partType ──
        // No raw supplier fields (no title, sku, supplier price, supplierId, url).
        if (pathname === '/api/repair-price/model-price') {
          const label = url.searchParams.get('label')?.trim() || '';
          const refresh = url.searchParams.get('refresh') === '1';
          if (!label) return sendJson(res, 400, { error: 'label required' });

          const { items } = await resolveSupplierItemsForModel(label, refresh);
          if (!items.length) return sendJson(res, 200, { items: [] });

          const settings = getRepairPriceSettings();
          const catSettings = settings.categorySettings ?? {};

          // Per partType: pick the best available item (in_stock/low → cheapest).
          // Return ONLY public-safe fields: partType, clientPrice, stockStatus.
          const bestByType = new Map();
          const priority = (s) => ({ in_stock: 0, low: 1, preorder: 2, out: 3 }[s] ?? 4);
          for (const item of items) {
            const pt = item.partType;
            if (!pt) continue;
            const existing = bestByType.get(pt);
            const isBetter = !existing ||
              priority(item.stockStatus) < priority(existing.stockStatus) ||
              (priority(item.stockStatus) === priority(existing.stockStatus) &&
               Number(item.price ?? Infinity) < Number(existing.price ?? Infinity));
            if (isBetter) bestByType.set(pt, item);
          }

          const publicItems = [...bestByType.entries()].map(([partType, item]) => ({
            partType,
            stockStatus: item.stockStatus,
            clientPrice: item.price && Number(item.price) > 0
              ? computeSimplePrice(Number(item.price), partType, catSettings)
              : null,
          }));

          return sendJson(res, 200, { items: publicItems });
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
            const suppliers = listSuppliers();
            const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s]));
            const publicItems = items.map((item) => {
              const { partCost, purchasePrice, laborCost, lastChecked, history, ...pub } = item;
              const clientPrice = purchasePrice != null && purchasePrice > 0
                ? computeSimplePrice(purchasePrice, pub.partType, catSettings)
                : null;
              const freshness = getFreshnessStatus(item);
              const availability = purchasePrice != null && purchasePrice > 0
                ? (freshness === 'fresh' ? 'in_stock' : 'order')
                : 'enquire';
              // Explicit override → use it; null → derive from supplier city
              const sup = item.supplierId ? supplierMap[item.supplierId] : null;
              let inStockStavropol = item.inStockStavropol;
              if (inStockStavropol === null || inStockStavropol === undefined) {
                inStockStavropol = !!(sup?.city && /ставрополь/i.test(sup.city) && item.available && purchasePrice != null && purchasePrice > 0);
              }
              const deliveryDays = (!inStockStavropol && sup?.deliveryDays > 0) ? sup.deliveryDays : null;
              return { ...pub, clientPrice, availability, inStockStavropol, deliveryDays };
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
          if (!requireAdmin(req, res)) return;
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
          if (!requireAdmin(req, res)) return;
          try {
            const services = listServices({ archived: undefined });
            const popular = getPopular(20);
            const gaps = getGaps(services, 20);
            const stats = getStats();
            const trending = getTrending(20);
            const deviceCoverage = getDeviceCoverage(services, 20);
            return sendJson(res, 200, { popular, gaps, stats, trending, deviceCoverage });
          } catch (e) {
            return sendJson(res, 500, { error: String(e.message) });
          }
        }

        if (pathname === '/api/admin/services/mark-checked') {
          if (!requireAdmin(req, res)) return;
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
          if (!requireAdmin(req, res)) return;
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
          if (!requireAdmin(req, res)) return;
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
          if (!requireAdmin(req, res)) return;
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
          if (!requireAdmin(req, res)) return;
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
          if (!requireAdmin(req, res)) return;
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

        // ── Supplier stock sync (Green Spark) ─────────────────────────────
        if (pathname === '/api/admin/supplier-sync') {
          if (!requireAdmin(req, res)) return;
          if (req.method === 'GET') {
            return sendJson(res, 200, { log: getSyncLog(), stockCount: readStock().length });
          }
          if (req.method === 'POST') {
            // Start sync in background; return immediately
            runSync().catch(() => {});
            return sendJson(res, 202, { status: 'started' });
          }
          res.statusCode = 405; return res.end();
        }

        if (pathname === '/api/admin/supplier-stock') {
          if (!requireAdmin(req, res)) return;
          return sendJson(res, 200, { items: readStock() });
        }

        // ── Liberti model map ──────────────────────────────────────────────
        if (pathname === '/api/admin/liberti-model-map') {
          if (!requireAdmin(req, res)) return;
          if (req.method === 'GET') {
            const stats = getMapStats();
            const { running, log } = getMapBuildLog();
            return sendJson(res, 200, { stats, running, log });
          }
          if (req.method === 'POST') {
            // ?brands=apple,samsung  or no param = all brands
            const brandsParam = url.searchParams.get('brands');
            const brands = brandsParam
              ? brandsParam.split(',').map(b => b.trim()).filter(b => LIBERTI_BRANDS.includes(b))
              : LIBERTI_BRANDS;
            // Run in background — can take several minutes for all brands
            buildModelMap(brands).catch(() => {});
            return sendJson(res, 202, { status: 'started', brands });
          }
          res.statusCode = 405; return res.end();
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
