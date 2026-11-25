/** Правила калькулятора ремонта (seed + merge в CMS). */

export const POISKZIP = {
  cityId: 76,
  cityName: 'Ставрополь',
  primarySupplierId: 129,
  primarySupplierName: 'TAGGSM',
  backupSupplierId: 447,
  backupSupplierName: 'Liberti',
}

export const DEFAULT_CALCULATOR = {
  enabled: true,
  /**
   * Брать работу из баннера poiskzip «Установка в Ставрополе ≈ … ₽»
   * (stats.installation_cost). Если баннера нет — работа из категории.
   */
  usePoiskzipInstall: true,
  /** Наценка на закупку запчасти, % (поверх рыночной установки) */
  markupPercent: 15,
  /** Доставка, если позиция под заказ */
  deliveryFee: 500,
  /** Округление итоговой цены вверх до шага */
  roundTo: 50,
  categories: [
    {
      id: 'display',
      label: 'Дисплей',
      keywords: 'дисплей,экран,тачскрин,lcd,oled,incell',
      labor: 3000,
      /** Ниже этой суммы клиенту не показываем (защита от минуса) */
      minRepairPrice: 4500,
      warrantyDays: 90,
      termInStock: 'сегодня',
      termOnOrder: '3–5 дней',
    },
    {
      id: 'battery',
      label: 'Аккумулятор',
      keywords: 'акб,аккумулятор,батаре,battery',
      /** Как в прайсе сайта: типовая замена от 2500, работа отдельно от закупки */
      labor: 2500,
      minRepairPrice: 2500,
      warrantyDays: 90,
      termInStock: 'сегодня',
      termOnOrder: '2–4 дня',
    },
    {
      id: 'charging',
      label: 'Разъём / зарядка',
      keywords: 'разъём,разъем,зарядк,type-c,lightning,шлейф заряд',
      labor: 2000,
      minRepairPrice: 2000,
      warrantyDays: 60,
      termInStock: '1–2 дня',
      termOnOrder: '3–5 дней',
    },
    {
      id: 'camera',
      label: 'Камера',
      keywords: 'камер',
      labor: 2000,
      minRepairPrice: 2500,
      warrantyDays: 60,
      termInStock: '1–2 дня',
      termOnOrder: '3–5 дней',
    },
    {
      id: 'default',
      label: 'Прочее',
      keywords: '',
      labor: 2000,
      minRepairPrice: 2000,
      warrantyDays: 30,
      termInStock: '1–2 дня',
      termOnOrder: '3–7 дней',
    },
  ],
  /** Подсказки на странице калькулятора */
  suggestions: [
    'iPhone 13 дисплей',
    'iPhone 14 дисплей',
    'iPhone 13 АКБ',
    'iPhone 11 дисплей',
    'Samsung A54 дисплей',
    'Xiaomi Redmi Note 12 дисплей',
  ],
}

export function normalizeCalculator(raw) {
  const base = structuredClone(DEFAULT_CALCULATOR)
  if (!raw || typeof raw !== 'object') return base
  const categories =
    Array.isArray(raw.categories) && raw.categories.length
      ? raw.categories.map((c, i) => {
          const fallback = base.categories.find((b) => b.id === c.id) || base.categories[Math.min(i, base.categories.length - 1)]
          return {
            ...fallback,
            ...c,
            id: String(c.id || fallback.id || `cat-${i}`),
            label: String(c.label || fallback.label || 'Категория'),
            keywords: String(c.keywords ?? fallback.keywords ?? ''),
            labor: Number(c.labor) >= 0 ? Number(c.labor) : Number(fallback.labor) || 0,
            minRepairPrice:
              Number(c.minRepairPrice) >= 0
                ? Number(c.minRepairPrice)
                : Number(fallback.minRepairPrice) || 0,
            warrantyDays: Number(c.warrantyDays) >= 0 ? Number(c.warrantyDays) : Number(fallback.warrantyDays) || 0,
            termInStock: String(c.termInStock || fallback.termInStock || '1–2 дня'),
            termOnOrder: String(c.termOnOrder || fallback.termOnOrder || '3–7 дней'),
          }
        })
      : base.categories

  return {
    enabled: raw.enabled !== false,
    usePoiskzipInstall: raw.usePoiskzipInstall !== false,
    markupPercent: Number(raw.markupPercent) >= 0 ? Number(raw.markupPercent) : base.markupPercent,
    deliveryFee: Number(raw.deliveryFee) >= 0 ? Number(raw.deliveryFee) : base.deliveryFee,
    roundTo: Number(raw.roundTo) > 0 ? Number(raw.roundTo) : base.roundTo,
    categories,
    suggestions:
      Array.isArray(raw.suggestions) && raw.suggestions.length
        ? raw.suggestions.map(String).filter(Boolean)
        : base.suggestions,
  }
}

