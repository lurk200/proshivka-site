/**
 * Liberti model map: crawls /catalog_models/phone/{brand}/ pages,
 * collects (name → url) pairs, saves to liberti-model-map.json.
 *
 * Why: liberti uses numeric Bitrix IDs for models with special chars:
 *   "Samsung Galaxy S26+" → /models/samsung-galaxy-s26-1524498756/
 * Rule-based slug can't reproduce this. The map is the ground truth.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { buildSupplierQuery } from './greenSparkSync.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAP_FILE = join(__dirname, 'data/liberti-model-map.json');

const BASE_URL = 'https://liberti.ru';

export const LIBERTI_BRANDS = [
  'apple', 'samsung', 'xiaomi', 'huawei', 'realme',
  'oppo', 'vivo', 'tecno', 'infinix', 'oneplus',
  'nothing', 'telefony_google',
];

const PAGE_DELAY_MS = 800;
const MAX_PAGES_PER_BRAND = 60;

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9',
};

/**
 * Canonical key for map lookup.
 *   "Samsung Galaxy S26+"   → "samsung galaxy s26 plus"
 *   "Apple iPhone 11 A2221" → "apple iphone 11"
 *   "Xiaomi Redmi Note 13 Pro SM-S938B" → "xiaomi redmi note 13 pro"
 */
export function normalizeModelKey(name) {
  return buildSupplierQuery(name)     // strip SM-XXXX, A1234, EB-xxx
    .toLowerCase()
    .replace(/\+/g, ' plus')          // S26+ → s26 plus
    .replace(/[^\w\s]/g, ' ')         // remove other specials
    .replace(/\s+/g, ' ')
    .trim();
}

export function readModelMap() {
  if (!existsSync(MAP_FILE)) return {};
  try { return JSON.parse(readFileSync(MAP_FILE, 'utf8')); } catch { return {}; }
}

function writeModelMap(map) {
  writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
}

/** Extract /models/ links from a catalog page. */
function parseModelLinks(html) {
  const results = [];
  // href="/models/samsung-galaxy-s26-1524498756/">Samsung Galaxy S26+</a>
  const re = /href="(\/models\/[^"]+\/)"[^>]*>([^<]{2,120})<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const url = m[1];
    const name = m[2].replace(/\s+/g, ' ').trim();
    if (name && url) results.push({ name, url });
  }
  return results;
}

/** Find the highest PAGEN_1 value in pagination HTML. */
function findMaxPage(html) {
  let max = 1;
  const re = /PAGEN_1=(\d+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const n = parseInt(m[1], 10);
    if (n > max) max = n;
  }
  return max;
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function crawlBrand(brand, log) {
  const entries = [];
  const base = `${BASE_URL}/catalog_models/phone/${brand}/`;

  let html;
  try {
    html = await fetchHtml(base);
  } catch (e) {
    log(`${brand}: page 1 failed — ${e.message}`);
    return entries;
  }

  entries.push(...parseModelLinks(html));
  const maxPage = Math.min(findMaxPage(html), MAX_PAGES_PER_BRAND);
  log(`${brand}: ${maxPage} page(s) detected`);

  for (let p = 2; p <= maxPage; p++) {
    await new Promise(r => setTimeout(r, PAGE_DELAY_MS));
    try {
      const pageHtml = await fetchHtml(`${base}?PAGEN_1=${p}`);
      entries.push(...parseModelLinks(pageHtml));
    } catch (e) {
      log(`${brand} p${p}: ${e.message}`);
    }
  }

  return entries;
}

let _building = false;
const _buildLog = [];

export function getMapBuildLog() {
  return { running: _building, log: _buildLog.slice(-100) };
}

/**
 * Rebuild the model map for the given brands (default: all).
 * Runs in background; progress logged to _buildLog.
 */
export async function buildModelMap(brands = LIBERTI_BRANDS) {
  if (_building) return { status: 'already_running' };
  _building = true;
  _buildLog.length = 0;

  const log = (msg) => {
    _buildLog.push(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
  };

  try {
    const map = readModelMap();
    let added = 0;

    for (const brand of brands) {
      log(`Crawling ${brand}…`);
      const entries = await crawlBrand(brand, log);
      for (const { name, url } of entries) {
        const key = normalizeModelKey(name);
        if (key) {
          map[key] = { name, url, brand, updatedAt: new Date().toISOString() };
          added++;
        }
      }
      log(`${brand}: ${entries.length} models → total ${added}`);
    }

    writeModelMap(map);
    log(`Done. ${added} entries saved.`);
    return { status: 'ok', count: added };
  } catch (err) {
    log(`Error: ${err.message}`);
    return { status: 'error', error: err.message };
  } finally {
    _building = false;
  }
}

export function getMapStats() {
  const map = readModelMap();
  const keys = Object.keys(map);
  const brands = [...new Set(Object.values(map).map(v => v.brand).filter(Boolean))];
  const lastUpdated = keys.length
    ? Object.values(map).map(v => v.updatedAt).sort().at(-1)
    : null;
  return { count: keys.length, brands, lastUpdated };
}

/**
 * Resolve a model label to its real liberti URL using the map.
 *
 * Returns { url, name, brand, fromMap, guessed } or null if no slug either.
 */
export function resolveModelUrl(modelLabel) {
  const map = readModelMap();
  const key = normalizeModelKey(modelLabel);
  if (!key) return null;

  // 1. Exact key match
  if (map[key]) return { ...map[key], fromMap: true, guessed: false };

  // 2. Token-subset match (input tokens all present in map key)
  const tokens = key.split(/\s+/).filter(t => t.length >= 2);
  if (!tokens.length) return null;

  const candidates = Object.entries(map).filter(([k]) =>
    tokens.every(t => k.includes(t)),
  );

  if (candidates.length === 1) {
    return { ...candidates[0][1], fromMap: true, guessed: false };
  }

  if (candidates.length > 1) {
    // Pick shortest key = fewest extra words = most specific match
    candidates.sort((a, b) => a[0].length - b[0].length);
    return { ...candidates[0][1], fromMap: true, guessed: false };
  }

  return null;
}
