/** Ключи уровней качества запчастей (совпадают с partClassifier) */
import {
  createDefaultBrandProfiles,
  createDefaultPriceBands,
  mergeBrandProfiles,
  mergePriceBands,
} from './repairPriceMarkup.js';

export { applyPartMarkup, computeRepairPricing, resolveLaborPrice } from './repairPriceMarkup.js';

export const REPAIR_TIER_KEYS = [
  'full-orig',
  'original',
  'oled-jcid',
  'soft-oled',
  'oled',
  'jcid',
  'copy-good',
  'copy',
];

export const REPAIR_TIER_LABELS = {
  'full-orig': 'Full ORIG',
  original: 'Оригинал',
  'oled-jcid': 'OLED · JCID',
  'soft-oled': 'Soft OLED',
  oled: 'OLED',
  jcid: 'JCID',
  'copy-good': 'Копия хорошего качества',
  copy: 'Копия',
};

export function createDefaultRepairPriceSettings() {
  return {
    enabled: true,
    city: 'Ставрополь',
    labor: {
      display: 2000,
      battery: 1500,
      port: 1500,
    },
    markup: {
      globalPercent: 5,
      byTier: {
        'full-orig': 28,
        original: 22,
        'oled-jcid': 14,
        'soft-oled': 12,
        oled: 10,
        jcid: 10,
        'copy-good': 6,
        copy: 0,
      },
      byCategory: {
        display: 0,
        battery: 0,
        port: 0,
      },
      fixedRub: 0,
      minPartMarkupRub: 350,
    },
    brandProfiles: createDefaultBrandProfiles(),
    priceBands: createDefaultPriceBands(),
    rounding: {
      enabled: true,
      step: 100,
    },
    repairTime: {
      display: {
        default: '1–2 часа',
        premium: '2–3 часа',
        premiumThreshold: 10000,
      },
      battery: {
        default: '40–60 мин',
        premium: '1–2 часа',
        premiumThreshold: 8000,
      },
      port: {
        default: '1–2 часа',
        premium: '2–3 часа',
        premiumThreshold: 6000,
      },
    },
    maxOptionsPerCategory: 8,
  };
}

/** @param {unknown} saved */
export function mergeRepairPriceSettings(saved) {
  const base = createDefaultRepairPriceSettings();
  if (!saved || typeof saved !== 'object') return base;

  return {
    ...base,
    ...saved,
    labor: { ...base.labor, ...saved.labor },
    markup: {
      ...base.markup,
      ...saved.markup,
      byTier: { ...base.markup.byTier, ...saved.markup?.byTier },
      byCategory: { ...base.markup.byCategory, ...saved.markup?.byCategory },
    },
    brandProfiles: mergeBrandProfiles(saved.brandProfiles),
    priceBands: mergePriceBands(saved.priceBands),
    rounding: { ...base.rounding, ...saved.rounding },
    repairTime: {
      display: { ...base.repairTime.display, ...saved.repairTime?.display },
      battery: { ...base.repairTime.battery, ...saved.repairTime?.battery },
      port: { ...base.repairTime.port, ...saved.repairTime?.port },
    },
  };
}

/**
 * @param {number} partPrice — цена запчасти с накруткой
 * @param {'display' | 'battery' | 'port'} kind
 * @param {ReturnType<typeof createDefaultRepairPriceSettings>} settings
 */
export function getRepairTimeForPart(partPrice, kind, settings) {
  const block = settings.repairTime[kind];
  const threshold = block.premiumThreshold ?? 10000;
  return partPrice >= threshold ? block.premium : block.default;
}

export function repairTypeLabel(category) {
  if (category === 'battery') return 'Замена аккумулятора';
  if (category === 'port') return 'Замена разъёма зарядки';
  return 'Замена дисплея';
}
