/** Порядок отображения вариантов (от премиум к базовым) */
export const TIER_ORDER = [
  'full-orig',
  'original',
  'oled-jcid',
  'soft-oled',
  'oled',
  'jcid',
  'copy-good',
  'copy',
];

const QUALITY_LABELS = {
  'full-orig': 'Full ORIG',
  original: 'Оригинал',
  'oled-jcid': 'OLED · JCID',
  'soft-oled': 'Soft OLED',
  oled: 'OLED',
  jcid: 'JCID',
  'copy-good': 'Копия хорошего качества',
  copy: 'Копия',
};

/**
 * @param {string} title
 * @param {string} [sectionName]
 */
export function detectRepairCategory(title, sectionName = '') {
  const t = title.toLowerCase();
  const section = sectionName.toLowerCase();

  if (/акб|аккумулятор/i.test(t) || /акб|аккумулятор/i.test(section)) {
    return 'battery';
  }

  const isDisplayShleif = /шлейф.*(?:диспл|lcd|матриц|экран)|(?:диспл|lcd|матриц|экран).*шлейф/i.test(t);
  if (
    !isDisplayShleif &&
    (/шлейф\s+(?:заряд|питани)|разъ?ем|разьем|коннектор\s+заряд|плата\s+заряд|нижн.*плат|гнездо\s+заряд|charging|type-?c.*шлейф|lightning.*шлейф/i.test(
      t,
    ) ||
      /разъ?ем|шлейф|заряд/i.test(section))
  ) {
    return 'port';
  }

  if (/дисплей/i.test(t) && !/скотч|подсветк|поляриз|стекло\s|плёнк|пленк/i.test(t)) {
    return 'display';
  }
  return null;
}

/**
 * @param {string} title
 * @param {'display' | 'battery'} kind
 */
export function classifyPartTier(title, kind) {
  const t = title.toLowerCase();

  if (kind === 'battery' || kind === 'port') {
    if (/ориг|original|orig\s*ic|service\s*pack|без ошибки.*ориг/i.test(t)) {
      return 'original';
    }
    if (/jcid|diagnosable/i.test(t)) return 'jcid';
    if (/повышенн|увелич/i.test(t)) return 'copy-good';
    return 'copy';
  }

  if (/full\s*orig(?:inal)?/i.test(t)) return 'full-orig';
  if (/оригинал|original|genuine|service\s*pack|\borg\b/i.test(t)) return 'original';
  if (/soft\s*oled/i.test(t) && /jcid|diagnosable/i.test(t)) return 'oled-jcid';
  if (/soft\s*oled/i.test(t)) return 'soft-oled';
  if (/oled/i.test(t) && /jcid|diagnosable|ltps/i.test(t)) return 'oled-jcid';
  if (/oled/i.test(t)) return 'oled';
  if (/jcid|diagnosable|ltps/i.test(t)) return 'jcid';
  if (/\bjk\b|\bgx\b|\balg\b|\brj\b|\bdd\b|\brd\b/i.test(t)) return 'copy-good';

  return 'copy';
}

/** @param {string} tier */
export function getQualityLabel(tier) {
  return QUALITY_LABELS[tier] ?? 'Копия';
}

/** @param {string} title */
export function extractVariantHint(title) {
  const parts = String(title || '').split(',');
  if (parts.length > 1) {
    return parts
      .slice(1)
      .join(',')
      .trim()
      .replace(/\s+/g, ' ');
  }
  const match = title.match(/\)\s*,\s*(.+)$/i);
  return match?.[1]?.trim() || '';
}

/** @param {string} category */
export function repairTypeLabel(category) {
  if (category === 'battery') return 'Замена аккумулятора';
  if (category === 'port') return 'Замена разъёма зарядки';
  return 'Замена дисплея';
}
