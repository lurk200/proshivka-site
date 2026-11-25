/**
 * Пояснения типов комплектующих для клиента.
 * Дисплей и АКБ — разные тексты; нет совпадения → null (без «?» и без универсального бреда).
 */

/** @typedef {{ id: string, test: (q: string) => boolean, label: string, points: string[] }} QualityGuide */

/** @type {QualityGuide[]} */
const DISPLAY_GUIDES = [
  {
    id: 'orig-glass-replaced',
    test: (q) => /заменен[оа]\s*стекл|переклеен|стекло\s*замен/i.test(q),
    label: 'Оригинал, заменено стекло',
    points: [
      'Внутри — оригинальная матрица, сверху новое стекло',
      'Картинка близка к «родному» экрану, цена ниже полного модуля',
      'Сенсор и рамка могут отличаться от заводских',
      'Не то же самое, что метка «ОРИГ 100%»',
      'Берут, когда важна картинка, но полный оригинал дорог',
    ],
  },
  {
    id: 'orig100',
    test: (q) => /ориг\s*100|ориг100|orig\s*100|full\s*orig/i.test(q),
    label: 'ОРИГ 100% / Full ORIG',
    points: [
      'Заявлен как полный оригинальный модуль дисплея',
      'Обычно лучшие цвета, яркость и отклик в списке',
      'Самый дорогой вариант среди похожих позиций',
      'Выше короткой метки «ориг»',
      'Берут, когда нужно «как с завода»',
    ],
  },
  {
    id: 'orig',
    test: (q) => {
      const t = q.trim()
      if (/ориг\s*100|ориг100|full\s*orig|заменен[оа]\s*стекл/i.test(t)) return false
      return /^(ориг|оригинал|orig)\b/i.test(t) || /(^|[^а-яa-z0-9%])ориг(инал)?($|[^а-яa-z0-9%])/i.test(t)
    },
    label: 'Оригинал (ориг)',
    points: [
      'Оригинальная или заводская восстановленная матрица',
      'Заметно лучше копий In-Cell и простых OLED',
      'Дешевле маркировки «ОРИГ 100%»',
      'Не путать с «оригинал, заменено стекло»',
      'Средний/высокий сегмент по цене среди экранов',
    ],
  },
  {
    id: 'soft-oled-jcid',
    test: (q) => /soft\s*oled/i.test(q) && /jcid/i.test(q),
    label: 'SOFT OLED JCID',
    points: [
      'Гибкая OLED-матрица + контроллер JCID',
      'Чаще без сбоев яркости и True Tone после замены',
      'Выше обычного Soft OLED JK / DD по совместимости',
      'Дороже JK / In-Cell, дешевле полного оригинала',
      'Частый выбор «почти оригинал» без ОРИГ 100%',
    ],
  },
  {
    id: 'soft-oled-jk',
    test: (q) => /soft\s*oled/i.test(q) && /(^|[^a-z])jk([^a-z]|$)/i.test(q),
    label: 'SOFT OLED JK',
    points: [
      'Гибкая OLED-сборка бренда JK',
      'Картинка ближе к оригиналу, чем у In-Cell',
      'Часто идёт со шлейфом IC',
      'Ниже Soft OLED JCID и оригинала',
      'JK — бренд копии, не «оригинальный экран»',
    ],
  },
  {
    id: 'soft-oled-dd',
    test: (q) => /soft\s*oled/i.test(q) && /(^|[^a-z])dd([^a-z]|$)/i.test(q),
    label: 'SOFT OLED DD',
    points: [
      'Гибкая OLED-сборка бренда DD',
      'Контраст и цвета лучше жёсткого OLED / In-Cell',
      'Вариант «Diagnosable / без ошибки» реже ругается в настройках',
      'Цена обычно рядом с Soft OLED JK',
      'DD — поставщик копии, не завод Apple',
    ],
  },
  {
    id: 'soft-oled',
    test: (q) => /soft\s*oled/i.test(q),
    label: 'SOFT OLED',
    points: [
      'Гибкая OLED, визуально ближе к оригиналу iPhone',
      'Контраст и цвета лучше обычного OLED / In-Cell',
      'Это качественная копия, не оригинал',
      'Цена между обычным OLED и «ориг»',
      'Буквы JK / DD / JCID рядом уточняют бренд сборки',
    ],
  },
  {
    id: 'oled-jcid',
    test: (q) => /\boled\b/i.test(q) && /jcid/i.test(q) && !/soft/i.test(q),
    label: 'OLED JCID',
    points: [
      'OLED-копия с контроллером JCID',
      'Чаще корректно держит яркость и служебные функции',
      'Картинка лучше In-Cell, но это не ОРИГ 100%',
      'Дороже простых GX / JK без JCID',
      'Берут за стабильность после замены экрана',
    ],
  },
  {
    id: 'oled-alg',
    test: (q) => /\boled\b/i.test(q) && /\balg\b/i.test(q),
    label: 'OLED ALG',
    points: [
      'OLED-панель бренда ALG',
      'Обычно ярче и контрастнее In-Cell',
      'Класс копии — не заводской оригинал',
      'Цена среднего сегмента среди экранов',
      'Отличается от Soft OLED конструкцией матрицы',
    ],
  },
  {
    id: 'oled-gx',
    test: (q) => /\boled\b/i.test(q) && /(^|[^a-z])gx([^a-z]|$)/i.test(q),
    label: 'OLED GX',
    points: [
      'OLED-копия производителя GX',
      'Картинка сильнее бюджетного In-Cell',
      'Ниже Soft OLED и оригинала',
      'Часто идёт со шлейфом IC',
      'GX без слова OLED в названии — другой (обычно проще) класс',
    ],
  },
  {
    id: 'oled',
    test: (q) => /\boled\b/i.test(q) && !/soft/i.test(q),
    label: 'OLED',
    points: [
      'OLED-матрица: чёрный глубже, чем у In-Cell',
      'Копия дисплея, не оригинал Apple / Samsung',
      'Дороже In-Cell, дешевле «ориг» и ОРИГ 100%',
      'GX / JK / JCID рядом — бренд сборки',
      'Берут за картинку без цены полного оригинала',
    ],
  },
  {
    id: 'incell-kqi',
    test: (q) => /in-?cell/i.test(q) && /kqi/i.test(q),
    label: 'In-Cell KQI',
    points: [
      'Бюджетный In-Cell, сборка KQI',
      'Чуть стабильнее безымянного In-Cell, всё ещё копия TFT',
      'Яркость и углы обзора слабее OLED / оригинала',
      'Один из самых дешёвых экранов в выдаче',
      'Для «починить недорого», не для максимальной картинки',
    ],
  },
  {
    id: 'incell-gx',
    test: (q) => /in-?cell/i.test(q) && /(^|[^a-z])gx([^a-z]|$)/i.test(q),
    label: 'In-Cell GX',
    points: [
      'In-Cell-сборка бренда GX',
      'Дешевле OLED, картинка типичная для In-Cell (тусклее OLED)',
      'Часто со шлейфом IC',
      'Не Soft OLED и не оригинал',
      'Эконом-ремонт экрана с известным брендом копии',
    ],
  },
  {
    id: 'incell-dd',
    test: (q) => /in-?cell/i.test(q) && /(^|[^a-z])dd([^a-z]|$)/i.test(q),
    label: 'In-Cell DD',
    points: [
      'In-Cell с маркировкой DD',
      'Дешевле OLED, картинка типичная для In-Cell',
      'Не оригинал и не Soft OLED',
      'Подходит как эконом-замена экрана',
      'От «просто In-Cell» отличается в основном сборкой DD',
    ],
  },
  {
    id: 'incell',
    test: (q) => /in-?cell/i.test(q),
    label: 'In-Cell',
    points: [
      'Самый бюджетный тип дисплея-копии',
      'Матрица TFT: тусклее и «серее», чем OLED',
      'Сенсор встроен в слой — конструкция проще оригинала',
      'Минимальная цена ремонта экрана в списке',
      'Если важны цвета и яркость — смотрите OLED / ориг',
    ],
  },
  {
    id: 'gx',
    test: (q) => /(^|[^a-zа-я])gx([^a-zа-я]|$)/i.test(q),
    label: 'GX',
    points: [
      'Копия экрана бренда GX',
      'Обычно средний сегмент: лучше голого In-Cell',
      'Это не оригинал и не ОРИГ 100%',
      'Если в названии есть OLED — картинка лучше обычного GX',
      'Берут как компромисс цена / картинка',
    ],
  },
  {
    id: 'jk',
    test: (q) => /(^|[^a-zа-я])jk([^a-zа-я]|$)/i.test(q) && !/jcid/i.test(q),
    label: 'JK',
    points: [
      'Копия бренда JK (частый вариант на iPhone)',
      'Часто со шлейфом IC — меньше сюрпризов после замены',
      'Классом выше простого In-Cell',
      'Ниже Soft OLED JCID и оригинала',
      'Не означает «оригинальный дисплей»',
    ],
  },
  {
    id: 'dd',
    test: (q) => /(^|[^a-zа-я])dd([^a-zа-я]|$)/i.test(q),
    label: 'DD',
    points: [
      'Копия бренда DD для экрана',
      'Качество зависит от типа матрицы: In-Cell или Soft OLED',
      'Не оригинал Apple',
      'Смотрите In-Cell / Soft OLED рядом с DD в названии',
      'Средний эконом-сегмент среди копий',
    ],
  },
  {
    id: 'jcid',
    test: (q) => /jcid/i.test(q),
    label: 'JCID',
    points: [
      'Экранная сборка с контроллером JCID',
      'Чаще сохраняет яркость, True Tone, меньше ошибок системы',
      'Важнее на новых iPhone с проверкой запчасти',
      'Дороже копий экрана без JCID',
      'Сама матрица всё равно копия, если нет метки «ориг»',
    ],
  },
  {
    id: 'diagnosable',
    test: (q) => /diagnosable|без\s*ошибк/i.test(q),
    label: 'Без ошибки / Diagnosable',
    points: [
      'После замены реже всплывает предупреждение «неоригинальный экран»',
      'Важно для iPhone с учётом запчастей в настройках',
      'Не делает матрицу автоматически оригинальной',
      'Обычно дороже такой же копии «с ошибкой»',
      'Тип матрицы смотрите отдельно: Soft OLED, ориг и т.д.',
    ],
  },
]

