/**
 * Liberti.ru SSR provider — fetches model pages and parses product cards.
 *
 * City context: Liberti uses two cookies to set location:
 *   cityId=468776   — Stavropol city ID (from data-id in city picker)
 *   storeId=468777  — Stavropol store ID (from relCityStore JSON on page)
 *
 * Without these cookies the server returns Moscow inventory (IP-based default).
 * BITRIX_SM_SALE_LOCATION is NOT used by this site — verified empirically.
 */

import { buildSupplierQuery } from './greenSparkSync.js';
import { resolveModelUrl } from './libertiModelMap.js';

const BASE_URL = 'https://liberti.ru';
const CITY_LABEL = 'Ставрополь';

// Stavropol IDs extracted from Liberti city picker (data-id / relCityStore JSON).
// These are stable Bitrix entity IDs — unlikely to change.
const STAVROPOL_CITY_ID = '468776';
const STAVROPOL_STORE_ID = '468777';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.5',
};

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
 * Extract Stavropol cityId+storeId from the city-picker HTML.
 * Returns { cityId, storeId } or null.
 * Liberti embeds data-id / data-storeId on each <li> in the store-manager popup.
 */
function extractStavropolContext(html) {
  // <li data-id="468776" data-storeId="468777">...<span ...>Ставрополь</span>
  const m = html.match(/data-id="(\d+)"\s+data-storeId="(\d+)"[^>]*>[\s\S]{0,300}Ставрополь/i);
  if (m) return { cityId: m[1], storeId: m[2] };
  return null;
}

/**
 * Returns { cityId, storeId } to use for the Stavropol warehouse.
 * configuredCityId: if truthy, skips auto-detection and uses STAVROPOL_STORE_ID.
 */
export async function discoverCityId(configuredCityId = null) {
  if (configuredCityId) {
    // Already configured — return with known Stavropol store
    return { cityId: String(configuredCityId), storeId: STAVROPOL_STORE_ID };
  }

  // Auto-detect from main page
  try {
    const res = await fetch(`${BASE_URL}/`, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(15000) });
    const html = await res.text();
    const ctx = extractStavropolContext(html);
    if (ctx) return ctx;
  } catch {}

  // Fallback to hardcoded Stavropol IDs
  return { cityId: STAVROPOL_CITY_ID, storeId: STAVROPOL_STORE_ID };
}

async function fetchPage(url, cityCtx) {
  const headers = { ...FETCH_HEADERS };
  if (cityCtx?.cityId) {
    headers['Cookie'] = `cityId=${cityCtx.cityId}; storeId=${cityCtx.storeId ?? STAVROPOL_STORE_ID}`;
  }
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
    // Normalize &nbsp; to space so price/text regexes work reliably.
    // Liberti writes prices as "9890&nbsp;₽" which breaks \s* matchers.
    const seg = segments[i].replace(/&nbsp;/g, ' ');
    const prevSeg = segments[i - 1].replace(/&nbsp;/g, ' ');

    // SKU: first alphanumeric token after "Артикул: "
    const sku = seg.match(/^\s*([A-Za-z0-9][A-Za-z0-9_-]{2,})/)?.[1]?.trim() || null;

    // Price: first number followed by ₽ (handles "9890 ₽" after &nbsp; normalization).
    // Take the FIRST price in the block = wholesale/purchase price.
    const priceMatch = seg.match(/(\d[\d\s]{0,8})\s*₽/);
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

    // Title and URL live in the PREVIOUS segment (before "Артикул:").
    // Liberti wraps the product name in <span> inside the anchor:
    //   <a href="/product.html"><span>Product Name</span></a>
    // The old regex expected bare text; updated to allow optional <span> wrapper.
    const linkMatch =
      // <a href="..."><span>text</span></a>
      prevSeg.match(/href="(\/[^"]+\.html)"[^>]*>\s*<span[^>]*>([^<]{5,300})<\/span>/i) ||
      // <a href="..."><any-tag>text</any-tag></a>
      prevSeg.match(/href="(\/[^"]+\.html)"[^>]*>\s*<[^>]+>([^<]{5,300})<\/[^>]+>\s*<\/a>/i) ||
      // <a href="...">text</a>  (plain text, no wrapper)
      prevSeg.match(/href="(\/[^"]+\.html)"[^>]*>([^<]{5,300})<\/a>/i);
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
  // cityCtx = { cityId, storeId } — always has Stavropol fallback
  const cityCtx = await discoverCityId(configuredCityId);
  const cityId = cityCtx?.cityId ?? null;

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
    const html = await fetchPage(modelUrl, cityCtx);

    if ((html.includes('404') && html.includes('не найден')) || !html.includes('Артикул:')) {
      return { slug, products: [], error: null, cityId, guessed };
    }

    const products = parseLibertiProducts(html, supplierId, slug);
    return { slug, products, error: null, cityId, guessed };
  } catch (err) {
    return { slug, products: [], error: err.message, cityId, guessed };
  }
}
