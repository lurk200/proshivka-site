/**
 * Green Spark stock sync via Playwright (SSR HTML scraping).
 * Writes results to server/prise/data/supplier-stock.json.
 *
 * How it works:
 *   1. Launch headless Chromium → solve Qrator JS challenge automatically
 *   2. Navigate each catalog page with human-like delays
 *   3. Parse __NUXT_DATA__ (flat-ref array) to extract products
 *   4. Normalize to { id, name, url, retailPrice, quantity, shopName }
 */

import { createRequire } from 'module';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STOCK_FILE = join(__dirname, 'data/supplier-stock.json');
const SYNC_LOG_FILE = join(__dirname, 'data/supplier-sync-log.json');

const BASE_URL = 'https://green-spark.ru';
// Only scrape these subcategory URLs (most relevant for phone repair shops)
const TARGET_CATEGORIES = [
  '/catalog/komplektuyushchie_dlya_remonta/',
];
const MAX_PAGES_PER_CATEGORY = 3;
const PAGE_DELAY_MS = 3000;

function readSyncLog() {
  if (!existsSync(SYNC_LOG_FILE)) return { lastSync: null, status: 'never', count: 0, error: null };
  try { return JSON.parse(readFileSync(SYNC_LOG_FILE, 'utf8')); } catch { return { lastSync: null, status: 'never', count: 0, error: null }; }
}

function writeSyncLog(entry) {
  writeFileSync(SYNC_LOG_FILE, JSON.stringify({ ...readSyncLog(), ...entry, updatedAt: new Date().toISOString() }, null, 2));
}

export function getSyncLog() {
  return readSyncLog();
}

export function readStock() {
  if (!existsSync(STOCK_FILE)) return [];
  try { return JSON.parse(readFileSync(STOCK_FILE, 'utf8')); } catch { return []; }
}

/** Resolve a flat-ref Nuxt data array value */
function resolve(data, v) {
  if (typeof v !== 'number') return v;
  return data[v];
}

/** Parse a product entry from the flat Nuxt data array */
function extractProduct(data, idx) {
  const p = data[idx];
  if (!p || typeof p !== 'object') return null;

  const id = resolve(data, p.id);
  const name = resolve(data, p.name);
  const urlPath = resolve(data, p.url);
  const quantity = resolve(data, p.quantity); // 'many' | 'few' | 'none' | string

  if (!name || !id) return null;

  // Prices: first entry with name "Розница" (retail)
  const pricesRef = p.prices;
  const pricesArr = typeof pricesRef === 'number' ? data[pricesRef] : pricesRef;
  let retailPrice = null;
  if (Array.isArray(pricesArr)) {
    for (const pi of pricesArr) {
      const pr = typeof pi === 'number' ? data[pi] : pi;
      if (!pr) continue;
      const priceName = resolve(data, pr.name);
      const priceVal = resolve(data, pr.price ?? pr.priceWithoutDiscount);
      if (priceName && priceName.toLowerCase().includes('розниц')) {
        retailPrice = typeof priceVal === 'string' ? parseFloat(priceVal) : priceVal;
        break;
      }
    }
    // Fallback: first price
    if (retailPrice == null && pricesArr.length > 0) {
      const pr = typeof pricesArr[0] === 'number' ? data[pricesArr[0]] : pricesArr[0];
      if (pr) {
        const v = resolve(data, pr.price ?? pr.priceWithoutDiscount);
        retailPrice = typeof v === 'string' ? parseFloat(v) : v;
      }
    }
  }

  // Shops: find Stavropol shop
  const shopsRef = p.shops;
  const shopsArr = typeof shopsRef === 'number' ? data[shopsRef] : shopsRef;
  let shopName = null;
  let shopQty = quantity;
  if (Array.isArray(shopsArr)) {
    for (const si of shopsArr) {
      const s = typeof si === 'number' ? data[si] : si;
      if (!s) continue;
      const sName = resolve(data, s.name);
      const sQty = resolve(data, s.quantity);
      if (sName && /ставрополь/i.test(sName)) {
        shopName = sName;
        shopQty = sQty;
        break;
      }
    }
    if (!shopName && shopsArr.length > 0) {
      const s = typeof shopsArr[0] === 'number' ? data[shopsArr[0]] : shopsArr[0];
      if (s) shopName = resolve(data, s.name);
    }
  }

  return {
    id,
    name,
    url: urlPath ? BASE_URL + urlPath : null,
    quantity: shopQty || quantity || null,
    inStock: shopQty === 'many' || shopQty === 'few',
    retailPrice: retailPrice ?? null,
    shopName: shopName || 'GreenSpark Ставрополь',
    syncedAt: new Date().toISOString(),
  };
}