/** @type {QualityGuide[]} */
const BATTERY_GUIDES = [
  {
    id: 'batt-no-chip',
    test: (q) => /без\s*чип|без\s*контроллер/i.test(q),
    label: 'АКБ без чипа',
    points: [
      'Нет контроллера состояния батареи',
      'Процент заряда и «Состояние АКБ» могут не показывать правду',
      'Самый дешёвый тип аккумулятора',
      'Хватает как временная замена',
      'Для нормальной индикации берите АКБ с чипом / ориг',
    ],
  },
  {
    id: 'batt-orig',
    test: (q) => {
      const t = q.trim()
      if (/ориг\s*100|ориг100/i.test(t)) return false
      return /(^|[^а-яa-z0-9%])ориг(инал)?($|[^а-яa-z0-9%])/i.test(t) || /\borig\b/i.test(t)
    },
    label: 'АКБ оригинал',
    points: [
      'Оригинальный или восстановленный аккумулятор',
      'Обычно стабильнее держит заряд, чем дешёвые копии',
      'Индикация процента и «Состояние АКБ» работают корректнее',
      'Дороже копий без чипа и простых HC',
      'Не путать с «без чип-контроллера» — это другой класс',
    ],
  },
  {
    id: 'batt-hc',
    test: (q) => /(^|[^a-zа-я])hc([^a-zа-я]|$)|повышенн\w*\s*ёмк/i.test(q),
    label: 'АКБ повышенной ёмкости',
    points: [
      'Заявлена ёмкость выше стандартной',
      'Должна дольше держать заряд между подзарядками',
      'Иногда чуть толще обычной батареи',
      'Дороже базовой АКБ',
      'Это не автоматически «оригинал Apple»',
    ],
  },
  {
    id: 'batt-jcid',
    test: (q) => /jcid/i.test(q),
    label: 'АКБ JCID',
    points: [
      'Аккумулятор с контроллером JCID',
      'Чаще корректно показывает процент и «Состояние АКБ»',
      'Меньше ошибок системы после замены батареи',
      'Дороже АКБ без чипа',
      'Ёмкость смотрите отдельно: обычная или HC',
    ],
  },
  {
    id: 'batt-diagnosable',
    test: (q) => /diagnosable|без\s*ошибк|relife/i.test(q),
    label: 'АКБ без ошибки',
    points: [
      'После замены реже появляется предупреждение о неоригинальной батарее',
      'Важно на iPhone с учётом запчастей',
      'Не делает аккумулятор автоматически оригинальным',
      'Обычно дороже такой же АКБ «с ошибкой»',
      'Ёмкость и чип смотрите в названии отдельно',
    ],
  },
]

