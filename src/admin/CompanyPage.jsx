import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, MapPin, MessageCircle, Phone, RefreshCw, Star } from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'
import {
  buildWhatsappUrl,
  isUsableMessengerUrl,
  normalizeCompany,
  phoneToHref,
} from '../data/defaults.js'
import { qrImageUrl } from '../crm/print/orderDocData.js'
import { Field } from './components/ui.jsx'

function canOpenUrl(value) {
  const u = String(value || '').trim()
  if (!u || !/^https?:\/\//i.test(u)) return false
  return isUsableMessengerUrl(u) || !/^https?:\/\/(t\.me|wa\.me)\/?$/i.test(u)
}

function UrlField({ label, hint, value, onChange, placeholder }) {
  const openable = canOpenUrl(value)
  return (
    <div className="block space-y-1.5">
      {label ? (
        <span className="text-[12px] font-semibold text-[var(--crm-text-secondary)]">{label}</span>
      ) : null}
      <div className="relative">
        <input
          className="crm-input font-mono !pr-9 !text-xs"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          spellCheck={false}
        />
        {openable ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--crm-text-faint)] hover:bg-[var(--crm-hover)] hover:text-[var(--crm-brand)]"
            title="Открыть ссылку"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
      {hint ? <span className="block text-[11px] text-[var(--crm-text-faint)]">{hint}</span> : null}
    </div>
  )
}

function mapsUrl(city, address) {
  const q = [city, address].filter(Boolean).join(', ')
  return `https://yandex.ru/maps/?text=${encodeURIComponent(q || 'Ставрополь')}`
}

