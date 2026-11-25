import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'
import ImagePicker from './components/ImagePicker.jsx'
import { slugifyRu } from './utils/slug.js'
import { serviceFromPrice } from '../utils/price.js'

function emptyPriceItem() {
  return {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: '',
    priceFrom: '',
    note: '',
  }
}

function emptyService() {
  return {
    id: '',
    title: '',
    hint: '',
    summary: '',
    timing: 'от 1 часа',
    guarantee: 'до 90 дней',
    points: [],
    price: { note: '', items: [emptyPriceItem()] },
    tone: 'from-[#1e293b] to-[#0f172a]',
    image: '',
    published: true,
  }
}

function formatFromPrice(service) {
  const min = serviceFromPrice(service)
  if (min == null) return null
  return `от ${Number(min).toLocaleString('ru-RU')} ₽`
}

export default function ServicesAdminPage() {
  const { content, save, saving } = useCms()
  const [draft, setDraft] = useState(() => content.services || [])
  const [openIds, setOpenIds] = useState(() => new Set())
  const [query, setQuery] = useState('')
  const [slugLocked, setSlugLocked] = useState(() => new Set())
  const [toast, setToast] = useState('')
  const titleRefs = useRef({})

  useEffect(() => {
    setDraft(content.services || [])
    setSlugLocked(new Set((content.services || []).map((s) => s.id).filter(Boolean)))
  }, [content.services])

  const dirty = JSON.stringify(draft) !== JSON.stringify(content.services)

  const showToast = useCallback((text) => {
    setToast(text)
    window.setTimeout(() => setToast(''), 2000)
  }, [])

  const onSave = useCallback(async () => {
    try {
      const normalized = draft.map((s) => ({
        ...s,
        id: String(s.id || slugifyRu(s.title) || `service-${Date.now()}`).replace(
          /[^a-z0-9-]/g,
          '-',
        ),
        published: s.published !== false,
        points: Array.isArray(s.points) ? s.points : [],
      }))
      await save({ ...content, services: normalized })
      setDraft(normalized)
      setSlugLocked(new Set(normalized.map((s) => s.id)))
      showToast('Сохранено')
    } catch (e) {
      showToast(e.message || 'Ошибка сохранения')
    }
  }, [content, draft, save, showToast])

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return draft.map((s, idx) => ({ s, idx }))
    return draft
      .map((s, idx) => ({ s, idx }))
      .filter(({ s }) => {
        const hay = [
          s.title,
          s.hint,
          s.id,
          ...(s.price?.items || []).map((i) => i.title),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
  }, [draft, query])

  function isSlugLocked(service) {
    return Boolean(
      (service._key && slugLocked.has(service._key)) ||
        (service.id && slugLocked.has(service.id)),
    )
  }

  function updateService(idx, patch) {
    setDraft((prev) => {
      const next = [...prev]
      const cur = { ...next[idx], ...patch }
      if (patch.title !== undefined && !isSlugLocked(next[idx])) {
        const auto = slugifyRu(patch.title)
        if (auto) cur.id = auto
      }
      next[idx] = cur
      return next
    })
  }

  function lockSlug(service, explicitId) {
    setSlugLocked((prev) => {
      const n = new Set(prev)
      if (service?._key) n.add(service._key)
      const id = explicitId || service?.id
      if (id) n.add(id)
      return n
    })
  }

  function updatePriceItem(sIdx, pIdx, patch) {
    setDraft((prev) => {
      const next = [...prev]
      const items = [...(next[sIdx].price?.items || [])]
      items[pIdx] = { ...items[pIdx], ...patch }
      next[sIdx] = {
        ...next[sIdx],
        price: { ...next[sIdx].price, items },
      }
      return next
    })
  }

  function moveService(idx, dir) {
    setDraft((prev) => {
      const next = [...prev]
      const j = idx + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
  }

  function addService() {
    const item = emptyService()
    item._key = `new-${Date.now()}`
    setDraft((prev) => [item, ...prev])
    setOpenIds(new Set([item._key]))
    setTimeout(() => titleRefs.current[item._key]?.focus(), 50)
  }

  function serviceKey(service, idx) {
    return service._key || service.id || `idx-${idx}`
  }

  function toggleOpen(key) {
    setOpenIds((prev) => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  }

  const allExpanded =
    filtered.length > 0 && filtered.every(({ s, idx }) => openIds.has(serviceKey(s, idx)))

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--crm-text)] sm:text-[24px]">
            Услуги и прайс
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--crm-text-muted)]">
            Каталог направлений и прайс-листы. Прайс справа — как позиции в акте CRM.
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
          <button type="button" className="crm-btn-ghost" onClick={addService}>
            <Plus className="h-4 w-4" />
            Добавить услугу
          </button>
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

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--crm-text-faint)]" />
          <input
            className="crm-input !pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по услуге или позиции прайса…"
          />
        </div>
        <span className="text-[12px] font-semibold tabular-nums text-[var(--crm-text-muted)]">
          Всего: {draft.length}
          {query ? ` · найдено ${filtered.length}` : ''}
        </span>
        <button
          type="button"
          className="crm-btn-ghost !text-[12px]"
          onClick={() => {
            if (allExpanded) setOpenIds(new Set())
            else setOpenIds(new Set(filtered.map(({ s, idx }) => serviceKey(s, idx))))
          }}
        >
          {allExpanded ? 'Свернуть все' : 'Развернуть все'}
        </button>
        {dirty ? (
          <button
            type="button"
            className="crm-btn-ghost !text-[12px]"
            onClick={() => setDraft(content.services || [])}
          >
            Сбросить
          </button>
        ) : null}
      </div>

      <div className="space-y-3">
        {filtered.map(({ s: service, idx: sIdx }) => {
          const key = serviceKey(service, sIdx)
          const open = openIds.has(key)
          const items = service.price?.items || []
          const fromLabel = formatFromPrice(service)
          const pointsCount = (service.points || []).filter(Boolean).length
          const published = service.published !== false

          return (
            <div
              key={key}
              className={`overflow-hidden rounded-2xl border bg-white shadow-[var(--crm-shadow-xs)] ${
                open ? 'border-slate-300' : 'border-slate-200/90'
              }`}
            >
              {/* Accordion header */}
              <div
                className={`flex w-full items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 ${
                  open ? 'bg-slate-50/70' : 'hover:bg-slate-50/50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleOpen(key)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {service.image ? (
                      <img src={service.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[9px] text-slate-400">
                        фото
                      </div>
                    )}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-[var(--crm-text)]">
                      {service.title || 'Без названия'}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--crm-text-muted)]">
                      {service.hint ? (
                        <span className="truncate max-w-[220px]">{service.hint}</span>
                      ) : null}
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-semibold tabular-nums text-slate-600">
                        {items.length} цен
                      </span>
                      {fromLabel ? (
                        <span className="font-semibold tabular-nums text-[var(--crm-brand-text)]">
                          {fromLabel}
                        </span>
                      ) : null}
                      {service.timing ? <span>{service.timing}</span> : null}
                    </span>
                  </span>
                  {open ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                </button>

                <button
                  type="button"
                  title={published ? 'Опубликована' : 'Скрыта'}
                  onClick={(e) => {
                    e.stopPropagation()
                    updateService(sIdx, { published: !published })
                  }}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold ${
                    published
                      ? 'border-[var(--crm-brand-border)] bg-[var(--crm-brand-soft)] text-[var(--crm-brand-text)]'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  {published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{published ? 'На сайте' : 'Скрыта'}</span>
                </button>

                <div className="hidden items-center sm:flex">
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => moveService(sIdx, -1)}
                    title="Выше"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => moveService(sIdx, 1)}
                    title="Ниже"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {open ? (
                <div className="border-t border-slate-200 p-4 sm:p-5">
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    {/* Left: content */}
                    <div className="space-y-4 xl:col-span-7">
                      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                        <ImagePicker
                          value={service.image}
                          onChange={(url) => updateService(sIdx, { image: url })}
                          label="Фото"
                          aspect="aspect-square"
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block space-y-1 sm:col-span-2">
                            <span className="text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                              Название
                            </span>
                            <input
                              ref={(el) => {
                                titleRefs.current[key] = el
                              }}
                              className="crm-input"
                              value={service.title}
                              onChange={(e) => updateService(sIdx, { title: e.target.value })}
                              placeholder="Например: Замена дисплея"
                            />
                          </label>
                          <label className="block space-y-1 sm:col-span-2">
                            <span className="text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                              Короткое описание
                            </span>
                            <input
                              className="crm-input"
                              value={service.hint || ''}
                              onChange={(e) => updateService(sIdx, { hint: e.target.value })}
                              placeholder="Подзаголовок на карточке"
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                              Срок
                            </span>
                            <input
                              className="crm-input"
                              value={service.timing || ''}
                              onChange={(e) => updateService(sIdx, { timing: e.target.value })}
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                              Гарантия
                            </span>
                            <input
                              className="crm-input"
                              value={service.guarantee || ''}
                              onChange={(e) => updateService(sIdx, { guarantee: e.target.value })}
                            />
                          </label>
                          <div className="sm:col-span-2">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                                Адрес в ссылке (латиницей)
                              </span>
                              <button
                                type="button"
                                className="crm-btn-ghost !px-2 !py-1 !text-[11px]"
                                onClick={() => {
                                  const slug = slugifyRu(service.title)
                                  if (!slug) return
                                  updateService(sIdx, { id: slug })
                                  lockSlug(service, slug)
                                  showToast('Slug из названия')
                                }}
                              >
                                <RefreshCw className="h-3 w-3" />
                                Из названия
                              </button>
                            </div>
                            <input
                              className="crm-input font-mono !text-xs"
                              value={service.id || ''}
                              onChange={(e) => {
                                const id = e.target.value
                                  .trim()
                                  .toLowerCase()
                                  .replace(/[^a-z0-9-]/g, '-')
                                lockSlug(service, id || key)
                                updateService(sIdx, { id })
                              }}
                              placeholder="zamena-displeya"
                            />
                            <p className="mt-1 font-mono text-[11px] text-[var(--crm-text-faint)]">
                              /services/{service.id || '…'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <label className="block space-y-1">
                        <span className="text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                          Описание
                        </span>
                        <textarea
                          rows={3}
                          className="crm-input resize-y"
                          value={service.summary || ''}
                          onChange={(e) => updateService(sIdx, { summary: e.target.value })}
                        />
                      </label>

                      <label className="block space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                            Когда обращаться
                          </span>
                          <span className="text-[11px] font-semibold tabular-nums text-[var(--crm-text-faint)]">
                            {pointsCount}{' '}
                            {pointsCount === 1 ? 'пункт' : pointsCount < 5 ? 'пункта' : 'пунктов'}
                          </span>
                        </div>
                        <textarea
                          rows={4}
                          className="crm-input resize-y"
                          value={(service.points || []).join('\n')}
                          onChange={(e) =>
                            updateService(sIdx, {
                              points: e.target.value
                                .split('\n')
                                .map((x) => x.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder={'Каждый пункт — с новой строки'}
                        />
                      </label>
                    </div>

                    {/* Right: price list */}
                    <div className="xl:col-span-5">
                      <div className="rounded-[var(--crm-radius-lg)] border border-[var(--crm-border)] bg-[var(--crm-subtle)] p-3 sm:p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[13px] font-bold text-[var(--crm-text)]">
                              Прайс-лист услуги
                            </p>
                            {fromLabel ? (
                              <p className="text-[11px] font-semibold tabular-nums text-[var(--crm-brand-text)]">
                                В шапке: {fromLabel}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className="crm-btn-ghost !text-[12px]"
                            onClick={() => {
                              const nextItems = [...items, emptyPriceItem()]
                              updateService(sIdx, {
                                price: { ...service.price, items: nextItems },
                              })
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Строка
                          </button>
                        </div>

                        <div className="overflow-hidden rounded-[var(--crm-radius-md)] border border-[var(--crm-border)] bg-white">
                          <table className="w-full table-fixed border-collapse text-left">
                            <colgroup>
                              <col className="w-7" />
                              <col />
                              <col className="w-[110px]" />
                              <col className="w-8" />
                            </colgroup>
                            <thead>
                              <tr className="border-b border-[var(--crm-border)] bg-[var(--crm-subtle)] text-[10px] font-bold uppercase tracking-wide text-[var(--crm-text-muted)]">
                                <th className="px-1.5 py-2">№</th>
                                <th className="px-1.5 py-2">Работа</th>
                                <th className="px-1.5 py-2">Цена от</th>
                                <th className="px-1 py-2" />
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, pIdx) => (
                                <tr
                                  key={item.id || pIdx}
                                  className="border-b border-[var(--crm-border)] last:border-0"
                                >
                                  <td className="px-1.5 py-1.5 text-[12px] tabular-nums text-slate-400">
                                    {pIdx + 1}
                                  </td>
                                  <td className="px-1.5 py-1.5">
                                    <input
                                      className="crm-input !py-1.5 !text-[13px]"
                                      value={item.title || ''}
                                      onChange={(e) =>
                                        updatePriceItem(sIdx, pIdx, { title: e.target.value })
                                      }
                                      placeholder="Сброс FRP / аккаунта Google"
                                    />
                                    {item.note || item.priceLabel ? (
                                      <input
                                        className="crm-input mt-1 !py-1 !text-[11px] text-[var(--crm-text-muted)]"
                                        value={item.note || item.priceLabel || ''}
                                        onChange={(e) => {
                                          const v = e.target.value
                                          if (/бесплатно/i.test(v) && !(item.priceFrom > 0)) {
                                            updatePriceItem(sIdx, pIdx, {
                                              priceLabel: v,
                                              priceFrom: 0,
                                              note: '',
                                            })
                                          } else {
                                            updatePriceItem(sIdx, pIdx, {
                                              note: v,
                                              priceLabel: undefined,
                                            })
                                          }
                                        }}
                                        placeholder="Заметка (необяз.)"
                                      />
                                    ) : null}
                                  </td>
                                  <td className="px-1.5 py-1.5">
                                    <div className="relative">
                                      <input
                                        type="number"
                                        className="crm-input crm-input-num !py-1.5 !pr-7 !text-right !text-[13px]"
                                        value={item.priceFrom ?? ''}
                                        onChange={(e) =>
                                          updatePriceItem(sIdx, pIdx, {
                                            priceFrom:
                                              e.target.value === ''
                                                ? undefined
                                                : Number(e.target.value),
                                            priceLabel:
                                              Number(e.target.value) > 0
                                                ? undefined
                                                : item.priceLabel,
                                          })
                                        }
                                        placeholder="0"
                                      />
                                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-[var(--crm-text-faint)]">
                                        ₽
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-1 py-1.5 text-center">
                                    <button
                                      type="button"
                                      className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"
                                      onClick={() => {
                                        const nextItems = items.filter((_, i) => i !== pIdx)
                                        updateService(sIdx, {
                                          price: { ...service.price, items: nextItems },
                                        })
                                      }}
                                      aria-label="Удалить строку"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {!items.length ? (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="px-3 py-6 text-center text-[12px] text-[var(--crm-text-faint)]"
                                  >
                                    Нет позиций — добавьте строку
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>

                        <label className="mt-3 block space-y-1">
                          <span className="text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                            Пояснение к прайсу
                          </span>
                          <textarea
                            rows={2}
                            className="crm-input resize-y !text-[13px]"
                            value={service.price?.note || ''}
                            onChange={(e) =>
                              updateService(sIdx, {
                                price: { ...service.price, note: e.target.value },
                              })
                            }
                            placeholder="Ориентир; точная цена после диагностики…"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-[var(--crm-radius-sm)] border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700 hover:bg-red-100"
                      onClick={() => {
                        if (!confirm(`Удалить услугу «${service.title || 'без названия'}»?`)) return
                        setDraft((prev) => prev.filter((_, i) => i !== sIdx))
                        setOpenIds((prev) => {
                          const n = new Set(prev)
                          n.delete(key)
                          return n
                        })
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Удалить услугу
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}

        {!filtered.length ? (
          <p className="rounded-2xl border border-dashed border-[var(--crm-border)] bg-white px-4 py-10 text-center text-[13px] text-[var(--crm-text-faint)]">
            {query ? 'Ничего не найдено' : 'Пока нет услуг — добавьте первую'}
          </p>
        ) : null}
      </div>

      {toast ? (
        <div className="crm-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
