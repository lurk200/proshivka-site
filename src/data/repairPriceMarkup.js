/** @typedef {'display' | 'battery' | 'port'} RepairKind */
/** @typedef {'apple' | 'samsung' | 'xiaomi' | 'other'} DeviceBrandId */

/**
 * Ориентиры по рынку РФ (2025–2026): запчасть + работа, «под ключ».
 * Для калибровки накрутки в админке, не подставляются автоматически.
 */
export const MARKET_PRICE_REFERENCE = [
  {
    brand: 'iPhone',
    source: 'Сеть сервисов (Москва / СПб, открытые прайсы)',
    rows: [
      { kind: 'display', label: 'Дисплей копия (OLED/AAA)', range: '6 500 – 12 000 ₽' },
      { kind: 'display', label: 'Дисплей оригинал', range: '15 000 – 21 000 ₽' },
      { kind: 'battery', label: 'Замена АКБ', range: '3 500 – 6 500 ₽' },
      { kind: 'port', label: 'Разъём / шлейф зарядки', range: '3 500 – 7 000 ₽' },
    ],
  },
  {
    brand: 'Samsung Galaxy',
    source: 'Средний сегмент сервисов',
    rows: [
      { kind: 'display', label: 'Дисплей (AMOLED/In-Cell)', range: '4 500 – 9 500 ₽' },
      { kind: 'battery', label: 'Замена АКБ', range: '2 500 – 4 500 ₽' },
      { kind: 'port', label: 'Нижний шлейф', range: '2 800 – 5 500 ₽' },
    ],
  },
  {
    brand: 'Xiaomi / Redmi / POCO',
    source: 'Массовый сегмент',
    rows: [
      { kind: 'display', label: 'Дисплей', range: '3 000 – 6 500 ₽' },
      { kind: 'battery', label: 'Замена АКБ', range: '1 800 – 3 200 ₽' },
      { kind: 'port', label: 'Разъём зарядки', range: '2 000 – 4 000 ₽' },
    ],
  },
];

export const PRICING_STRATEGY_HINTS = [
  'Цена TagGSM — закупка. Итог = запчасть + накрутка (%) + работа. На iPhone обычно выше % и работа.',
  'Дорогие запчасти (>12 000 ₽) часто получают +15–25% накрутки у конкурентов.',
  'Оригинал / Full ORIG — максимальная накрутка; копии — умеренная, чтобы попасть в вилку рынка.',
  'Минимальная цена «под ключ» не даёт уйти ниже рынка на дешёвых позициях.',
  'Округление до 100 ₽ делает прайс «как в сервисе» (6 900 / 7 500).',
];

/** @param {ReturnType<import('./repairPriceSettings.js').createDefaultRepairPriceSettings>} settings */
export function createDefaultBrandProfiles() {
  return [
    {
      id: 'apple',
      label: 'Apple / iPhone',
      enabled: true,
      keywords: ['iphone', 'ipad', 'apple'],
      partMarkupPercent: 10,
      laborMode: 'override',
      laborMultiplier: 1,
      labor: { display: 3200, battery: 1900, port: 2100 },
      minTotal: { display: 5900, battery: 3200, port: 3800 },
      flagshipKeywords: ['pro max', 'pro', 'ultra'],
      flagshipExtraPercent: 5,
      flagshipLaborAdd: 400,
    },
    {
      id: 'samsung',
      label: 'Samsung / Galaxy',
      enabled: true,
      keywords: ['samsung', 'galaxy'],
      partMarkupPercent: 6,
      laborMode: 'multiply',
      laborMultiplier: 1.15,
      labor: { display: 2400, battery: 1600, port: 1700 },
      minTotal: { display: 4500, battery: 2600, port: 3000 },
      flagshipKeywords: ['ultra', 'fold', 'flip'],
      flagshipExtraPercent: 4,
      flagshipLaborAdd: 300,
    },
    {
      id: 'xiaomi',
      label: 'Xiaomi / Redmi / POCO',
      enabled: true,
      keywords: ['xiaomi', 'redmi', 'poco', 'mi '],
      partMarkupPercent: 0,
      laborMode: 'base',
      laborMultiplier: 1,
      labor: { display: 2000, battery: 1500, port: 1500 },
      minTotal: { display: 3200, battery: 2200, port: 2500 },
      flagshipKeywords: ['ultra', 'pro+', 'pro plus'],
      flagshipExtraPercent: 3,
      flagshipLaborAdd: 200,
    },
  ];
}

export function createDefaultPriceBands() {
  return [
    { upTo: 3000, extraPercent: 5, label: 'до 3 000 ₽' },
    { upTo: 8000, extraPercent: 10, label: '3 001 – 8 000 ₽' },
    { upTo: 15000, extraPercent: 16, label: '8 001 – 15 000 ₽' },
    { upTo: null, extraPercent: 22, label: 'свыше 15 000 ₽' },
  ];
}

/** @param {string} modelLabel */
export function detectDeviceBrand(modelLabel) {
  const m = String(modelLabel || '').toLowerCase();
  if (/iphone|ipad|\bapple\b/.test(m)) return 'apple';
  if (/samsung|galaxy|гала/.test(m)) return 'samsung';
  if (/xiaomi|redmi|poco|mi\s+\d|mi\s+note/.test(m)) return 'xiaomi';
  return 'other';
}

/** @param {string} modelLabel @param {object} profile */
function isFlagshipModel(modelLabel, profile) {
  const m = String(modelLabel || '').toLowerCase();
  const keys = profile?.flagshipKeywords ?? [];
  return keys.some((k) => m.includes(String(k).toLowerCase()));
}

