import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Calculator,
  ImagePlus,
  Loader2,
  MessageCircle,
  Phone,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'
import { uploadAdminImage } from '../api/cmsApi.js'
import { fileToCompressedDataUrl } from './utils/image.js'

const HEADLINE_SOFT = 55
const TEXT_SOFT = 140
const EMPTY_TRUST = [
  { label: '', value: '' },
  { label: '', value: '' },
  { label: '', value: '' },
  { label: '', value: '' },
]

function ensureTrustFour(list) {
  const next = Array.isArray(list) ? list.map((t) => ({ label: t.label || '', value: t.value || '' })) : []
  while (next.length < 4) next.push({ label: '', value: '' })
  return next.slice(0, 4)
}

function CharHint({ current, soft, hard }) {
  const over = current > soft
  return (
    <span
      className={`tabular-nums text-[11px] font-semibold ${
        over ? 'text-amber-700' : 'text-[var(--crm-text-faint)]'
      }`}
    >
      {current} / {soft}
      {hard && current > hard ? ` · макс ${hard}` : ''}
    </span>
  )
}

function visibleTrust(trust) {
  return (trust || []).filter((t) => String(t.label || '').trim() || String(t.value || '').trim())
}

export default function HeroPage() {
  const { content, company, save, saving } = useCms()
  const inputRef = useRef(null)
  const blobRef = useRef(null)

  const [draft, setDraft] = useState(() => ({ ...content.hero }))
  const [trust, setTrust] = useState(() => ensureTrustFour(content.trust))
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    setDraft({ ...content.hero })
    setTrust(ensureTrustFour(content.trust))
  }, [content.hero, content.trust])

  useEffect(
    () => () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current)
    },
    [],
  )

  const dirty = useMemo(() => {
    const savedTrust = ensureTrustFour(content.trust)
    return (
      JSON.stringify(draft) !== JSON.stringify(content.hero) ||
      JSON.stringify(trust) !== JSON.stringify(savedTrust)
    )
  }, [draft, trust, content.hero, content.trust])

  useEffect(() => {
    function onLeave(e) {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [dirty])

  const showToast = useCallback((text) => {
    setToast(text)
    window.setTimeout(() => setToast(''), 2000)
  }, [])

  const onSave = useCallback(async () => {
    try {
      const nextTrust = ensureTrustFour(trust)
      await save({ ...content, hero: draft, trust: nextTrust })
      showToast('Сохранено')
    } catch (e) {
      showToast(e.message || 'Ошибка сохранения')
    }
  }, [content, draft, trust, save, showToast])

  useEffect(() => {
    function onKey(e) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 's') return
      e.preventDefault()
      if (dirty && !saving) onSave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dirty, saving, onSave])

  async function handleFile(file) {
    if (!file) return
    setUploadError('')
    if (blobRef.current) URL.revokeObjectURL(blobRef.current)
    const localUrl = URL.createObjectURL(file)
    blobRef.current = localUrl
    setDraft((d) => ({ ...d, image: localUrl }))
    setUploading(true)
    try {
      const compressed = await fileToCompressedDataUrl(file, {
        maxSide: 1920,
        quality: 0.82,
        preferWebp: true,
      })
      const uploaded = await uploadAdminImage(compressed)
      setDraft((d) => ({ ...d, image: uploaded.url }))
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current)
        blobRef.current = null
      }
    } catch (e) {
      setUploadError(e.message || 'Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  }

  function clearImage() {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current)
      blobRef.current = null
    }
    setDraft((d) => ({ ...d, image: '' }))
  }

  function patchTrust(idx, key, value) {
    setTrust((prev) => {
      const next = ensureTrustFour(prev)
      next[idx] = { ...next[idx], [key]: value }
      return next
    })
  }

  function pullRatingFromContacts() {
    setTrust((prev) => {
      const next = ensureTrustFour(prev)
      next[3] = {
        label: next[3].label || 'Рейтинг',
        value: String(company.rating || '5.0'),
      }
      return next
    })
    showToast('Рейтинг подтянут из Контактов')
  }

  const previewTrust = visibleTrust(trust)
  const headlineLen = String(draft.headline || '').length
  const textLen = String(draft.text || '').length

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--crm-text)] sm:text-[24px]">
            Главный экран
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--crm-text-muted)]">
            Первый экран сайта: фон, заголовок и 4 плашки фактов.
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
          {dirty ? (
            <button
              type="button"
              className="crm-btn-ghost"
              onClick={() => {
                setDraft({ ...content.hero })
                setTrust(ensureTrustFour(content.trust))
              }}
            >
              Сбросить
            </button>
          ) : null}
          <button
            type="button"
            className="crm-btn-primary"
            disabled={saving || !dirty || uploading}
            onClick={onSave}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Left */}
        <div className="space-y-5 lg:col-span-8">
          <section className="crm-panel p-5">
            <p className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--crm-text)]">
              <span className="h-2 w-2 rounded-full bg-[var(--crm-brand)]" />
              Контент и фон
            </p>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-12">
              {/* Uploader */}
              <div className="sm:col-span-4">
                <p className="mb-1.5 text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                  Фон hero
                </p>
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    handleFile(e.dataTransfer.files?.[0])
                  }}
                  className={`relative aspect-[4/5] overflow-hidden rounded-[var(--crm-radius-lg)] border-2 border-dashed transition sm:aspect-[3/4] ${
                    dragOver
                      ? 'border-[var(--crm-brand)] bg-[var(--crm-brand-soft)]'
                      : draft.image
                        ? 'border-[var(--crm-border)] bg-[var(--crm-subtle)]'
                        : 'border-[var(--crm-border-strong)] bg-[var(--crm-subtle)]'
                  }`}
                >
                  {draft.image ? (
                    <img
                      src={draft.image}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-950 px-3 text-center">
                      <ImagePlus className="h-7 w-7 text-white/50" />
                      <p className="text-[12px] font-semibold text-white/80">Перетащите фото</p>
                      <p className="text-[11px] text-white/45">или выберите файл</p>
                    </div>
                  )}

                  {uploading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 backdrop-blur-sm">
                      <Loader2 className="h-7 w-7 animate-spin text-[var(--crm-brand)]" />
                      <p className="text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                        Загрузка…
                      </p>
                    </div>
                  ) : null}

                  <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/60 to-transparent p-2.5 pt-8">
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => inputRef.current?.click()}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[var(--crm-radius-sm)] bg-white px-2.5 py-2 text-[11px] font-bold text-slate-900 disabled:opacity-50"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {draft.image ? 'Заменить' : 'Выбрать'}
                    </button>
                    {draft.image ? (
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={clearImage}
                        className="inline-flex items-center justify-center rounded-[var(--crm-radius-sm)] bg-white/90 px-2.5 py-2 text-red-600 disabled:opacity-50"
                        aria-label="Удалить фон"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    handleFile(f)
                  }}
                />
                {uploadError ? (
                  <p className="mt-1.5 text-[12px] font-medium text-[var(--crm-danger-text)]">
                    {uploadError}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-[var(--crm-text-faint)]">
                    WebP / JPG / PNG · до 5 МБ · до 1920px
                  </p>
                )}
              </div>

              {/* Texts */}
              <div className="space-y-4 sm:col-span-8">
                <label className="block space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                      Заголовок
                    </span>
                    <CharHint current={headlineLen} soft={HEADLINE_SOFT} />
                  </div>
                  <input
                    className="crm-input"
                    value={draft.headline || ''}
                    onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
                    placeholder="Главный посыл на первом экране"
                  />
                </label>
                <label className="block space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                      Текст под заголовком
                    </span>
                    <CharHint current={textLen} soft={TEXT_SOFT} />
                  </div>
                  <textarea
                    rows={5}
                    className="crm-input resize-y"
                    value={draft.text || ''}
                    onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                    placeholder="Коротко: что чините и чем отличаетесь"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="crm-panel p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--crm-text)]">
                <span className="h-2 w-2 rounded-full bg-[#0EA5E9]" />
                Плашки фактов (4 шт.)
              </p>
              <button
                type="button"
                className="crm-btn-ghost !px-2.5 !py-1.5 !text-[11px]"
                onClick={pullRatingFromContacts}
              >
                <Star className="h-3 w-3" />
                Рейтинг из Контактов
              </button>
            </div>
            <p className="mb-3 text-[12px] text-[var(--crm-text-muted)]">
              Пустая плашка (без подписи и значения) скрывается на сайте.
            </p>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {trust.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-[var(--crm-radius-md)] border border-slate-200/80 bg-slate-50/70 p-3"
                >
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--crm-text-faint)]">
                    #{idx + 1}
                    {idx === 3 ? ' · рейтинг' : ''}
                  </p>
                  <label className="mb-2 block space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--crm-text-secondary)]">
                      Подпись
                    </span>
                    <input
                      className="crm-input !py-2 !text-[13px]"
                      value={item.label}
                      onChange={(e) => patchTrust(idx, 'label', e.target.value)}
                      placeholder="Например Гарантия"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--crm-text-secondary)]">
                      Значение
                    </span>
                    <input
                      className="crm-input !py-2 !text-[13px]"
                      value={item.value}
                      onChange={(e) => patchTrust(idx, 'value', e.target.value)}
                      placeholder="до 90 дней"
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right preview */}
        <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-[var(--crm-radius-lg)] border border-[var(--crm-border)] bg-slate-950 shadow-[var(--crm-shadow-card)]">
            <p className="border-b border-white/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">
              Живой предпросмотр
            </p>
            <div className="relative min-h-[420px] overflow-hidden">
              {draft.image ? (
                <img
                  src={draft.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-45"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/88 to-slate-950/35" />

              <div className="relative space-y-3 p-4 sm:p-5">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/85">
                  <Star className="h-3 w-3 fill-[#74c011] text-[#74c011]" />
                  {company.rating} · {company.reviewsCount} отзывов · {company.city}
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#74c011]">
                  {company.name}
                </p>
                <h2 className="font-display text-[1.35rem] font-extrabold leading-[1.1] tracking-tight text-white">
                  {draft.headline || 'Заголовок…'}
                </h2>
                <p className="text-[12px] leading-relaxed text-white/70">
                  {draft.text || 'Текст под заголовком…'}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#74c011] px-2.5 py-1.5 text-[10px] font-bold text-slate-950">
                    <Calculator className="h-3 w-3" />
                    Рассчитать
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white">
                    <MessageCircle className="h-3 w-3" />
                    Написать
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white">
                    <Phone className="h-3 w-3" />
                    Позвонить
                  </span>
                </div>

                {previewTrust.length ? (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {previewTrust.map((item, i) => (
                      <div
                        key={`${item.label}-${i}`}
                        className="rounded-xl border border-white/12 bg-white/10 px-2.5 py-2 backdrop-blur-md"
                      >
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-white/50">
                          {item.label || '—'}
                        </p>
                        <p className="mt-0.5 font-display text-[13px] font-bold text-white">
                          {item.value || '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pt-2 text-[11px] text-white/40">Плашки скрыты (пусто)</p>
                )}
              </div>
            </div>
          </div>

          <div className="crm-panel p-4">
            <p className="text-[12px] font-bold text-[var(--crm-text)]">Подсказка по графике</p>
            <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-[var(--crm-text-muted)]">
              <li>Рекомендуемо: 1600×900 px и шире</li>
              <li>Форматы: WebP / JPG / PNG, до 5 МБ</li>
              <li>Объект фото лучше справа — слева читается заголовок</li>
              <li>Заголовок до ~55 символов, текст до ~140</li>
            </ul>
            <p className="mt-3 text-center text-[11px] text-[var(--crm-text-faint)]">
              Ctrl + S — сохранить
            </p>
          </div>
        </aside>
      </div>

      {toast ? (
        <div className="crm-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
