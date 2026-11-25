import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import {
  DEFAULT_CALCULATOR,
  normalizeCalculator,
  roundRepairPrice,
} from '../calculator/defaults.js'
import { fetchAdminCalculator, saveAdminCalculator } from '../api/calculatorApi.js'
import { Field, Input, Textarea } from './components/ui.jsx'

function emptyCategory() {
  return {
    id: `cat-${Date.now().toString(36)}`,
    label: 'Новая категория',
    keywords: '',
    labor: 2000,
    minRepairPrice: 2000,
    warrantyDays: 60,
    termInStock: '1–2 дня',
    termOnOrder: '3–5 дней',
  }
}

function parseKeywords(raw) {
  return String(raw || '')
    .split(/[,;]+/)
    .map((k) => k.trim())
    .filter(Boolean)
}

function formatRub(n) {
  return `${Math.round(Number(n) || 0).toLocaleString('ru-RU')} ₽`
}

/** Пошаговая расшифровка той же формулы, что на сайте (без баннера poiskzip). */
function simulatePrice({ purchasePrice, isOutOfStock, category, rules }) {
  const purchase = Math.max(0, Number(purchasePrice) || 0)
  const markupPercent = Number(rules.markupPercent) || 0
  const partWithMarkup = purchase * (1 + markupPercent / 100)
  const delivery = isOutOfStock ? Number(rules.deliveryFee) || 0 : 0
  const work = Number(category?.labor) || 0
  const rawTotal = partWithMarkup + work + delivery
  const floor = Number(category?.minRepairPrice) || 0
  const flooredTotal = Math.max(rawTotal, floor)
  const step = Math.max(1, Number(rules.roundTo) || 1)
  const total = roundRepairPrice(flooredTotal, step)
  const term = isOutOfStock
    ? category?.termOnOrder || 'под заказ'
    : category?.termInStock || 'в наличии'

  return {
    purchase,
    markupPercent,
    partWithMarkup,
    work,
    delivery,
    rawTotal,
    floor,
    flooredTotal,
    floorApplied: flooredTotal > rawTotal + 0.001,
    step,
    total,
    term,
  }
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-subtle)] px-3 py-3 text-left transition hover:border-[var(--crm-border-strong)]"
    >
      <span
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#52A800]' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-[var(--crm-text)]">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-[11px] leading-snug text-[var(--crm-text-muted)]">
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  )
}