/**
 * @param {string} text
 * @returns {'display' | 'battery' | 'other'}
 */
export function detectPartKind(text) {
  const s = String(text || '')
  if (/акб|аккумулятор|батаре/i.test(s)) return 'battery'
  if (/дисплей|экран|тачскрин|oled|in-?cell/i.test(s)) return 'display'
  return 'other'
}

/**
 * @param {string} qualityRaw
 * @param {{ kind?: 'display' | 'battery' | 'other', title?: string, name?: string }} [ctx]
 * @returns {{ id: string, label: string, points: string[] } | null}
 */
export function resolveQualityGuide(qualityRaw, ctx = {}) {
  const q = String(qualityRaw || '').trim()
  if (!q) return null

  const kind =
    ctx.kind ||
    detectPartKind([ctx.title, ctx.name, q].filter(Boolean).join(' '))

  /** @type {QualityGuide[]} */
  let guides
  if (kind === 'battery') guides = BATTERY_GUIDES
  else if (kind === 'display') guides = DISPLAY_GUIDES
  else guides = [...BATTERY_GUIDES, ...DISPLAY_GUIDES]

  for (const guide of guides) {
    if (!guide.points?.length) continue
    if (guide.test(q)) {
      return {
        id: guide.id,
        label: guide.label,
        points: guide.points.slice(0, 5),
      }
    }
  }
  return null
}

