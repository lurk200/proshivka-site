import { computeSimplePrice } from '../../src/data/repairCategorySettings.js';
import {
  normalizeSearchQuery,
  parseRepairQuery,
} from '../../src/prise/utils/repairQueryParser.js';
import {
  TIER_ORDER,
  classifyPartTier,
  detectRepairCategory,
  extractVariantHint,
  getQualityLabel,
  repairTypeLabel,
} from './partClassifier.js';

const TAGGSM_ORIGIN = 'https://taggsm.ru';
const STAVROPOL = 'Ставрополь';

const FETCH_OPTIONS = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; ProshivkaService/1.0)',
    Accept: 'text/html,application/json,*/*',
  },
};

// All part categories the calculator searches for
const ALL_PART_KINDS = [
  'display', 'battery', 'port',
  'camera', 'camera-glass', 'back-glass', 'housing',
  'ear-speaker', 'speaker', 'microphone',
  'face-id', 'button', 'vibration',
];

// Default repair times per category (used when settings.repairTime doesn't cover the kind)
const DEFAULT_REPAIR_TIMES = {
  display:        { default: '1–2 часа',   premium: '2–3 часа',  threshold: 10000 },
  battery:        { default: '40–60 мин',  premium: '1–2 часа',  threshold: 8000  },
  port:           { default: '1–2 часа',   premium: '2–3 часа',  threshold: 6000  },
  camera:         { default: '1–2 часа',   premium: '2–3 часа',  threshold: 8000  },
  'camera-glass': { default: '30–60 мин',  premium: '1–2 часа',  threshold: 3000  },
  'back-glass':   { default: '1–2 часа',   premium: '1–2 часа',  threshold: 99999 },
  housing:        { default: '2–3 часа',   premium: '3–4 часа',  threshold: 15000 },
  'ear-speaker':  { default: '30–60 мин',  premium: '1–2 часа',  threshold: 3000  },
  microphone:     { default: '30–60 мин',  premium: '1–2 часа',  threshold: 3000  },
  speaker:        { default: '30–60 мин',  premium: '1–2 часа',  threshold: 3000  },
  vibration:      { default: '30–60 мин',  premium: '1–2 часа',  threshold: 3000  },
  button:         { default: '40–60 мин',  premium: '1–2 часа',  threshold: 5000  },
  'face-id':      { default: '2–3 часа',   premium: '3–4 часа',  threshold: 10000 },
};

function getRepairTimeForKind(kind, clientPrice, settings) {
  // Use per-category override from settings.repairTime when available
  const fromSettings = settings.repairTime?.[kind];
  if (fromSettings) {
    const threshold = fromSettings.premiumThreshold ?? 10000;
    return clientPrice >= threshold ? fromSettings.premium : fromSettings.default;
  }
  const block = DEFAULT_REPAIR_TIMES[kind] ?? DEFAULT_REPAIR_TIMES.display;
  return clientPrice >= block.threshold ? block.premium : block.default;
}

