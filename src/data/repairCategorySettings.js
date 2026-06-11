/**
 * Simplified category-based pricing system.
 *
 * Formula: clientPrice = round((purchasePrice × (1 + markupPercent/100) + laborRate) / 100) × 100
 *
 * This system is intentionally separate from the TagGSM/tier-based markup engine
 * (repairPriceMarkup.js) so that shop owners only need to manage three values per category:
 *   1. Purchase price  — entered per service
 *   2. Markup percent  — set once per category
 *   3. Labor rate      — set once per category (overridable per service)
 */

export const PART_TYPE_LABELS = {
  display:        'Дисплей',
  glass:          'Стекло дисплея',
  battery:        'Аккумулятор',
  port:           'Разъём зарядки',
  'back-glass':   'Задняя крышка (стекло)',
  housing:        'Корпус',
  camera:         'Камера',
  'camera-glass': 'Стекло камеры',
  speaker:        'Динамик (полифон)',
  'ear-speaker':  'Слуховой динамик',
  microphone:     'Микрофон',
  'face-id':      'Face ID',
  button:         'Кнопки',
  flex:           'Шлейф',
  vibration:      'Вибромотор',
  keyboard:       'Клавиатура',
  water:          'После воды',
  diagnostic:     'Диагностика',
  other:          'Другое',
};

export const PART_TYPE_KEYS = Object.keys(PART_TYPE_LABELS);

export function createDefaultCategorySettings() {
  return {
    display:        { name: 'Дисплей',                markupPercent: 100, laborRate: 1500 },
    glass:          { name: 'Стекло дисплея',         markupPercent: 150, laborRate: 800  },
    battery:        { name: 'Аккумулятор',            markupPercent: 200, laborRate: 1000 },
    port:           { name: 'Разъём зарядки',         markupPercent: 250, laborRate: 1500 },
    'back-glass':   { name: 'Задняя крышка (стекло)', markupPercent: 150, laborRate: 800  },
    housing:        { name: 'Корпус',                 markupPercent: 120, laborRate: 2500 },
    camera:         { name: 'Камера',                 markupPercent: 150, laborRate: 1500 },
    'camera-glass': { name: 'Стекло камеры',          markupPercent: 200, laborRate: 500  },
    speaker:        { name: 'Динамик (полифон)',       markupPercent: 200, laborRate: 1000 },
    'ear-speaker':  { name: 'Слуховой динамик',       markupPercent: 200, laborRate: 1000 },
    microphone:     { name: 'Микрофон',               markupPercent: 200, laborRate: 1000 },
    'face-id':      { name: 'Face ID',                markupPercent: 150, laborRate: 2500 },
    button:         { name: 'Кнопки',                 markupPercent: 200, laborRate: 1000 },
    flex:           { name: 'Шлейф',                  markupPercent: 200, laborRate: 1000 },
    vibration:      { name: 'Вибромотор',             markupPercent: 200, laborRate: 800  },
    keyboard:       { name: 'Клавиатура',             markupPercent: 150, laborRate: 1200 },
    water:          { name: 'После воды',             markupPercent: 0,   laborRate: 2000 },
    diagnostic:     { name: 'Диагностика',            markupPercent: 0,   laborRate: 500  },
    other:          { name: 'Другое',                 markupPercent: 100, laborRate: 1000 },
  };
}

/**
 * Safe merge: known categories get their saved values merged over defaults.
 * Unknown categories from saved data are preserved as-is (future-proofing).
 *
 * @param {unknown} saved
 */
export function mergeRepairCategorySettings(saved) {
  const defaults = createDefaultCategorySettings();
  if (!saved || typeof saved !== 'object') return defaults;
  const result = { ...defaults };
  for (const [key, val] of Object.entries(saved)) {
    if (val && typeof val === 'object') {
      result[key] = { ...(defaults[key] ?? {}), ...val };
    }
  }
  return result;
}

/**
 * Compute the customer-facing price from a part's purchase cost.
 *
 * Returns null when purchasePrice is absent or ≤ 0 — caller should fall back
 * to priceFrom/priceTo ranges in that case.
 *
 * @param {number|null|undefined} purchasePrice — what the shop paid for the part
 * @param {string} partType — category key (e.g. 'display', 'battery')
 * @param {object|null|undefined} categorySettings — from getRepairSettings().categorySettings
 * @param {number|null} [laborOverride] — per-service labor override (null = use category default)
 * @returns {number|null}
 */
export function computeSimplePrice(purchasePrice, partType, categorySettings, laborOverride = null) {
  if (purchasePrice == null || purchasePrice <= 0) return null;

  const pp = Number(purchasePrice);
  if (!Number.isFinite(pp) || pp <= 0) return null;

  const defaults = createDefaultCategorySettings();
  const cats = categorySettings && typeof categorySettings === 'object' ? categorySettings : defaults;
  const cat = cats[partType] ?? defaults[partType] ?? { markupPercent: 100, laborRate: 1000 };

  const markupRub = pp * (Number(cat.markupPercent) / 100);
  const labor = laborOverride != null && Number.isFinite(Number(laborOverride))
    ? Number(laborOverride)
    : Number(cat.laborRate);

  const raw = pp + markupRub + labor;
  return Math.round(raw / 100) * 100;
}

/**
 * Get the effective labor rate for a part type.
 *
 * @param {string} partType
 * @param {object|null|undefined} categorySettings
 * @returns {number}
 */
export function getLaborRate(partType, categorySettings) {
  const defaults = createDefaultCategorySettings();
  const cats = categorySettings && typeof categorySettings === 'object' ? categorySettings : defaults;
  const cat = cats[partType] ?? defaults[partType];
  return cat ? Number(cat.laborRate) : 1000;
}

/**
 * Get the effective markup percent for a part type.
 *
 * @param {string} partType
 * @param {object|null|undefined} categorySettings
 * @returns {number}
 */
export function getMarkupPercent(partType, categorySettings) {
  const defaults = createDefaultCategorySettings();
  const cats = categorySettings && typeof categorySettings === 'object' ? categorySettings : defaults;
  const cat = cats[partType] ?? defaults[partType];
  return cat ? Number(cat.markupPercent) : 100;
}
