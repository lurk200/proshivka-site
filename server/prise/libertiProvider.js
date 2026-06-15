/**
 * Liberti.ru SSR provider — fetches model pages and parses product cards.
 * City context is set via BITRIX_SM_SALE_LOCATION cookie (auto-detected or configured).
 */

import { buildSupplierQuery } from './greenSparkSync.js';
import { resolveModelUrl } from './libertiModelMap.js';

const BASE_URL = 'https://liberti.ru';
const CITY_COOKIE = 'BITRIX_SM_SALE_LOCATION';
const CITY_LABEL = 'Ставрополь';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.5',
};

let _cachedCityId = null;

/**
 * Build a liberti model slug from a display label.
 *   "Samsung Galaxy S25 Ultra SM-S938B" → "samsung-galaxy-s25-ultra"
 *   "Apple iPhone 11"                   → "apple-iphone-11"
 *   "Xiaomi Redmi Note 13 Pro"          → "xiaomi-redmi-note-13-pro"
 */
export function buildLibertiSlug(label) {
  return buildSupplierQuery(label)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Search for Stavropol's Bitrix location ID inside raw HTML.
 * Tries several patterns common in 1C-Bitrix sites.
 */
function extractCityId(html) {
  // Pattern 1: JSON-like {"id":"123","name":"Ставрополь"} or reverse
  const jsonMatch =
    html.match(/"id"\s*:\s*"?(\d+)"?[^}]{0,200}"name"\s*:\s*"Ставрополь"/i) ||
    html.match(/"name"\s*:\s*"Ставрополь"[^}]{0,200}"id"\s*:\s*"?(\d+)"?/i);
  if (jsonMatch) return jsonMatch[1];

  // Pattern 2: data-location-id or data-city-id attribute near "Ставрополь"
  const attrFwd = html.match(/data-(?:location|city)-id="(\d+)"[^>]{0,300}>(?:[^<]*<[^/][^>]*>[^<]*){0,3}Ставрополь/is);
  if (attrFwd) return attrFwd[1];
  const attrBwd = html.match(/Ставрополь(?:[^<]*<\/[^>]+>){0,3}[^<]{0,200}data-(?:location|city)-id="(\d+)"/is);
  if (attrBwd) return attrBwd[1];

  // Pattern 3: href="/city/xxx/" link near Stavropol text
  const slugMatch = html.match(/href="\/city\/([^/]+)\/"[^>]{0,100}>Ставрополь/i) ||
    html.match(/Ставрополь[^<]{0,50}href="\/city\/([^/]+)\/"/i);
  if (slugMatch) return slugMatch[1]; // might be a slug, not a numeric ID

  // Pattern 4: LOCATION_ID hidden input
  const inputMatch = html.match(/LOCATION_ID[^>]*value="(\d+)"/i);
  if (inputMatch) return inputMatch[1];

  return null;
}

/**
 * Fetch the main page and auto-detect Stavropol's location ID.
 * Caches the result for the process lifetime.
 */
export async function discoverCityId(configured = null) {
  if (configured) return configured;
  if (_cachedCityId) return _cachedCityId;

  try {
    const res = await fetch(`${BASE_URL}/`, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(15000) });
    const html = await res.text();
    const id = extractCityId(html);
    if (id) {
      _cachedCityId = id;
      return id;
    }
  } catch {}

  return null;
}