/** Устаревшие модели — скрываем при общем запросе без номера поколения */
const LEGACY_MODEL_PATTERN =
  /\b(iphone\s*(2g|3g|3gs|4s?|5c|5s?|6\s*plus|6s?|7\s*plus|7|8\s*plus|8|se\s*\(?\s*2016|se\s*\(?\s*2020)?|galaxy\s*s[0-5]\b|galaxy\s*note\s*[0-5]\b)/i;

/** Доп. запросы, если пользователь ввёл только бренд */
const BRAND_ENRICHMENT = {
  iphone: ['iphone 16', 'iphone 15', 'iphone 14', 'iphone 13', 'iphone 12'],
  айфон: ['iphone 16', 'iphone 15', 'iphone 14', 'iphone 13'],
  samsung: ['samsung s25', 'samsung s24', 'samsung a55', 'samsung a54'],
  самсунг: ['samsung s25', 'samsung s24', 'samsung a55'],
  galaxy: ['galaxy s25', 'galaxy s24', 'galaxy a55'],
  галакси: ['galaxy s25', 'galaxy s24'],
  xiaomi: ['xiaomi 15', 'xiaomi 14', 'redmi note 14', 'poco f6'],
  сяоми: ['xiaomi 15', 'xiaomi 14', 'redmi note 14'],
  redmi: ['redmi note 14', 'redmi 14c', 'redmi 13'],
  редми: ['redmi note 14', 'redmi 14c'],
  poco: ['poco f6', 'poco x6', 'poco f5'],
  honor: ['honor 200', 'honor 90'],
  huawei: ['huawei p60', 'huawei nova 12'],
};

const BRAND_ONLY = /^(iphone|айфон|samsung|самсунг|galaxy|галакси|xiaomi|сяоми|redmi|редми|poco|honor|huawei|apple|эпл)$/i;

/**
 * Человекочитаемое название: «iPhone 13 Pro», не только «Apple».
 * @param {Record<string, unknown>} item
 */
export function formatModelLabel(item) {
  const fabricator = String(item.name_fabricator || '').trim();
  const model = String(item.name_model || '')
    .trim()
    .replace(/\s+/g, ' ');
  const full = String(item.name_model2 || item.name_model_ || '')
    .trim()
    .replace(/\s+/g, ' ');

  if (model.length >= 2) {
    if (fabricator === 'Apple' && /^iphone/i.test(model)) {
      return model;
    }
    if (
      fabricator &&
      model.toLowerCase().includes(fabricator.toLowerCase())
    ) {
      return model;
    }
    if (
      fabricator &&
      !model.toLowerCase().startsWith(fabricator.toLowerCase())
    ) {
      return `${fabricator} ${model}`;
    }
    return model;
  }

  if (full.length >= 2) return normalizeDisplayModel(full);

  // Только бренд без модели — не показываем в подсказках
  if (/^(apple|samsung|xiaomi|huawei|honor|poco|redmi|google|oneplus)$/i.test(fabricator)) {
    return '';
  }

  return normalizeDisplayModel(fabricator || full);
}

const BRAND_ONLY_NAME =
  /^(apple|samsung|xiaomi|huawei|honor|poco|redmi|realme|google|oneplus|nokia|motorola|oppo|vivo|tecno|infinix|zte|meizu|asus|sony|lg)$/i;

/** @param {string} name */
export function isBrandOnlyName(name) {
  const cleaned = String(name || '').trim();
  if (!cleaned) return true;
  return BRAND_ONLY_NAME.test(cleaned);
}

/** @param {string} name */
export function normalizeDisplayModel(name) {
  const cleaned = String(name || '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!cleaned || isBrandOnlyName(cleaned)) return '';

  const appleIphone = cleaned.match(/^Apple\s+(iPhone\s+.+)$/i);
  if (appleIphone) return appleIphone[1];

  return cleaned;
}

/**
 * @param {Record<string, unknown>} item
 * @param {string} query
 */
function scoreModelMatch(item, query) {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  const label = formatModelLabel(item).toLowerCase();
  if (!label || label.length < 2) return -1;

  const full = String(item.name_model2 || item.name_model || '')
    .toLowerCase()
    .replace(/\s+/g, ' ');

  let score = 0;

  if (label === q || full === q) score += 2000;
  else if (label.startsWith(q) || full.startsWith(q)) score += 1200;
  else if (label.includes(q) || full.includes(q)) score += 600;
  else {
    const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
    const matched = tokens.filter((t) => label.includes(t) || full.includes(t)).length;
    score += matched * 120;
    if (matched === 0) return -1;
  }

  const gen = label.match(/iphone\s*(\d{1,2})/i);
  if (gen) score += Number.parseInt(gen[1], 10) * 20;

  const samsungGen = label.match(/s(\d{2})/i);
  if (samsungGen) score += Number.parseInt(samsungGen[1], 10) * 5;

  const queryHasDigits = /\d/.test(q);
  if (!queryHasDigits && LEGACY_MODEL_PATTERN.test(label)) score -= 800;

  return score;
}

/** @param {string} q */
function getEnrichmentQueries(q) {
  const key = q.toLowerCase().trim();
  if (!BRAND_ONLY.test(key)) return [];
  return BRAND_ENRICHMENT[key] ?? [];
}

/** @param {string} q */
async function fetchTaggsmRaw(q) {
  const url = `${TAGGSM_ORIGIN}/index.php?route=product/podbor/searchmodel5&name=${encodeURIComponent(q)}`;
  const res = await fetch(url, FETCH_OPTIONS);
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

/** @param {string} query */
export async function searchTaggsmModels(query) {
  const parsed = parseRepairQuery(query);
  const q = parsed.modelQuery;
  if (q.length < 2) return [];

  const extraQueries = getEnrichmentQueries(q);
  const batches = await Promise.all([
    fetchTaggsmRaw(q),
    ...extraQueries.map((eq) => fetchTaggsmRaw(eq)),
  ]);
  const data = batches.flat();

  const seen = new Set();

  return data
    .map((item) => ({
      id: String(item.reestr_model_id),
      label: formatModelLabel(item),
      _score: scoreModelMatch(item, q),
    }))
    .filter((row) => row._score >= 0 && row.label.length >= 2)
    .filter((row) => !/^(apple|samsung|xiaomi)$/i.test(row.label))
    .filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, 12)
    .map(({ id, label }) => ({ id, label }));
}

/** @param {string} modelId */
async function fetchPodborHtml(modelId) {
  const url = `${TAGGSM_ORIGIN}/index.php?route=product/podbor&reestr_model_id=${encodeURIComponent(modelId)}`;
  const res = await fetch(url, FETCH_OPTIONS);
  if (!res.ok) throw new Error('TAGGSM_UNAVAILABLE');
  return res.text();
}

/**
 * @param {string} html
 * @returns {{ title: string, partPrice: number, inStockStavropol: boolean, section: string }[]}
 */
function parsePodborProducts(html) {
  const products = [];
  let currentSection = '';

  const chunks = html.split(/<div class="(?:podbor_category_name|product-thumb)"/i);

  for (const chunk of chunks) {
    const sectionMatch = chunk.match(/^[^>]*>([^<]+)</i);
    if (sectionMatch && !chunk.includes('category_name')) {
      currentSection = sectionMatch[1].trim();
      continue;
    }

    if (!chunk.includes('category_name') && !chunk.includes('category_price')) continue;

    const title =
      chunk.match(/<div class="category_name">[\s\S]*?<a[^>]*>([^<]+)<\/a>/i)?.[1]?.trim() ||
      chunk.match(/\balt="([^"]+)"/i)?.[1]?.trim();
    if (!title) continue;

    const priceMatch = chunk.match(
      /<div class="category_price">[\s\S]*?<p>\s*([\d\s]+)\s*р/i,
    );
    const partPrice = priceMatch
      ? Number.parseInt(priceMatch[1].replace(/\s/g, ''), 10)
      : NaN;
    if (!Number.isFinite(partPrice) || partPrice <= 0) continue;

    products.push({
      title,
      partPrice,
      inStockStavropol: hasStavropolStock(chunk),
      section: currentSection,
    });
  }

  return products;
}

/** @param {string} block */
function hasStavropolStock(block) {
  const rows = [...block.matchAll(/<tr[^>]*>[\s\S]*?Ставрополь[\s\S]*?<\/tr>/gi)];
  for (const row of rows) {
    const html = row[0];
    if (/нет\s+в\s+наличии|#FF0606/i.test(html)) continue;
    if (/есть\s+в\s+наличии|#2B7E25|>\s*наличие/i.test(html)) return true;
  }
  return false;
}

/**
 * @param {{ title: string, partPrice: number, inStockStavropol: boolean, section: string }[]} products
 * @param {'display' | 'battery' | 'port'} kind
 * @param {import('../../src/data/repairPriceSettings.js').createDefaultRepairPriceSettings extends () => infer R ? R : never} settings
 * @param {string} modelLabel
 */
function buildCategoryOptions(products, kind, settings, modelLabel) {
  const tierMap = new Map();

  for (const product of products) {
    const category = detectRepairCategory(product.title, product.section);
    if (category !== kind || !product.inStockStavropol) continue;

    const tier = classifyPartTier(product.title, kind);
    const key = tier;
    const existing = tierMap.get(key);

    if (!existing || product.partPrice < existing.partPrice) {
      tierMap.set(key, {
        tier,
        partPrice: product.partPrice,
        variant: extractVariantHint(product.title),
        title: product.title,
      });
    }
  }

  const catSettings = settings.categorySettings ?? {};

  const options = [...tierMap.values()]
    .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
    .slice(0, settings.maxOptionsPerCategory)
    .map((row) => {
      // Apply admin-configured markup (markupPercent + laborRate per category)
      const totalPrice =
        computeSimplePrice(row.partPrice, kind, catSettings) ??
        Math.round((row.partPrice * 2) / 100) * 100;
      return {
        id: `${kind}-${row.tier}`,
        partType: getQualityLabel(row.tier),
        qualityLabel: getQualityLabel(row.tier),
        variant: row.variant || getQualityLabel(row.tier),
        totalPrice,
        inStock: true,
        repairTime: getRepairTimeForKind(kind, totalPrice, settings),
      };
    });

  if (!options.length) return null;

  return {
    repairType: repairTypeLabel(kind),
    repairTime: options[0].repairTime,
    options,
  };
}

/**
 * @param {{ title: string, partPrice: number, inStockStavropol: boolean, section: string }[]} products
 */
function buildRepairCategories(products, settings, repairKind = null, modelLabel = '') {
  const kinds = repairKind ? [repairKind] : ALL_PART_KINDS;
  const categories = [];
  for (const kind of kinds) {
    const block = buildCategoryOptions(products, kind, settings, modelLabel);
    if (block) categories.push({ ...block, kind });
  }
  return categories;
}

/**
 * @param {{ title: string }[]} products
 */
function extractModelFromProducts(products) {
  for (const product of products) {
    const match = product.title.match(
      /(?:дисплей|дисплея|акб|аккумулятор|модуль|стекло)\s+для\s+([^,+]+)/i,
    );
    if (!match) continue;
    const candidate = match[1].trim().replace(/\s+/g, ' ');
    const normalized = normalizeDisplayModel(candidate);
    if (normalized && !isBrandOnlyName(normalized)) return normalized;
  }
  return '';
}

/** @param {string} html @param {{ title: string }[]} [products] */
function extractModelLabel(html, products = []) {
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  if (title) {
    const raw = title.replace(/^Все запчасти для\s+/i, '').trim();
    const fromTitle = normalizeDisplayModel(raw);
    if (fromTitle && !isBrandOnlyName(fromTitle)) return fromTitle;
  }

  return extractModelFromProducts(products);
}

/**
 * @param {string} modelId
 * @param {string} [preferredLabel] — название из поиска (приоритет над кривым &lt;title&gt; TagGSM)
 */
export async function lookupRepairOptions(modelId, preferredLabel, settings, repairKind = null) {
  const html = await fetchPodborHtml(modelId);
  const products = parsePodborProducts(html);

  const fromPreferred = normalizeDisplayModel(preferredLabel || '');
  const modelLabel =
    (fromPreferred && !isBrandOnlyName(fromPreferred) ? fromPreferred : '') ||
    extractModelLabel(html, products) ||
    modelId;

  const categories = buildRepairCategories(products, settings, repairKind, modelLabel);

  if (!categories.length) return null;

  return {
    model: modelLabel,
    categories,
    repairKind: repairKind ?? null,
  };
}

/** @deprecated используйте lookupRepairOptions */
export async function lookupDisplayQuote(modelId) {
  const { getRepairSettings } = await import('./repairSettingsStore.js');
  const settings = getRepairSettings();
  const result = await lookupRepairOptions(modelId, undefined, settings);
  if (!result?.categories?.[0]?.options?.[0]) return null;
  const cat = result.categories[0];
  const opt = cat.options[0];
  return {
    model: result.model,
    repairType: cat.repairType,
    totalPrice: opt.totalPrice,
    inStock: true,
    repairTime: opt.repairTime,
  };
}

/**
 * @param {string} modelIdOrQuery
 * @param {string} [preferredLabel]
 */
export async function resolveModel(modelIdOrQuery, preferredLabel) {
  const raw = String(modelIdOrQuery || '').trim();
  if (!raw) return null;

  const safePreferred = normalizeDisplayModel(preferredLabel || '');

  if (/^\d+$/.test(raw)) {
    if (safePreferred) return { id: raw, label: safePreferred };

    const html = await fetchPodborHtml(raw);
    const products = parsePodborProducts(html);
    const label = extractModelLabel(html, products) || raw;
    return { id: raw, label };
  }

  const parsed = parseRepairQuery(raw.replace(/-/g, ' '));
  const searchText = parsed.modelQuery || raw.replace(/-/g, ' ');
  const normalized = searchText.toLowerCase();
  const models = await searchTaggsmModels(searchText);
  if (!models.length) return null;

  const exact = models.find((m) => m.label.toLowerCase() === normalized);
  if (exact) return exact;

  const byIncludes = models.filter(
    (m) =>
      m.label.toLowerCase().includes(normalized) ||
      normalized.includes(m.label.toLowerCase()),
  );
  if (byIncludes.length) return byIncludes[0];

  return models[0];
}

/** Публичный ответ без внутренних полей */
export function toPublicRepairResult(result) {
  if (!result) return null;
  return {
    model: result.model,
    categories: result.categories.map((cat) => ({
      repairType: cat.repairType,
      repairTime: cat.repairTime,
      options: cat.options.map((opt) => ({
        id: opt.id,
        partType: opt.partType,
        qualityLabel: opt.qualityLabel,
        variant: opt.variant,
        totalPrice: opt.totalPrice,
        inStock: opt.inStock,
        repairTime: opt.repairTime,
      })),
    })),
  };
}

/** @deprecated */
export function toPublicQuote(quote) {
  return toPublicRepairResult(
    quote
      ? {
          model: quote.model,
          categories: [
            {
              repairType: quote.repairType,
              repairTime: quote.repairTime,
              options: [
                {
                  id: 'legacy',
                  partType: quote.repairType,
                  qualityLabel: quote.repairType,
                  variant: '',
                  totalPrice: quote.totalPrice,
                  inStock: quote.inStock,
                  repairTime: quote.repairTime,
                },
              ],
            },
          ],
        }
      : null,
  );
}
