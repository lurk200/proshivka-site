import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  CircleDollarSign,
  X,
} from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'
import { fetchPublicTrack } from '../api/crmApi.js'
import OrderDocuments from '../crm/print/OrderDocuments.jsx'

const LAST_ORDER_KEY = 'proshivka_last_order'
const DEMO_NUMBER = '261024-04'

const TONE = {
  muted: 'bg-sky-50 text-sky-800 border-sky-200',
  info: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  warning: 'bg-amber-50 text-amber-900 border-amber-300',
  active: 'bg-violet-50 text-violet-800 border-violet-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  done: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

function formatRub(value) {
  if (value == null || Number.isNaN(Number(value))) return null
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formatDateTime(iso) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

function formatDateShort(iso) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

function mapsUrl(company) {
  const q = [company?.city, company?.address].filter(Boolean).join(', ')
  if (!q) {
    return 'https://yandex.ru/maps/?text=%D0%A1%D1%82%D0%B0%D0%B2%D1%80%D0%BE%D0%BF%D0%BE%D0%BB%D1%8C%2C%20%D1%83%D0%BB.%20%D0%9F%D0%B8%D1%80%D0%BE%D0%B3%D0%BE%D0%B2%D0%B0%2C%205%D0%90%D0%BA4'
  }
  return `https://yandex.ru/maps/?text=${encodeURIComponent(q)}`
}

function whatsappUrl(base, text) {
  const href = base || 'https://wa.me/79880874312'
  const sep = href.includes('?') ? '&' : '?'
  return `${href}${sep}text=${encodeURIComponent(text)}`
}

function readLastOrder() {
  try {
    const raw = localStorage.getItem(LAST_ORDER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.number) return null
    return {
      number: String(parsed.number),
      model: String(parsed.model || '').trim(),
    }
  } catch {
    return null
  }
}

function writeLastOrder(number, model) {
  try {
    localStorage.setItem(
      LAST_ORDER_KEY,
      JSON.stringify({ number: String(number), model: String(model || '') }),
    )
  } catch {
    /* ignore quota / private mode */
  }
}

function ProgressBar({ steps, currentStatus, statusTimestamps = {} }) {
  const currentIdx = steps.findIndex((s) => s.id === currentStatus)
  if (currentStatus === 'cancelled') {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
        Заказ отменён. Свяжитесь с сервисом.
      </p>
    )
  }

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <ol className="flex min-w-[520px] items-start gap-0">
        {steps.map((step, idx) => {
          const done = currentIdx >= 0 && idx < currentIdx
          const active = idx === currentIdx
          const ts = statusTimestamps[step.id]
          const isLast = idx === steps.length - 1
          return (
            <li key={step.id} className="flex flex-1 items-start">
              <div className="flex w-full flex-col items-center">
                <div className="flex w-full items-center">
                  <div
                    className={`h-[2px] flex-1 ${
                      idx === 0 ? 'invisible' : done || active ? 'bg-[#52A800]' : 'bg-slate-200'
                    }`}
                  />
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                      active
                        ? 'border-[#52A800] bg-[#ECFCCB] ring-4 ring-[#ECFCCB]'
                        : done
                          ? 'border-[#52A800] bg-[#52A800]'
                          : 'border-slate-200 bg-white'
                    }`}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5 text-white" />
                    ) : active ? (
                      <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#52A800]" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-slate-200" />
                    )}
                  </div>
                  <div
                    className={`h-[2px] flex-1 ${
                      isLast ? 'invisible' : done ? 'bg-[#52A800]' : 'bg-slate-200'
                    }`}
                  />
                </div>
                <div className="mt-2 px-1 text-center">
                  <p
                    className={`text-[10px] font-semibold leading-tight sm:text-[11px] ${
                      active ? 'text-[#365314]' : done ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {ts ? (
                    <p className="mt-0.5 whitespace-nowrap text-[9px] tabular-nums text-slate-400 sm:text-[10px]">
                      {formatDateShort(ts)}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Timeline({ events }) {
  const [expanded, setExpanded] = useState(false)
  if (!events?.length) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">История</p>
        <p className="mt-3 text-[13px] text-slate-400">Пока нет событий</p>
      </div>
    )
  }
  const items = [...events].reverse()
  const latest = items[0]
  const rest = items.slice(1)

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">История</p>
        {rest.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#52A800]"
          >
            {expanded ? 'Свернуть' : `+${rest.length} ещё`}
            <ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? 'rotate-180' : ''}`} />
          </button>
        ) : null}
      </div>
      <div className="relative space-y-0 pl-1">
        <div className="flex gap-3">
          <div className="relative flex flex-col items-center">
            <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#52A800] ring-[3px] ring-[#ECFCCB]" />
            {(expanded ? rest : []).length || (!expanded && rest.length) ? (
              <div className="mt-1 w-px flex-1 bg-slate-200" />
            ) : null}
          </div>
          <div className="pb-3">
            <p className="text-[13px] font-semibold text-slate-900">{latest.label || latest.text}</p>
            <p className="mt-0.5 text-[11px] tabular-nums text-slate-400">
              {formatDateTime(latest.at)}
            </p>
          </div>
        </div>
        {expanded
          ? rest.map((item, idx) => (
              <div key={`${item.at}-${idx}`} className="flex gap-3">
                <div className="relative flex flex-col items-center">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                  {idx < rest.length - 1 ? <div className="mt-1 w-px flex-1 bg-slate-200" /> : null}
                </div>
                <div className={idx < rest.length - 1 ? 'pb-3' : ''}>
                  <p className="text-[13px] text-slate-700">{item.label || item.text}</p>
                  <p className="mt-0.5 text-[11px] tabular-nums text-slate-400">
                    {formatDateTime(item.at)}
                  </p>
                </div>
              </div>
            ))
          : null}
      </div>
    </div>
  )
}

function CostCard({ track }) {
  const items = track.lineItems || []
  const issued =
    track.status === 'completed' || track.status === 'issued' || track.documents?.act
  const ready = track.status === 'ready'
  const final =
    track.priceFinal ??
    (items.length ? items.reduce((s, i) => s + (Number(i.sum) || 0), 0) : null)
  const from = track.priceFrom
  const showFinal = issued || ready || (final != null && final > 0 && items.length > 0)
  const main = showFinal
    ? formatRub(final ?? track.cost)
    : from != null
      ? `от ${formatRub(from)}`
      : formatRub(track.cost) || 'Уточняется'

  const badge =
    track.paymentBadge === 'paid' || issued
      ? { label: 'Оплачено', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
      : track.paymentBadge === 'pay_on_pickup' || ready
        ? {
            label: 'К оплате при получении',
            className: 'bg-amber-50 text-amber-900 border-amber-300',
          }
        : from != null && !showFinal
          ? { label: 'Ориентир', className: 'bg-slate-100 text-slate-600 border-slate-200' }
          : null

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5">
      <div className="mb-2 flex items-center gap-1.5 text-slate-400">
        <CircleDollarSign className="h-3.5 w-3.5 text-[#52A800]" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Стоимость</span>
      </div>
      <p className="font-display text-[1.35rem] font-bold tabular-nums tracking-tight text-slate-900">
        {main}
      </p>
      {badge ? (
        <span
          className={`mt-2 inline-flex rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
      ) : null}
      {items.length ? (
        <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          {items.map((row, i) => (
            <li
              key={`${row.title}-${i}`}
              className="flex items-start justify-between gap-2 text-[13px]"
            >
              <span className="min-w-0 text-slate-600">
                {row.title}
                {row.qty > 1 ? <span className="text-slate-400"> ×{row.qty}</span> : null}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                {formatRub(row.sum ?? row.price) || '—'}
              </span>
            </li>
          ))}
        </ul>
      ) : track.print?.workPerformed && showFinal ? (
        <p className="mt-3 border-t border-slate-100 pt-3 text-[13px] text-slate-600">
          {track.print.workPerformed}
        </p>
      ) : null}
    </div>
  )
}

function statusBadgeClass(track) {
  if (track.status === 'ready') return TONE.success
  if (track.status === 'completed' || track.status === 'issued') return TONE.done
  if (track.status === 'waiting_parts') return TONE.warning
  if (track.status === 'in_progress') return TONE.active
  if (track.status === 'diagnostics' || track.status === 'approval') return TONE.info
  if (track.status === 'cancelled') return TONE.cancelled
  return TONE.muted
}

function SearchCapsule({
  query,
  onQueryChange,
  onSubmit,
  onClear,
  inputRef,
  loading,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-sm transition focus-within:border-[#52A800] focus-within:ring-4 focus-within:ring-[#52A800]/10"
    >
      <div className="shrink-0 pl-3 text-slate-400">
        <Search className="h-5 w-5" strokeWidth={2} />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value.toUpperCase())}
        placeholder="Например: 261024-04"
        className="w-full bg-transparent py-2.5 text-base font-semibold uppercase tabular-nums text-slate-900 outline-none placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400"
        autoComplete="off"
        enterKeyHint="search"
        spellCheck={false}
      />
      {query ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Очистить"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      ) : null}
      <button
        type="submit"
        disabled={loading || query.trim().length < 2}
        className="shrink-0 cursor-pointer rounded-xl bg-[#52A800] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#458F00] disabled:cursor-not-allowed disabled:opacity-40 sm:px-6"
      >
        Найти
      </button>
    </form>
  )
}

function EmptyState({
  query,
  onQueryChange,
  onSubmit,
  onClear,
  onQuickSearch,
  lastOrder,
  company,
  inputRef,
  loading,
}) {
  const lostWa = whatsappUrl(
    company?.whatsapp,
    'Здравствуйте! Подскажите, пожалуйста, статус моего ремонта (квитанцию не могу найти)',
  )

  return (
    <section className="mx-auto max-w-2xl space-y-8 px-0 py-4 sm:py-8">
      <div className="space-y-2.5 text-center">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-[#52A800] uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[#52A800]" />
          <span>Трекер ремонта</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Узнать статус заказа
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
          Введите номер с бумажной квитанции или откройте персональную ссылку из SMS / WhatsApp.
        </p>
      </div>

      <div className="space-y-3">
        <SearchCapsule
          query={query}
          onQueryChange={onQueryChange}
          onSubmit={onSubmit}
          onClear={onClear}
          inputRef={inputRef}
          loading={loading}
        />

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          {lastOrder ? (
            <button
              type="button"
              onClick={() => onQuickSearch(lastOrder.number)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#BEF264]/80 bg-[#ECFCCB]/70 px-3 py-1.5 font-semibold text-[#365314] transition hover:bg-[#ECFCCB]"
            >
              <span>
                Ваш заказ: №{lastOrder.number}
                {lastOrder.model ? ` · ${lastOrder.model}` : ''}
              </span>
              <span aria-hidden>→</span>
            </button>
          ) : null}
          <span className="text-slate-400">Пример:</span>
          <button
            type="button"
            onClick={() => onQuickSearch(DEMO_NUMBER)}
            className="cursor-pointer rounded-full border border-slate-200/90 bg-white px-3 py-1 font-semibold tabular-nums text-slate-700 transition hover:border-slate-300"
          >
            {DEMO_NUMBER}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Где найти номер?
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Посмотрите в правый верхний угол квитанции приёмки — номер выглядит так:{' '}
            <span className="font-bold tabular-nums text-slate-900">№{DEMO_NUMBER}</span>. Также он
            приходит в SMS / WhatsApp от сервиса.
          </p>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="space-y-1">
            <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Потеряли квитанцию?
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Напишите нам — проверим готовность телефона по вашему номеру.
            </p>
          </div>
          <a
            href={lostWa}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ECFCCB] px-4 py-2.5 text-xs font-bold text-[#365314] transition hover:bg-[#d9f99d]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Написать в WhatsApp</span>
            <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </section>
  )
}

function TrackResult({ track, onRefresh, refreshing, toast, onAnother }) {
  const tone = statusBadgeClass(track)
  const warranty = track.warranty || track.documents?.warranty
  const steps = track.progressSteps || []
  const printOrder = useMemo(
    () => ({
      ...track.print,
      orderNumber: track.orderNumber,
      trackToken: track.trackToken,
      completionAct: track.documents?.act
        ? track.print?.completionAct || {
            number: `АВР-${track.orderNumber}`,
            issuedAt: track.issuedAt,
          }
        : null,
      warranty,
      warrantyDays: warranty?.days,
      workDone: track.print?.workPerformed,
      lineItems: track.print?.lineItems || track.lineItems,
      issue: track.issue,
      appearance: track.appearance,
      kit: track.kit,
      createdAt: track.createdAt,
      issuedAt: track.issuedAt,
      promisedAt: track.promisedAt,
      priceFinal: track.priceFinal ?? track.cost,
      priceFrom: track.priceFrom,
      prepayment: track.print?.prepayment ?? 0,
      recommendations: track.print?.recommendations,
      managerName: track.print?.managerName,
      handoverNote: track.print?.recommendations,
      // ПДн: на публичной странице не показываем ФИО/телефон клиента в UI-данных
      clientName: '',
      clientPhone: '',
      hidePhone: true,
    }),
    [track, warranty],
  )

  return (
    <div className="space-y-5">
      {onAnother ? (
        <button
          type="button"
          onClick={onAnother}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Другой заказ
        </button>
      ) : null}

      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-lg font-semibold tabular-nums text-slate-900 sm:text-xl">
            №{track.orderNumber}
          </p>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${tone}`}
          >
            {track.status === 'ready' ? (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            ) : track.status === 'completed' || track.status === 'issued' ? (
              <span className="h-2 w-2 rounded-full bg-[#52A800]" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            {track.status === 'ready' ? 'Готово к выдаче' : track.statusLabel}
          </span>
          {warranty?.days && (track.status === 'completed' || track.status === 'issued') ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#BEF264] bg-[#ECFCCB] px-2.5 py-1 text-[11px] font-semibold text-[#365314]">
              <Shield className="h-3.5 w-3.5" />
              Гарантия {warranty.days} дн.
            </span>
          ) : null}
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>

        <div className="mt-5">
          <ProgressBar
            steps={steps}
            currentStatus={track.status}
            statusTimestamps={track.statusTimestamps}
          />
        </div>

        {track.status === 'ready' ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[13px] font-semibold text-emerald-900">
            Устройство готово — можно забирать в сервисе
            {track.company?.address
              ? ` · ${[track.company.city, track.company.address].filter(Boolean).join(', ')}`
              : ''}
          </div>
        ) : null}

        {track.clientMessage ? (
          <div className="mt-4 flex gap-3 rounded-xl border border-[#BEF264]/60 bg-[#ECFCCB]/40 px-4 py-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ECFCCB]">
              <Bell className="h-4 w-4 text-[#365314]" />
            </div>
            <div>
              <p className="mb-0.5 text-[11px] font-bold tracking-wider text-[#365314] uppercase">
                Сообщение от мастера
              </p>
              <p className="text-[14px] leading-relaxed text-slate-800">{track.clientMessage}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5">
          <div className="mb-2 flex items-center gap-1.5 text-slate-400">
            <Smartphone className="h-3.5 w-3.5 text-[#52A800]" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Устройство</span>
          </div>
          <p className="text-[16px] font-bold text-slate-900">{track.deviceLabel}</p>
          {track.issue ? (
            <p className="mt-1.5 text-[13px] leading-snug text-slate-600">{track.issue}</p>
          ) : null}
          <div className="mt-3 space-y-1 text-[12px] tabular-nums text-slate-500">
            {track.createdAt ? <p>Принят: {formatDateTime(track.createdAt)}</p> : null}
            {track.promisedAt ? <p>Срок: {formatDateTime(track.promisedAt)}</p> : null}
          </div>
        </div>

        <CostCard track={track} />

        <Timeline events={track.events} />

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Документы
          </p>
          <OrderDocuments
            order={printOrder}
            device={{
              clientName: '',
              brand: track.deviceLabel,
              model: '',
            }}
            publicMode
            stacked
          />
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}

function CompanyCard({ company, orderNumber }) {
  const waText = orderNumber
    ? `Здравствуйте! Вопрос по заказу №${orderNumber}`
    : 'Здравствуйте! Подскажите, пожалуйста, статус моего ремонта'

  return (
    <div className="mt-5 rounded-2xl border border-slate-200/90 bg-white p-5">
      <p className="font-display text-[15px] font-bold text-slate-900">
        {company?.name || 'ПРОШИВКА'}
      </p>
      <p className="mt-1 text-[13px] text-slate-600">
        {[company?.city || 'Ставрополь', company?.address || 'ул. Пирогова, 5Ак4']
          .filter(Boolean)
          .join(', ')}
      </p>
      <p className="mt-0.5 text-[12px] text-slate-400">
        {company?.schedule || '10:00–20:00 · ежедневно'}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <a
          href={company?.phoneHref || 'tel:+79880874312'}
          className="inline-flex flex-col items-center gap-1.5 rounded-xl bg-slate-900 px-2 py-3 text-center text-white transition hover:bg-slate-800"
        >
          <Phone className="h-4 w-4" />
          <span className="text-[11px] font-bold">Позвонить</span>
        </a>
        <a
          href={whatsappUrl(company?.whatsapp, waText)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-col items-center gap-1.5 rounded-xl bg-[#52A800] px-2 py-3 text-center text-white transition hover:bg-[#458F00]"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-[11px] font-bold">WhatsApp</span>
        </a>
        <a
          href={mapsUrl(company)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 text-center text-slate-800 transition hover:bg-white"
        >
          <MapPin className="h-4 w-4 text-[#52A800]" />
          <span className="text-[11px] font-bold">На карте</span>
        </a>
      </div>
    </div>
  )
}

export default function TrackPage() {
  const { company: cmsCompany } = useCms()
  const { token } = useParams()
  const [params, setParams] = useSearchParams()
  const numberParam = params.get('number') || ''
  const [query, setQuery] = useState(() => String(numberParam || '').toUpperCase())
  const [track, setTrack] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(token || numberParam))
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState('')
  const [lastOrder, setLastOrder] = useState(() => readLastOrder())
  const inputRef = useRef(null)

  const lookupKey = token || numberParam
  const company = track?.company || cmsCompany

  async function load(key, { soft } = {}) {
    if (!key) return
    if (soft) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const res = await fetchPublicTrack(key)
      setTrack(res.track)
      if (res.track?.orderNumber) {
        writeLastOrder(res.track.orderNumber, res.track.deviceLabel)
        setLastOrder({
          number: String(res.track.orderNumber),
          model: String(res.track.deviceLabel || ''),
        })
      }
      if (soft) {
        const at = formatDateTime(new Date().toISOString())
        setToast(`Обновлено · ${at}`)
        setTimeout(() => setToast(''), 2200)
      }
    } catch (e) {
      setTrack(null)
      setError(e.message || 'Не найдено')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (lookupKey) load(lookupKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when URL key changes
  }, [lookupKey])

  useEffect(() => {
    setQuery(String(numberParam || '').toUpperCase())
  }, [numberParam])

  function runSearch(raw) {
    const q = String(raw || query).trim().toUpperCase()
    if (q.length < 2) return
    setQuery(q)
    setParams({ number: q })
    load(q)
  }

  function onSearch(e) {
    e.preventDefault()
    runSearch(query)
  }

  function clearQuery() {
    setQuery('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function goAnother() {
    setTrack(null)
    setError('')
    setQuery('')
    setParams({})
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const showEmpty = !token && !lookupKey && !track && !loading

  return (
    <div className={token ? 'min-h-dvh bg-[#F4F6F9]' : 'bg-[#F4F6F9]'}>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        {token ? (
          <div className="mb-5">
            <Link to="/" className="inline-block">
              <p className="font-display text-[1.05rem] font-extrabold tracking-tight text-slate-900">
                <span className="text-[#52A800]">ПРО</span>ШИВКА
              </p>
            </Link>
          </div>
        ) : null}

        {showEmpty ? (
          <EmptyState
            query={query}
            onQueryChange={setQuery}
            onSubmit={onSearch}
            onClear={clearQuery}
            onQuickSearch={runSearch}
            lastOrder={lastOrder}
            company={company}
            inputRef={inputRef}
            loading={loading}
          />
        ) : null}

        {!showEmpty ? (
          <div>
            {loading ? (
              <p className="py-10 text-center text-[14px] font-semibold text-slate-500">
                Загрузка статуса…
              </p>
            ) : null}

            {!loading && error && !track ? (
              <div className="space-y-5">
                {!token ? (
                  <div className="space-y-3">
                    <SearchCapsule
                      query={query}
                      onQueryChange={setQuery}
                      onSubmit={onSearch}
                      onClear={clearQuery}
                      inputRef={inputRef}
                      loading={loading}
                    />
                  </div>
                ) : null}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 text-center">
                  <p className="font-display text-[1.1rem] font-bold text-slate-900">
                    Заказ не найден
                  </p>
                  <p className="mt-1 text-[13px] text-slate-500">{error}</p>
                  {!token ? (
                    <button
                      type="button"
                      onClick={goAnother}
                      className="mt-4 text-[13px] font-semibold text-[#52A800]"
                    >
                      ← Вернуться к поиску
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!loading && track ? (
              <TrackResult
                track={track}
                refreshing={refreshing}
                toast={toast}
                onAnother={token ? null : goAnother}
                onRefresh={() => load(lookupKey || track.orderNumber, { soft: true })}
              />
            ) : null}

            {!loading && track ? (
              <CompanyCard company={company} orderNumber={track.orderNumber} />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