export function matchCategory(calculator, partName) {
  const name = String(partName || '').toLowerCase()
  const cats = calculator?.categories || DEFAULT_CALCULATOR.categories
  for (const cat of cats) {
    if (cat.id === 'default') continue
    const keys = String(cat.keywords || '')
      .split(/[,;]+/)
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean)
    if (keys.some((k) => name.includes(k))) return cat
  }
  return cats.find((c) => c.id === 'default') || cats[cats.length - 1] || DEFAULT_CALCULATOR.categories.at(-1)
}

export function roundRepairPrice(value, roundTo = 50) {
  const n = Number(value) || 0
  // 0 / пусто → шаг 1 (без деления на ноль); иначе заданный шаг
  const step = Number(roundTo) > 0 ? Number(roundTo) : 1
  return Math.ceil(n / step) * step
}

/**
 * Итог для клиента: закупка×(1+наценка%) + работа + доставка.
 *
 * Работа = баннер poiskzip «Установка ≈ N ₽» (stats.installation_cost) целиком —
 * это стоимость работы, не «ремонт под ключ». Если баннера нет — labor категории.
 * minRepairPrice применяется только без баннера (запасной режим).
 *
 * @param {object} [opts]
 * @param {boolean} [opts.onOrder]
 * @param {number|null} [opts.installationCost]
 */
export function buildClientPrice(partPrice, category, calculator, opts = {}) {
  const { onOrder = false, installationCost = null } = opts
  const part = Number(partPrice) || 0
  const markup = Number(calculator.markupPercent) || 0
  const delivery = onOrder ? Number(calculator.deliveryFee) || 0 : 0
  const minPrice = Number(category?.minRepairPrice) || 0

  const install = Number(installationCost)
  const useInstall =
    calculator.usePoiskzipInstall !== false && Number.isFinite(install) && install > 0
  const labor = useInstall ? install : Number(category?.labor) || 0

  const raw = part * (1 + markup / 100) + labor + delivery
  const withFloor = useInstall ? raw : Math.max(raw, minPrice)
  return roundRepairPrice(withFloor, calculator.roundTo)
}

function cleanModelSegment(seg) {
  let s = String(seg || '')
    .replace(/^Xiaomi\s+(?=Poco\b|Redmi\b)/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  // «Samsung SM-A546 Galaxy A54 5G» → «Galaxy A54 5G»
  const galaxy = s.match(/\b(Galaxy\s+[A-Z]?\d{1,3}(?:\s+\w+)?)/i)
  if (galaxy) return galaxy[1].trim()
  // «Samsung SM-A546 …» без Galaxy — убрать артикул
  s = s.replace(/^Samsung\s+SM-[A-Z0-9]+\s+/i, 'Samsung ').trim()
  return s
}

/** Упростить название для клиента: тип · модель(и) · качество. */
export function publicPartTitle(name) {
  const full = String(name || '').trim()
  if (!full) return 'Запчасть'

  const comma = full.indexOf(',')
  const quality = comma > 0 ? full.slice(comma + 1).trim() : ''
  const base = comma > 0 ? full.slice(0, comma).trim() : full

  const kind = /дисплей|экран/i.test(base)
    ? 'Дисплей'
    : /акб|аккумулятор|батаре/i.test(base)
      ? 'Аккумулятор'
      : /камер/i.test(base)
        ? 'Камера'
        : /разъём|разъем|заряд/i.test(base)
          ? 'Разъём зарядки'
          : 'Запчасть'

  // «Дисплей для Xiaomi Poco X5 5G / Redmi Note 12 5G + тачскрин (черный)»
  // Без \b — в JS граница слова плохо работает с кириллицей.
  let modelBlock = ''
  const forMatch = base.match(/для\s+(.+?)(?=\s*\+|\$|\s*\(|$)/i)
  if (forMatch) {
    modelBlock = forMatch[1].trim()
  } else {
    const modelMatch = base.match(
      /\b((?:Xiaomi\s+)?Poco\s+[\w][\w.\s-]*|(?:Xiaomi\s+)?Redmi\s+[\w][\w.\s-]*|iPhone\s+\d{1,2}(?:\s+(?:Pro|Plus|mini|Max))*|Galaxy\s+[A-Z]?\d{1,3}(?:\s*\w+)?|Xiaomi\s+[\w][\w.\s-]*|Pixel\s+\d[\w]*)/i,
    )
    modelBlock = modelMatch ? modelMatch[1].trim() : ''
  }

  const segments = modelBlock
    .split(/\s*\/\s*/)
    .map(cleanModelSegment)
    .filter(Boolean)

  let model = ''
  if (segments.length === 1) {
    model = segments[0]
  } else if (segments.length > 1) {
    // Первые две совместимые модели — как на poiskzip, но короче
    model = `${segments[0]} / ${segments[1]}`
    if (segments.length > 2) model += '…'
  }

  if (comma > 0) {
    return [kind, model, quality].filter(Boolean).join(' · ')
  }
  if (model) return [kind, model].filter(Boolean).join(' · ')
  return full.length > 90 ? `${full.slice(0, 87)}…` : full
}
