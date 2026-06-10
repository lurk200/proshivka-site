/** @typedef {'display' | 'battery' | 'port'} RepairKind */

/**
 * @typedef {Object} ParsedRepairQuery
 * @property {string} modelQuery — запрос модели для TagGSM
 * @property {RepairKind | null} repairKind — что ищет пользователь
 * @property {string | null} repairLabel — подпись для UI
 * @property {string} originalQuery
 */

const INTENT_RULES = [
  {
    kind: 'battery',
    label: 'Замена аккумулятора',
    strip: [
      /^(?:замена\s+)?(?:аккумулятор[ау]?|акб|батаре[яи]|батарейк[аи])\s+(?:на|для)\s+/i,
      /^(?:замена\s+)?(?:аккумулятор[ау]?|акб)\s+(?:на|для)\s+/i,
    ],
  },
  {
    kind: 'port',
    label: 'Замена разъёма зарядки',
    strip: [
      /^(?:замена\s+)?(?:разъ?ё?м[ау]?|разьем[а]?|коннектор[а]?|порт[а]?|гнезд[оа]\s+зарядки?)\s+(?:на|для)\s+/i,
      /^(?:замена\s+)?(?:шлейф[а]?\s+зарядки?|нижн(?:ий|его)\s+шлейф[а]?|плат[аы]\s+зарядки?)\s+(?:на|для)\s+/i,
      /^(?:замена\s+)?(?:разъ?ё?м[а]?|разьем[а]?)\s+(?:на|для)\s+/i,
    ],
  },
  {
    kind: 'display',
    label: 'Замена дисплея',
    strip: [
      /^(?:замена\s+)?(?:диспле[йя]|экран[а]?|матриц[аы]|модул[яь]|стекл[ао]?|дисплейного\s+модуля)\s+(?:на|для)\s+/i,
      /^диспле[йя]\s+на\s+/i,
      /^экран\s+на\s+/i,
      /^стекло\s+на\s+/i,
      /^матриц[аы]\s+на\s+/i,
    ],
  },
];

/** @param {string} phrase */
function inferKindFromServicePhrase(phrase) {
  const p = String(phrase || '').toLowerCase().trim();
  if (!p) return null;
  if (/аккумулятор|акб|батаре/i.test(p)) return 'battery';
  if (/разъ|разьем|коннектор|заряд|шлейф|type-?c|lightning|usb/i.test(p)) return 'port';
  if (/диспле|экран|стекл|матриц|модул/i.test(p)) return 'display';
  return null;
}

/** @param {RepairKind} kind */
export function repairIntentLabel(kind) {
  const rule = INTENT_RULES.find((r) => r.kind === kind);
  return rule?.label ?? null;
}

/** Базовая нормализация до разбора фраз */
export function normalizeSearchQuery(query) {
  return String(query || '')
    .trim()
    .replace(/ё/g, 'е')
    .replace(/айфон/gi, 'iphone')
    .replace(/самсунг/gi, 'samsung')
    .replace(/сяоми|ксиаоми/gi, 'xiaomi')
    .replace(/редми/gi, 'redmi')
    .replace(/галакси/gi, 'galaxy')
    .replace(/про\b/gi, 'pro')
    .replace(/макс/gi, 'max')
    .replace(/плюс/gi, 'plus')
    .replace(/разьем/gi, 'разъем')
    .replace(/\s+/g, ' ');
}

/**
 * Разбирает запросы вида «дисплей на iPhone 13», «замена аккумулятора на S24».
 * @param {string} query
 * @returns {ParsedRepairQuery}
 */
export function parseRepairQuery(query) {
  const originalQuery = String(query || '').trim();
  let working = normalizeSearchQuery(originalQuery);
  let repairKind = null;
  let repairLabel = null;

  for (const rule of INTENT_RULES) {
    for (const pattern of rule.strip) {
      const match = working.match(pattern);
      if (match) {
        repairKind = rule.kind;
        repairLabel = rule.label;
        working = working.slice(match[0].length).trim();
        break;
      }
    }
    if (repairKind) break;
  }

  if (!repairKind) {
    const naMatch = working.match(
      /^(?:(?:замена|ремонт|переклейка)\s+)?(?:(.+?)\s+)?на\s+(.+)$/i,
    );
    if (naMatch) {
      const servicePart = naMatch[1]?.trim() || '';
      const modelPart = naMatch[2]?.trim() || '';
      const inferred = inferKindFromServicePhrase(servicePart);
      if (inferred && modelPart.length >= 2) {
        repairKind = inferred;
        repairLabel = repairIntentLabel(inferred);
        working = modelPart;
      }
    }
  }

  if (!repairKind) {
    const suffixBattery = working.match(
      /^(.+?)\s+(?:замена\s+)?(?:аккумулятор[ау]?|акб)\s*$/i,
    );
    if (suffixBattery?.[1]?.trim().length >= 2) {
      repairKind = 'battery';
      repairLabel = repairIntentLabel('battery');
      working = suffixBattery[1].trim();
    }
  }

  const modelQuery = normalizeSearchQuery(working);

  return {
    modelQuery: modelQuery.length >= 2 ? modelQuery : normalizeSearchQuery(originalQuery),
    repairKind,
    repairLabel,
    originalQuery,
  };
}