/** Parse all products from a loaded Nuxt page */
function parseNuxtProducts(nuxtData, pageUrl) {
  const pathKey = new URL(pageUrl).pathname + (new URL(pageUrl).search || '');
  // Find the object that contains the path key
  let catalogDataIdx = -1;
  for (let i = 0; i < Math.min(nuxtData.length, 20); i++) {
    const item = nuxtData[i];
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const matchKey = Object.keys(item).find(k => k === pathKey || k.startsWith(pathKey.replace(/\/$/, '')));
      if (matchKey) {
        catalogDataIdx = item[matchKey];
        break;
      }
    }
  }
  if (catalogDataIdx < 0) return { products: [], totalPages: 1 };

  const cat = nuxtData[catalogDataIdx];
  if (!cat || !cat.products) return { products: [], totalPages: 1 };

  const productsObj = typeof cat.products === 'number' ? nuxtData[cat.products] : cat.products;
  if (!productsObj) return { products: [], totalPages: 1 };

  const dataRef = productsObj.data;
  const dataArr = typeof dataRef === 'number' ? nuxtData[dataRef] : dataRef;
  if (!Array.isArray(dataArr)) return { products: [], totalPages: 1 };

  const products = dataArr.map(i => extractProduct(nuxtData, i)).filter(Boolean);

  // Pagination
  const paginationRef = productsObj.pagination;
  const paginationObj = typeof paginationRef === 'number' ? nuxtData[paginationRef] : paginationRef;
  let totalPages = 1;
  if (paginationObj) {
    const total = typeof paginationObj.totalPages === 'number' ? paginationObj.totalPages : resolve(nuxtData, paginationObj.totalPages);
    if (total) totalPages = total;
  }

  return { products, totalPages };
}

let syncRunning = false;

export async function runSync() {
  if (syncRunning) return { status: 'already_running' };
  syncRunning = true;
  writeSyncLog({ status: 'running', error: null });

  try {
    const require = createRequire(import.meta.url);
    const { chromium } = require('playwright');

    // Auto-install browser if binary is missing (e.g. after fresh deploy)
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
    } catch (launchErr) {
      if (launchErr.message?.includes("Executable doesn't exist")) {
        writeSyncLog({ status: 'running', error: null, _installing: true });
        execSync('npx playwright install chromium --with-deps', { stdio: 'inherit', timeout: 120000 });
        browser = await chromium.launch({ headless: true });
      } else {
        throw launchErr;
      }
    }
    const allProducts = [];

    try { // browser cleanup block
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();

      // Solve Qrator challenge by visiting main page (with networkidle to let JS run fully)
      await page.goto(BASE_URL + '/', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForFunction(() => !document.querySelector('meta[content="noindex, noarchive"]'), { timeout: 15000 });
      await new Promise(r => setTimeout(r, 3000));

      // Navigate organically: try to find catalog link and click it first
      const catalogAnchor = page.locator('a[href*="/catalog/"]').first();
      if (await catalogAnchor.count() > 0) {
        await catalogAnchor.click();
        await new Promise(r => setTimeout(r, PAGE_DELAY_MS));
      }

      for (const catPath of TARGET_CATEGORIES) {
        let page_num = 1;
        let totalPages = 1;

        while (page_num <= Math.min(totalPages, MAX_PAGES_PER_CATEGORY)) {
          const url = BASE_URL + catPath + (page_num > 1 ? `?page=${page_num}` : '');
          const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

          if (!resp || resp.status() !== 200) {
            // On 403, wait longer and retry once
            if (resp && resp.status() === 403 && page_num === 1) {
              await new Promise(r => setTimeout(r, 10000));
              const resp2 = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
              if (!resp2 || resp2.status() !== 200) break;
            } else {
              break;
            }
          }

          await page.waitForTimeout(2000);

          const nuxtData = await page.evaluate(() => {
            const script = document.getElementById('__NUXT_DATA__');
            return script ? JSON.parse(script.textContent) : null;
          });

          if (!nuxtData) break;

          const { products, totalPages: tp } = parseNuxtProducts(nuxtData, url);
          totalPages = tp;
          allProducts.push(...products);

          if (page_num < Math.min(totalPages, MAX_PAGES_PER_CATEGORY)) {
            await new Promise(r => setTimeout(r, PAGE_DELAY_MS));
          }
          page_num++;
        }

        // Delay between categories
        await new Promise(r => setTimeout(r, PAGE_DELAY_MS));
      }
    } finally {
      await browser.close();
    }

    // Remove duplicates by id
    const seen = new Set();
    const unique = allProducts.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    writeFileSync(STOCK_FILE, JSON.stringify(unique, null, 2));
    writeSyncLog({ status: 'ok', count: unique.length, lastSync: new Date().toISOString(), error: null });

    return { status: 'ok', count: unique.length };
  } catch (err) {
    writeSyncLog({ status: 'error', error: err.message, lastSync: new Date().toISOString() });
    return { status: 'error', error: err.message };
  } finally {
    syncRunning = false;
  }
}