async function fetchPage(url, cityId) {
  const headers = { ...FETCH_HEADERS };
  if (cityId) headers['Cookie'] = `${CITY_COOKIE}=${cityId}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** Map liberti "Тип:" string to internal partType. */
function mapPartType(typeStr) {
  if (!typeStr) return null;
  const t = typeStr.toLowerCase();
  if (/дисплей|экран|матриц|стекло.и.oca|переклейк/i.test(t)) return 'display';
  if (/акб|аккумулятор|батаре/i.test(t)) return 'battery';
  if (/нижн.*плат|разъем|зарядк|type.c|usb|lightning/i.test(t)) return 'port';
  if (/стекло\s*камер|линза\s*камер/i.test(t)) return 'camera-glass';
  if (/камер|объектив/i.test(t)) return 'camera';
  if (/задн.*крышк|задн.*стекл|крышка/i.test(t)) return 'back-glass';
  if (/корпус|рамка/i.test(t)) return 'housing';
  if (/динамик|полифон/i.test(t)) return 'speaker';
  if (/слухов|разговор/i.test(t)) return 'ear-speaker';
  if (/микрофон/i.test(t)) return 'microphone';
  if (/кнопк/i.test(t)) return 'button';
  if (/вибро/i.test(t)) return 'vibration';
  if (/face.id/i.test(t)) return 'face-id';
  return null;
}

function parsePrice(str) {
  if (!str) return null;
  const n = parseInt(String(str).replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Parse liberti model page HTML into normalized product records (Block 4 format).
 * Uses text anchors ("Артикул:", "Тип:", stock keywords, ₽) rather than CSS classes.
 */
export function parseLibertiProducts(html, supplierId, modelSlug) {
  const products = [];
  const fetchedAt = new Date().toISOString();

  if (!html.includes('Артикул:') && !html.includes('артикул')) return products;

  // Split on "Артикул:" — each block starts with the article number
  const segments = html.split(/Артикул:/i);

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const prevSeg = segments[i - 1];

    // SKU: first alphanumeric token
    const sku = seg.match(/^\s*([A-Za-z0-9][A-Za-z0-9_-]{2,})/)?.[1]?.trim() || null;

    // Price: number before ₽ or "р."
    const priceMatch = seg.match(/(\d[\d\s]{0,8})\s*[₽р]/);
    const price = parsePrice(priceMatch?.[1]);

    // Stock status
    const inStock = /В\s+наличии/i.test(seg);
    const lowStock = /Мало|Осталось\s+\d/i.test(seg);
    const preorder = /Под\s+заказ/i.test(seg);
    const stockStatus = inStock ? 'in_stock' : lowStock ? 'low' : preorder ? 'preorder' : 'out';

    // Part type from "Тип:" field (may be in either segment)
    const typeRaw =
      seg.match(/Тип:\s*([^\n<]{3,80})/i)?.[1]?.trim() ||
      prevSeg.match(/Тип:\s*([^\n<]{3,80})/i)?.[1]?.trim() ||
      null;
    const partType = mapPartType(typeRaw);

    // Title and URL: the <a href="...">...</a> leading into this product
    // It lives in the PREVIOUS segment (before "Артикул:")
    const linkMatch =
      prevSeg.match(/href="(\/[^"]+\.html)"[^>]*>([^<]{15,300})<\/a>/i) ||
      prevSeg.match(/href="(\/[^"]+\.html)"[^>]*>\s*<[^>]+>([^<]{15,300})<\/[^>]+>\s*<\/a>/i);
    const urlPath = linkMatch?.[1] || null;
    const title = linkMatch?.[2]?.replace(/\s+/g, ' ').trim() || null;

    if (!price || !title) continue;

    products.push({
      supplierId,
      model: modelSlug,
      partType,
      title,
      price,
      priceWholesale: null,
      stockStatus,
      city: CITY_LABEL,
      sku,
      url: urlPath ? `${BASE_URL}${urlPath}` : null,
      fetchedAt,
    });
  }

  return products;
}

/**
 * Fetch and parse a liberti model page.
 * URL is resolved from the model map; falls back to buildLibertiSlug if not mapped yet.
 * Returns normalized product records (Block 4 format).
 */
export async function syncLibertiModel(modelLabel, supplierId, configuredCityId = null) {
  const cityId = await discoverCityId(configuredCityId);

  // Try map first (real Bitrix URLs, handles + and other specials)
  const mapEntry = resolveModelUrl(modelLabel);
  let modelUrl, slug, guessed;

  if (mapEntry) {
    slug = mapEntry.url.replace(/^\/models\//, '').replace(/\/$/, '');
    modelUrl = `${BASE_URL}${mapEntry.url}`;
    guessed = false;
  } else {
    slug = buildLibertiSlug(modelLabel);
    if (!slug || slug.length < 3) return { slug: null, products: [], error: 'bad_slug', cityId, guessed: true };
    modelUrl = `${BASE_URL}/models/${slug}/`;
    guessed = true;
    console.warn(`[liberti] slug guessed for "${modelLabel}" → ${slug} (run map rebuild to fix)`);
  }

  try {
    const html = await fetchPage(modelUrl, cityId);

    if ((html.includes('404') && html.includes('не найден')) || !html.includes('Артикул:')) {
      return { slug, products: [], error: null, cityId, guessed };
    }

    const products = parseLibertiProducts(html, supplierId, slug);
    return { slug, products, error: null, cityId, guessed };
  } catch (err) {
    return { slug, products: [], error: err.message, cityId, guessed };
  }
}
