import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calculator,
  Clock,
  Loader2,
  MessageCircle,
  Search,
  Shield,
  Truck,
  X,
} from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'
import { DEFAULT_CALCULATOR } from '../calculator/defaults.js'
import { resolveQualityHint } from '../calculator/qualityGuide.js'
import { fetchCalculatorMeta, searchCalculator, suggestCalculator } from '../api/calculatorApi.js'
import { formatRub } from '../utils/price.js'
import QualityInfo from '../components/QualityInfo.jsx'

const LIST_MODES = [
  { id: 'all', label: 'Все' },
  { id: 'in_stock', label: 'Только в наличии' },
  { id: 'cheapest', label: 'Сначала дешевле' },
]

function waHref(base, item) {
  const text = [
    'Здравствуйте! Хочу записаться на ремонт:',
    `${item.title} — ${formatRub(item.repairPrice)} (срок: ${item.term}).`,
  ].join('\n')
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}text=${encodeURIComponent(text)}`
}

function qualityHintClass(tone) {
  if (tone === 'premium') {
    return 'border border-slate-300/90 bg-slate-100 text-slate-800'
  }
  if (tone === 'good') {
    return 'border border-[#BEF264]/80 bg-[#ECFCCB] text-[#365314]'
  }
  return 'border border-slate-200 bg-slate-50 text-slate-600'
}

export default function CalcPage() {
  const { company } = useCms()
  const [meta, setMeta] = useState(() => ({
    suggestions: DEFAULT_CALCULATOR.suggestions,
  }))
  const [query, setQuery] = useState('')
  const [hints, setHints] = useState([])
  const [items, setItems] = useState([])
  const [source, setSource] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [listMode, setListMode] = useState('all')
  const abortRef = useRef(null)
  const hintAbort = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const c = new AbortController()
    fetchCalculatorMeta(c.signal)
      .then(setMeta)
      .catch(() => {})
    return () => c.abort()
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setHints([])
      return
    }
    hintAbort.current?.abort()
    const c = new AbortController()
    hintAbort.current = c
    const t = setTimeout(() => {
      suggestCalculator(query.trim(), c.signal)
        .then((d) => setHints(d.suggestions || []))
        .catch(() => {})
    }, 280)
    return () => {
      clearTimeout(t)
      c.abort()
    }
  }, [query])

  async function runSearch(raw) {
    const q = String(raw || query).trim()
    if (q.length < 2) return
    setQuery(q)
    setHints([])
    setError('')
    setLoading(true)
    setSearched(true)
    setListMode('all')
    abortRef.current?.abort()
    const c = new AbortController()
    abortRef.current = c
    try {
      const data = await searchCalculator(q, c.signal)
      setItems(data.items || [])
      setSource(data.source || null)
      if (data.error) setError(data.error)
    } catch (e) {
      if (e.name === 'AbortError') return
      setItems([])
      setError(e.message || 'Ошибка поиска')
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    runSearch(query)
  }

  function clearQuery() {
    setQuery('')
    setHints([])
    setSearched(false)
    setItems([])
    setSource(null)
    setError('')
    setListMode('all')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const visibleItems = useMemo(() => {
    if (listMode === 'in_stock') {
      return items.filter((it) => it.availability === 'in_stock')
    }
    if (listMode === 'cheapest') {
      return [...items].sort(
        (a, b) => (Number(a.repairPrice) || 0) - (Number(b.repairPrice) || 0),
      )
    }
    return items
  }, [items, listMode])

  const minPrice = useMemo(() => {
    const prices = visibleItems.map((it) => Number(it.repairPrice)).filter((p) => p > 0)
    return prices.length ? Math.min(...prices) : null
  }, [visibleItems])

  const chips = meta.suggestions?.length ? meta.suggestions : []
  const showResults = !loading && searched && items.length > 0

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[var(--color-sky)]/50 to-transparent" />

      <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="font-display mb-2 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            <Calculator className="h-3.5 w-3.5" />
            Калькулятор
          </p>
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.55rem)] font-extrabold leading-[1.1] tracking-tight text-[var(--color-ink)] text-balance">
            Рассчитать цену ремонта
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--color-muted)]">
            Найдите запчасть — увидите итоговую стоимость работы, срок и гарантию. Бейджи у
            названия подскажут, чем OLED лучше In-Cell.
          </p>
        </motion.div>

        <form onSubmit={onSubmit} className="relative mt-7">
          <div className="flex gap-2 rounded-[22px] border border-white/80 bg-white/90 p-2 shadow-card backdrop-blur">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSearched(false)
                }}
                placeholder="Например: iPhone 13 дисплей"
                className={`h-12 w-full rounded-2xl bg-transparent pl-11 text-[15px] font-medium text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]/80 ${
                  query ? 'pr-10' : 'pr-3'
                }`}
                autoComplete="off"
                enterKeyHint="search"
              />
              {query ? (
                <button
                  type="button"
                  onClick={clearQuery}
                  aria-label="Очистить поиск"
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-slate-100 hover:text-[var(--color-ink)]"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={loading || query.trim().length < 2}
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-[var(--color-ink)] px-5 text-[14px] font-bold text-white transition hover:bg-[var(--color-ink-soft)] disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Найти
            </button>
          </div>

          <AnimatePresence>
            {hints.length > 0 && !loading && !searched ? (
              <motion.ul
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-float"
              >
                {hints.map((h) => (
                  <li key={h}>
                    <button
                      type="button"
                      onClick={() => runSearch(h)}
                      className="flex w-full px-4 py-2.5 text-left text-[14px] font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-soft)]/60"
                    >
                      {h}
                    </button>
                  </li>
                ))}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </form>

        {chips.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => runSearch(chip)}
                className="rounded-full border border-[var(--color-line)] bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-accent-soft)]/50"
              >
                {chip}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-8 space-y-3">
          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-[14px] font-semibold text-[var(--color-muted)]">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent)]" />
              Ищем варианты…
            </div>
          ) : null}

          {!loading && searched && !items.length && !error ? (
            <div className="rounded-[24px] border border-dashed border-[var(--color-line)] bg-white/60 px-5 py-10 text-center">
              <p className="font-display text-[17px] font-bold text-[var(--color-ink)]">
                Ничего не нашли
              </p>
              <p className="mt-2 text-[14px] text-[var(--color-muted)]">
                Попробуйте модель и тип детали: «iPhone 13 дисплей» или «Samsung A54 АКБ».
              </p>
              <a
                href={company.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-bright)] px-5 py-2.5 text-[13px] font-bold text-[var(--color-ink)]"
              >
                <MessageCircle className="h-4 w-4" />
                Спросить мастера
              </a>
            </div>
          ) : null}

          {!loading && source === 'order' && items.length ? (
            <p className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900">
              В городе сейчас нет в наличии — ниже варианты под заказ. В цену уже включена
              доставка запчасти.
            </p>
          ) : null}

          {showResults ? (
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] font-semibold text-[var(--color-ink-soft)]">
                Найдено {visibleItems.length}{' '}
                {visibleItems.length === 1
                  ? 'вариант'
                  : visibleItems.length > 1 && visibleItems.length < 5
                    ? 'варианта'
                    : 'вариантов'}
                {minPrice != null ? (
                  <span className="text-[var(--color-muted)]">
                    {' '}
                    · от {formatRub(minPrice)}
                  </span>
                ) : null}
              </p>
              <div className="flex flex-wrap gap-1 rounded-full border border-[var(--color-line)] bg-white/80 p-1">
                {LIST_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setListMode(mode.id)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
                      listMode === mode.id
                        ? 'bg-[var(--color-ink)] text-white'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {!loading &&
          searched &&
          items.length > 0 &&
          listMode === 'in_stock' &&
          !visibleItems.length ? (
            <div className="rounded-[22px] border border-dashed border-[var(--color-line)] bg-white/70 px-4 py-8 text-center">
              <p className="text-[14px] font-semibold text-[var(--color-ink)]">
                В наличии сейчас нет
              </p>
              <p className="mt-1 text-[13px] text-[var(--color-muted)]">
                Переключите на «Все» или «Сначала дешевле» — там есть варианты под заказ.
              </p>
            </div>
          ) : null}

          <AnimatePresence mode="popLayout">
            {!loading &&
              visibleItems.map((item, i) => {
                const hint =
                  resolveQualityHint(item.qualityLabel) ||
                  resolveQualityHint(item.title)
                const inStock = item.availability === 'in_stock'

                return (
                  <motion.article
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 6) * 0.04 }}
                    className="rounded-[22px] border border-white/80 bg-white/95 p-4 shadow-card sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              inStock
                                ? 'bg-[#ECFCCB] text-[#365314]'
                                : 'border border-amber-200/80 bg-amber-50 text-amber-800'
                            }`}
                          >
                            {item.availabilityLabel}
                            {item.term ? ` · ${item.term}` : ''}
                          </span>
                          {item.deliveryIncluded ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                              <Truck className="h-3 w-3" />
                              доставка в цене
                            </span>
                          ) : null}
                        </div>
                        <h2 className="font-display text-[16px] font-bold leading-snug text-[var(--color-ink)] sm:text-[17px]">
                          <span className="inline">
                            {item.title}
                            {hint ? (
                              <span
                                className={`ml-2 inline-flex translate-y-[-1px] align-middle rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-tight tracking-tight ${qualityHintClass(hint.tone)}`}
                              >
                                {hint.text}
                              </span>
                            ) : null}
                            <QualityInfo
                              label={item.qualityLabel}
                              points={item.qualityPoints}
                            />
                          </span>
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-[var(--color-muted)]">
                          <span className="inline-flex items-center gap-1.5 font-semibold">
                            <Clock className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                            {item.term}
                          </span>
                          {item.warrantyDays > 0 ? (
                            <span className="inline-flex items-center gap-1.5 font-semibold">
                              <Shield className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                              гарантия {item.warrantyDays} дн.
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                          Ремонт
                        </p>
                        <p className="font-display text-[1.45rem] font-extrabold tabular-nums text-[var(--color-ink)]">
                          {formatRub(item.repairPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={waHref(company.whatsapp, item)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-bright)] px-4 py-2.5 text-[13px] font-bold text-[var(--color-ink)] transition hover:brightness-105"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Записаться с этой ценой
                      </a>
                      <a
                        href={company.phoneHref}
                        className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-white px-4 py-2.5 text-[13px] font-bold text-[var(--color-ink-soft)]"
                      >
                        Позвонить
                      </a>
                    </div>
                  </motion.article>
                )
              })}
          </AnimatePresence>
        </div>

        <p className="mt-8 text-center text-[12px] leading-relaxed text-[var(--color-muted)]">
          Ориентир по наличию в Ставрополе. Итог может уточниться после диагностики —
          мастер подтвердит перед началом работ.
        </p>
      </div>
    </section>
  )
}