/** Достать сегмент качества из публичного title или сырого имени. */
export function extractQualityKey(titleOrName) {
  const s = String(titleOrName || '').trim()
  if (!s) return ''
  if (s.includes(' · ')) {
    const parts = s.split(' · ').map((p) => p.trim()).filter(Boolean)
    return parts[parts.length - 1] || ''
  }
  const comma = s.indexOf(',')
  if (comma > 0) return s.slice(comma + 1).trim()
  return s
}

/**
 * Короткий бейдж рядом с «?» — чтобы клиент видел класс экрана без открытия тултипа.
 * @param {string} text — qualityLabel, qualityKey или title
 * @returns {{ id: string, text: string, tone: 'basic' | 'good' | 'premium' } | null}
 */
export function resolveQualityHint(text) {
  const q = String(text || '')
  if (!q) return null

  // Оригинал / Service Pack — выше OLED, чтобы «ориг OLED» не ушёл в «как оригинал»
  if (
    /service\s*pack|сервис[\s-]*пак|ориг\s*100|ориг100|full\s*orig|(^|[^а-яa-z0-9%])ориг(инал)?\b|\borig\b/i.test(
      q,
    )
  ) {
    return {
      id: 'orig',
      text: 'Заводской оригинал Apple / Samsung',
      tone: 'premium',
    }
  }

  if (/soft\s*oled|\boled\b|(^|[^a-zа-я])gx([^a-zа-я]|$)/i.test(q) && !/in-?cell/i.test(q)) {
    return {
      id: 'oled',
      text: 'Как оригинал · яркий и тонкий',
      tone: 'good',
    }
  }

  if (/in-?cell/i.test(q)) {
    return {
      id: 'incell',
      text: 'Базовый экран · чуть толще рамки',
      tone: 'basic',
    }
  }

  return null
}