export default function CalculatorAdminPage() {
  const [draft, setDraft] = useState(() => structuredClone(DEFAULT_CALCULATOR))
  const [saved, setSaved] = useState(() => structuredClone(DEFAULT_CALCULATOR))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const [simCategoryId, setSimCategoryId] = useState('display')
  const [simPurchase, setSimPurchase] = useState('2400')
  const [simOutOfStock, setSimOutOfStock] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const calc = await fetchAdminCalculator()
        if (!alive) return
        const n = normalizeCalculator(calc)
        setDraft(n)
        setSaved(n)
        setSimCategoryId(n.categories[0]?.id || 'display')
      } catch (e) {
        if (alive) setToast(e.message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)

  const showToast = useCallback((text) => {
    setToast(text)
    window.setTimeout(() => setToast(''), 2200)
  }, [])

  const onSave = useCallback(async () => {
    setSaving(true)
    try {
      const next = normalizeCalculator(draft)
      const calc = await saveAdminCalculator(next)
      const n = normalizeCalculator(calc)
      setDraft(n)
      setSaved(n)
      showToast('Сохранено')
    } catch (e) {
      showToast(e.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }, [draft, showToast])

  useEffect(() => {
    function onKey(e) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 's') return
      e.preventDefault()
      if (dirty && !saving) onSave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dirty, saving, onSave])

  useEffect(() => {
    function onLeave(e) {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [dirty])

  function patch(key, value) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function patchCategory(index, key, value) {
    setDraft((d) => {
      const categories = d.categories.map((c, i) => (i === index ? { ...c, [key]: value } : c))
      return { ...d, categories }
    })
  }

  function addCategory() {
    const cat = emptyCategory()
    setDraft((d) => ({ ...d, categories: [...d.categories, cat] }))
    setSimCategoryId(cat.id)
  }

  function removeCategory(index) {
    const cat = draft.categories[index]
    if (!cat) return
    if (draft.categories.length <= 1) {
      showToast('Нужна хотя бы одна категория')
      return
    }
    if (!confirm(`Удалить категорию «${cat.label || 'без названия'}»?`)) return
    setDraft((d) => {
      const categories = d.categories.filter((_, i) => i !== index)
      return { ...d, categories }
    })
    setSimCategoryId((id) => {
      if (id !== cat.id) return id
      const next = draft.categories.filter((_, i) => i !== index)
      return next[0]?.id || ''
    })
  }

  const simCategory =
    draft.categories.find((c) => c.id === simCategoryId) || draft.categories[0]

  const sim = useMemo(() => {
    if (!simCategory) return null
    return simulatePrice({
      purchasePrice: simPurchase,
      isOutOfStock: simOutOfStock,
      category: simCategory,
      rules: draft,
    })
  }, [simPurchase, simOutOfStock, simCategory, draft])

  const suggestionsText = (draft.suggestions || []).join('\n')
  const suggestionCount = (draft.suggestions || []).length

  if (loading) {
    return <p className="text-[14px] text-[var(--crm-text-muted)]">Загрузка…</p>
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--crm-text)] sm:text-[24px]">
            Калькулятор ремонта
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--crm-text-muted)]">
            Наценка, доставка, округление и правила по категориям. Клиент видит только итоговую
            цену.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-[var(--crm-radius-sm)] border px-2.5 py-1 text-[11px] font-semibold ${
              dirty
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-[var(--crm-border)] bg-[var(--crm-subtle)] text-[var(--crm-text-muted)]'
            }`}
          >
            {dirty ? 'Есть несохранённые правки' : 'Все изменения сохранены'}
          </span>
          <a
            href="/calc"
            target="_blank"
            rel="noreferrer"
            className="crm-btn-ghost inline-flex items-center gap-1.5"
          >
            Открыть страницу
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {dirty ? (
            <button
              type="button"
              className="crm-btn-ghost"
              onClick={() => setDraft(structuredClone(saved))}
            >
              Сбросить
            </button>
          ) : null}
          <button
            type="button"
            className="crm-btn-primary"
            disabled={saving || !dirty}
            onClick={onSave}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Left — sticky */}
        <div className="space-y-5 lg:col-span-5 lg:sticky lg:top-6 lg:self-start">
          <section className="crm-panel space-y-4 p-5">
            <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--crm-text)]">
              <span className="h-2 w-2 rounded-full bg-[var(--crm-brand)]" />
              Общие правила
            </p>

            <div className="space-y-2.5">
              <Toggle
                checked={draft.enabled}
                onChange={(v) => patch('enabled', v)}
                label="Калькулятор включён на сайте"
                hint="Скрывает блок расчёта на /calc"
              />
              <Toggle
                checked={draft.usePoiskzipInstall !== false}
                onChange={(v) => patch('usePoiskzipInstall', v)}
                label="Работа с poiskzip"
                hint="«Установка в Ставрополе ≈ … ₽» — если баннер есть"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Наценка, %">
                <Input
                  type="number"
                  min={0}
                  value={draft.markupPercent}
                  onChange={(e) => patch('markupPercent', Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Доставка, ₽">
                <Input
                  type="number"
                  min={0}
                  value={draft.deliveryFee}
                  onChange={(e) => patch('deliveryFee', Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Округление, ₽">
                <Input
                  type="number"
                  min={1}
                  value={draft.roundTo}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    patch('roundTo', Number.isFinite(n) ? n : 0)
                  }}
                />
              </Field>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-slate-600">
                  Подсказки на странице
                </span>
                <span className="text-[11px] font-medium text-[var(--crm-text-faint)]">
                  {suggestionCount}{' '}
                  {suggestionCount === 1
                    ? 'подсказка'
                    : suggestionCount > 1 && suggestionCount < 5
                      ? 'подсказки'
                      : 'подсказок'}
                </span>
              </div>
              <Textarea
                rows={4}
                value={suggestionsText}
                onChange={(e) =>
                  patch(
                    'suggestions',
                    e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
              />
              <span className="block text-[11px] text-slate-400">Каждая с новой строки</span>
            </div>
          </section>

          {/* Live simulator */}
          <section className="overflow-hidden rounded-2xl bg-slate-900 text-white shadow-sm">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-lime-400">
                Проверка расчёта для клиента
              </p>
              <p className="mt-1 text-[12px] text-slate-400">
                Формула без баннера poiskzip: наценка + работа категории + доставка → пол →
                округление
              </p>
            </div>

            <div className="space-y-3.5 px-5 py-4">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Категория</span>
                <select
                  value={simCategory?.id || ''}
                  onChange={(e) => setSimCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-[14px] text-white outline-none focus:border-lime-500/50 focus:ring-2 focus:ring-lime-500/20"
                >
                  {draft.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">
                  Цена закупки запчасти, ₽
                </span>
                <input
                  type="number"
                  min={0}
                  value={simPurchase}
                  onChange={(e) => setSimPurchase(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-[14px] tabular-nums text-white outline-none focus:border-lime-500/50 focus:ring-2 focus:ring-lime-500/20"
                  placeholder="2400"
                />
              </label>

              <div className="flex rounded-xl border border-white/10 bg-slate-800/80 p-1">
                <button
                  type="button"
                  onClick={() => setSimOutOfStock(false)}
                  className={`flex-1 rounded-lg px-3 py-2 text-[12px] font-bold transition ${
                    !simOutOfStock
                      ? 'bg-lime-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  В наличии
                </button>
                <button
                  type="button"
                  onClick={() => setSimOutOfStock(true)}
                  className={`flex-1 rounded-lg px-3 py-2 text-[12px] font-bold transition ${
                    simOutOfStock
                      ? 'bg-lime-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Под заказ
                </button>
              </div>

              {sim ? (
                <>
                  <div className="space-y-1.5 rounded-xl border border-white/10 bg-slate-800/60 px-3.5 py-3 text-[12px] tabular-nums text-slate-300">
                    <Row
                      label={`Закупка с наценкой ${sim.markupPercent}%`}
                      value={formatRub(sim.partWithMarkup)}
                    />
                    <Row label="Работа" value={formatRub(sim.work)} />
                    <Row
                      label="Доставка"
                      value={sim.delivery > 0 ? formatRub(sim.delivery) : '—'}
                    />
                    <div className="my-1 border-t border-white/10" />
                    <Row label="Сырая сумма" value={formatRub(sim.rawTotal)} />
                    <Row
                      label={
                        sim.floorApplied
                          ? `Пол (мин. ${formatRub(sim.floor)})`
                          : 'Пол (не сработал)'
                      }
                      value={formatRub(sim.flooredTotal)}
                    />
                    <Row label={`Округление до ${sim.step} ₽`} value={formatRub(sim.total)} />
                  </div>

                  <div className="rounded-xl bg-lime-500/15 px-4 py-3.5 ring-1 ring-lime-400/30">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-lime-300/90">
                      Итого клиенту
                    </p>
                    <p className="mt-1 font-display text-[28px] font-bold tabular-nums tracking-tight text-white">
                      {formatRub(sim.total)}
                    </p>
                    <p className="mt-1 text-[13px] text-slate-300">
                      Срок: <span className="font-semibold text-white">{sim.term}</span>
                      {simCategory?.warrantyDays ? (
                        <>
                          {' '}
                          · гарантия{' '}
                          <span className="font-semibold text-white">
                            {simCategory.warrantyDays} дн.
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </section>
        </div>

        {/* Right — categories */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-bold text-[var(--crm-text)]">
              Категории работ{' '}
              <span className="font-semibold text-[var(--crm-text-faint)]">
                ({draft.categories.length})
              </span>
            </p>
            <button type="button" className="crm-btn-ghost" onClick={addCategory}>
              <Plus className="h-4 w-4" />
              Категория
            </button>
          </div>

          {draft.categories.map((cat, index) => {
            const tags = parseKeywords(cat.keywords)
            return (
              <section key={cat.id} className="crm-panel space-y-3.5 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-bold text-[var(--crm-text)]">
                    {cat.label || 'Без названия'}
                  </p>
                  <button
                    type="button"
                    title="Удалить категорию"
                    onClick={() => removeCategory(index)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Название">
                    <Input
                      value={cat.label}
                      onChange={(e) => patchCategory(index, 'label', e.target.value)}
                    />
                  </Field>
                  <div className="space-y-1.5">
                    <span className="text-[12px] font-semibold text-slate-600">
                      Ключевые слова
                    </span>
                    <Input
                      value={cat.keywords}
                      onChange={(e) => patchCategory(index, 'keywords', e.target.value)}
                      disabled={cat.id === 'default'}
                      placeholder="дисплей, экран, oled"
                    />
                    {tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-[var(--crm-brand-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--crm-brand-text)]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : cat.id !== 'default' ? (
                      <p className="text-[11px] text-[var(--crm-text-faint)]">
                        Нет тегов — категория не сматчится по названию запчасти
                      </p>
                    ) : (
                      <span className="block text-[11px] text-slate-400">
                        Fallback, если ничего не совпало
                      </span>
                    )}
                    {cat.id !== 'default' ? (
                      <span className="block text-[11px] text-slate-400">Через запятую</span>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Работа, ₽">
                    <Input
                      type="number"
                      min={0}
                      value={cat.labor}
                      onChange={(e) =>
                        patchCategory(index, 'labor', Number(e.target.value) || 0)
                      }
                    />
                  </Field>
                  <Field label="Минимум клиенту, ₽">
                    <Input
                      type="number"
                      min={0}
                      value={cat.minRepairPrice ?? 0}
                      onChange={(e) =>
                        patchCategory(index, 'minRepairPrice', Number(e.target.value) || 0)
                      }
                    />
                  </Field>
                  <Field label="Гарантия, дн.">
                    <Input
                      type="number"
                      min={0}
                      value={cat.warrantyDays}
                      onChange={(e) =>
                        patchCategory(index, 'warrantyDays', Number(e.target.value) || 0)
                      }
                    />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Срок в наличии">
                    <Input
                      value={cat.termInStock}
                      onChange={(e) => patchCategory(index, 'termInStock', e.target.value)}
                    />
                  </Field>
                  <Field label="Срок под заказ">
                    <Input
                      value={cat.termOnOrder}
                      onChange={(e) => patchCategory(index, 'termOnOrder', e.target.value)}
                    />
                  </Field>
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-200">{value}</span>
    </div>
  )
}