export default function CompanyPage() {
  const { content, save, saving } = useCms()
  const [draft, setDraft] = useState(() => normalizeCompany(content.company))
  const [toast, setToast] = useState('')

  useEffect(() => {
    setDraft(normalizeCompany(content.company))
  }, [content.company])

  const dirty = useMemo(
    () => JSON.stringify(normalizeCompany(draft)) !== JSON.stringify(normalizeCompany(content.company)),
    [draft, content.company],
  )

  const showToast = useCallback((text) => {
    setToast(text)
    window.setTimeout(() => setToast(''), 2000)
  }, [])

  const onSave = useCallback(async () => {
    try {
      const next = normalizeCompany(draft)
      await save({ ...content, company: next })
      setDraft(next)
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

  function patch(key, value) {
    setDraft((d) => {
      const next = { ...d, [key]: value }
      if (key === 'phone') {
        next.phoneHref = phoneToHref(value) || next.phoneHref
      }
      return next
    })
  }

  function syncWhatsappFromPhone() {
    const url = buildWhatsappUrl(draft.phone)
    if (!url) {
      showToast('Сначала укажите телефон')
      return
    }
    patch('whatsapp', url)
    showToast('WhatsApp обновлён из телефона')
  }

  const reviewQr = draft.reviewUrl?.trim()
    ? qrImageUrl(draft.reviewUrl.trim(), 120)
    : ''
  const showWa = isUsableMessengerUrl(draft.whatsapp)
  const showTg = isUsableMessengerUrl(draft.telegram)
  const addressLine = [draft.city, draft.address].filter(Boolean).join(', ')

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--crm-text)] sm:text-[24px]">
            Контакты компании
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--crm-text-muted)]">
            Реквизиты для сайта, трекера статуса и печатных документов.
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
              onClick={() => setDraft(normalizeCompany(content.company))}
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
        {/* Col 1 — Main */}
        <section className="crm-panel space-y-4 p-5 lg:col-span-4">
          <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--crm-text)]">
            <span className="h-2 w-2 rounded-full bg-[var(--crm-brand)]" />
            Основное
          </p>
          <Field label="Название">
            <input
              className="crm-input"
              value={draft.name}
              onChange={(e) => patch('name', e.target.value)}
            />
          </Field>
          <Field label="Слоган" hint="Пустой слоган скрывается на сайте">
            <input
              className="crm-input"
              value={draft.tagline}
              onChange={(e) => patch('tagline', e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Город">
              <input
                className="crm-input"
                value={draft.city}
                onChange={(e) => patch('city', e.target.value)}
              />
            </Field>
            <Field label="График работы">
              <input
                className="crm-input tabular-nums"
                value={draft.schedule}
                onChange={(e) => patch('schedule', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Адрес точки">
            <input
              className="crm-input"
              value={draft.address}
              onChange={(e) => patch('address', e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Рейтинг">
              <input
                className="crm-input tabular-nums"
                value={draft.rating}
                onChange={(e) => patch('rating', e.target.value)}
              />
            </Field>
            <Field label="Отзывов">
              <input
                type="number"
                className="crm-input tabular-nums"
                value={draft.reviewsCount}
                onChange={(e) => patch('reviewsCount', Number(e.target.value) || 0)}
              />
            </Field>
          </div>
        </section>

        {/* Col 2 — Contact */}
        <section className="crm-panel space-y-4 p-5 lg:col-span-4">
          <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--crm-text)]">
            <span className="h-2 w-2 rounded-full bg-[#0EA5E9]" />
            Связь и отзывы
          </p>
          <Field label="Телефон" hint="На сайте: красивый вид · в tel: — цифры">
            <input
              className="crm-input tabular-nums"
              value={draft.phone}
              onChange={(e) => patch('phone', e.target.value)}
              placeholder="+7 (988) 087-43-12"
            />
          </Field>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                WhatsApp
              </span>
              <button
                type="button"
                className="crm-btn-ghost !px-2 !py-1 !text-[11px]"
                onClick={syncWhatsappFromPhone}
              >
                <RefreshCw className="h-3 w-3" />
                Из телефона
              </button>
            </div>
            <UrlField
              label=""
              value={draft.whatsapp || ''}
              onChange={(e) => patch('whatsapp', e.target.value)}
              placeholder="https://wa.me/79…"
            />
          </div>

          <UrlField
            label="Telegram"
            hint="Пустой или только t.me — кнопка скрыта на сайте"
            value={draft.telegram || ''}
            onChange={(e) => patch('telegram', e.target.value)}
            placeholder="https://t.me/…"
          />

          <UrlField
            label="Ссылка на отзыв"
            hint="QR в акте выдачи. Без ссылки блок QR не печатается."
            value={draft.reviewUrl || ''}
            onChange={(e) => patch('reviewUrl', e.target.value)}
            placeholder="https://yandex.ru/maps/org/…"
          />
        </section>

        {/* Col 3 — Live preview */}
        <section className="space-y-4 lg:col-span-4 lg:sticky lg:top-6">
          <div className="crm-panel p-5">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--crm-text-faint)]">
              Превью визитки
            </p>
            <p className="font-display text-[16px] font-bold text-[var(--crm-text)]">
              {draft.name || 'ПРОШИВКА'}
            </p>
            {draft.tagline ? (
              <p className="mt-0.5 text-[12px] text-[var(--crm-text-muted)]">{draft.tagline}</p>
            ) : null}
            <p className="mt-2 text-[13px] text-[var(--crm-text-secondary)]">{addressLine || '—'}</p>
            {draft.schedule ? (
              <p className="mt-0.5 text-[12px] tabular-nums text-[var(--crm-text-faint)]">
                {draft.schedule}
              </p>
            ) : null}
            <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums text-[var(--crm-text)]">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {draft.rating || '—'}
              <span className="font-normal text-[var(--crm-text-faint)]">
                ({draft.reviewsCount || 0} отзывов)
              </span>
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <a
                href={phoneToHref(draft.phone) || '#'}
                className="inline-flex flex-col items-center gap-1 rounded-[var(--crm-radius-md)] bg-slate-900 px-2 py-2.5 text-white"
              >
                <Phone className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold">Звонок</span>
              </a>
              {showWa ? (
                <a
                  href={draft.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-col items-center gap-1 rounded-[var(--crm-radius-md)] bg-[var(--crm-brand)] px-2 py-2.5 text-white"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">WhatsApp</span>
                </a>
              ) : (
                <div className="inline-flex flex-col items-center gap-1 rounded-[var(--crm-radius-md)] border border-dashed border-[var(--crm-border)] px-2 py-2.5 text-[var(--crm-text-faint)]">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">скрыт</span>
                </div>
              )}
              <a
                href={mapsUrl(draft.city, draft.address)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-col items-center gap-1 rounded-[var(--crm-radius-md)] border border-[var(--crm-border)] bg-[var(--crm-subtle)] px-2 py-2.5 text-[var(--crm-text)]"
              >
                <MapPin className="h-3.5 w-3.5 text-[var(--crm-brand)]" />
                <span className="text-[10px] font-bold">Карта</span>
              </a>
            </div>
            {showTg ? (
              <a
                href={draft.telegram}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center justify-center gap-1.5 rounded-[var(--crm-radius-md)] border border-[var(--crm-border)] py-2 text-[12px] font-semibold text-[var(--crm-text-secondary)] hover:bg-[var(--crm-hover)]"
              >
                Telegram
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="mt-2 text-center text-[11px] text-[var(--crm-text-faint)]">
                Telegram скрыт (нет рабочей ссылки)
              </p>
            )}
          </div>

          <div className="crm-panel p-5">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--crm-text-faint)]">
              QR для акта выдачи
            </p>
            {reviewQr ? (
              <div className="flex items-center gap-3">
                <img
                  src={reviewQr}
                  alt="QR отзыва"
                  className="h-[88px] w-[88px] rounded-lg border border-[var(--crm-border)] bg-white p-1"
                />
                <p className="text-[12px] leading-relaxed text-[var(--crm-text-muted)]">
                  Клиент наводит камеру на QR в акте и попадает на страницу отзыва.
                </p>
              </div>
            ) : (
              <p className="rounded-[var(--crm-radius-md)] border border-dashed border-[var(--crm-border)] bg-[var(--crm-subtle)] px-3 py-4 text-[12px] text-[var(--crm-text-muted)]">
                Укажите ссылку на отзыв — тогда в АВР появится QR. Без ссылки блок QR не
                печатается.
              </p>
            )}
          </div>

          <p className="text-center text-[11px] text-[var(--crm-text-faint)]">Ctrl + S — сохранить</p>
        </section>
      </div>

      {toast ? (
        <div className="crm-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