/**
 * @param {ReturnType<import('./repairPriceSettings.js').createDefaultRepairPriceSettings>} settings
 * @param {DeviceBrandId} brandId
 */
export function getBrandProfile(settings, brandId) {
  const profiles = settings.brandProfiles ?? [];
  if (brandId === 'other') return null;
  return profiles.find((p) => p.id === brandId && p.enabled !== false) ?? null;
}

/**
 * @param {ReturnType<import('./repairPriceSettings.js').createDefaultRepairPriceSettings>} settings
 * @param {number} partPrice
 */
export function getPriceBandExtraPercent(settings, partPrice) {
  const bands = settings.priceBands ?? [];
  const sorted = [...bands].sort((a, b) => {
    const au = a.upTo ?? Infinity;
    const bu = b.upTo ?? Infinity;
    return au - bu;
  });

  for (const band of sorted) {
    const limit = band.upTo ?? Infinity;
    if (partPrice <= limit) return Number(band.extraPercent) || 0;
  }
  return 0;
}

/**
 * @param {object} params
 * @param {number} params.partPrice
 * @param {string} params.tier
 * @param {RepairKind} params.kind
 * @param {string} [params.modelLabel]
 * @param {ReturnType<import('./repairPriceSettings.js').createDefaultRepairPriceSettings>} params.settings
 */
export function computeRepairPricing({ partPrice, tier, kind, modelLabel = '', settings }) {
  const m = settings.markup ?? {};
  const brandId = detectDeviceBrand(modelLabel);
  const profile = getBrandProfile(settings, brandId);
  const flagship = profile && isFlagshipModel(modelLabel, profile);

  let percent =
    Number(m.globalPercent || 0) +
    Number(m.byTier?.[tier] ?? 0) +
    Number(m.byCategory?.[kind] ?? 0) +
    getPriceBandExtraPercent(settings, partPrice);

  if (profile?.partMarkupPercent) percent += Number(profile.partMarkupPercent);
  if (flagship && profile?.flagshipExtraPercent) {
    percent += Number(profile.flagshipExtraPercent);
  }

  const markupRub = Math.round(partPrice * (percent / 100));
  const minMarkup = Number(m.minPartMarkupRub ?? 0);
  const partWithMarkup =
    partPrice + Math.max(markupRub, minMarkup) + Number(m.fixedRub || 0);

  const baseLabor = Number(settings.labor?.[kind] ?? settings.labor?.display ?? 0);
  let labor = baseLabor;

  if (profile) {
    if (profile.laborMode === 'override' && profile.labor?.[kind] != null) {
      labor = Number(profile.labor[kind]);
    } else if (profile.laborMode === 'multiply') {
      labor = Math.round(baseLabor * (Number(profile.laborMultiplier) || 1));
      if (profile.labor?.[kind] != null) {
        labor = Math.max(labor, Number(profile.labor[kind]));
      }
    }
    if (flagship && profile.flagshipLaborAdd) {
      labor += Number(profile.flagshipLaborAdd);
    }
  }

  let total = partWithMarkup + labor;

  const roundStep = Number(settings.rounding?.step ?? 0);
  if (settings.rounding?.enabled && roundStep > 0) {
    total = Math.round(total / roundStep) * roundStep;
  }

  const minTotal = profile?.minTotal?.[kind];
  if (minTotal != null && total < Number(minTotal)) {
    total = Number(minTotal);
  }

  return {
    partWithMarkup,
    labor,
    total,
    breakdown: {
      partPrice,
      percentTotal: percent,
      markupRub: Math.max(markupRub, minMarkup) + Number(m.fixedRub || 0),
      brandId,
      brandLabel: profile?.label ?? 'Базовые правила',
      flagship,
      bandExtra: getPriceBandExtraPercent(settings, partPrice),
      brandExtra: profile?.partMarkupPercent ?? 0,
    },
  };
}

/** Совместимость со старым API */
export function applyPartMarkup(partPrice, tier, kind, settings, modelLabel = '') {
  return computeRepairPricing({ partPrice, tier, kind, modelLabel, settings }).partWithMarkup;
}

/** @param {RepairKind} kind @param {object} settings @param {string} [modelLabel] */
export function resolveLaborPrice(kind, settings, modelLabel = '') {
  return computeRepairPricing({
    partPrice: 0,
    tier: 'copy',
    kind,
    modelLabel,
    settings,
  }).labor;
}

/** @param {unknown} saved */
export function mergeBrandProfiles(saved) {
  const defaults = createDefaultBrandProfiles();
  if (!Array.isArray(saved) || !saved.length) return defaults;
  return defaults.map((def) => {
    const found = saved.find((p) => p.id === def.id);
    return found
      ? {
          ...def,
          ...found,
          labor: { ...def.labor, ...found.labor },
          minTotal: { ...def.minTotal, ...found.minTotal },
          keywords: found.keywords?.length ? found.keywords : def.keywords,
        }
      : { ...def };
  });
}

/** @param {unknown} saved */
export function mergePriceBands(saved) {
  const defaults = createDefaultPriceBands();
  if (!Array.isArray(saved) || !saved.length) return defaults;
  return defaults.map((def, i) => {
    const band = saved[i] ?? {};
    const upTo =
      band.upTo === '' || band.upTo === undefined || band.upTo === null
        ? def.upTo ?? null
        : Number(band.upTo);
    return { ...def, ...band, upTo };
  });
}
