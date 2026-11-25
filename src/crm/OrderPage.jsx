import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Copy, Link2, Plus, Trash2 } from 'lucide-react'
import { useCrm } from '../context/CrmContext.jsx'
import {
  WARRANTY_DAY_OPTIONS,
  canIssueOrder,
  emptyLineItem,
  getStatusMeta,
  isIssueStatus,
  lineItemsTotal,
  nextStatuses,
  normalizeLineItems,
  orderTypeLabel,
  progressStatuses,
} from './defaults.js'
import { WORK_POSITION_PRESETS } from './quickPresets.js'
import OrderDocuments from './print/OrderDocuments.jsx'
import { Button, Toast, formatDate, formatMoney } from './components/ui.jsx'

function seedLineItems(order) {
  const normalized = normalizeLineItems(order?.lineItems, order || {})
  if (normalized.length) {
    return normalized.map((row) => ({
      id: row.id,
      title: row.title,
      sku: row.sku === '—' ? '' : row.sku,
      price: row.price ? String(row.price) : '',
      qty: row.qty || 1,
      warrantyDays: row.warrantyDays == null ? '' : String(row.warrantyDays),
    }))
  }
  return [emptyLineItem()]
}

function serializeLineItems(draft) {
  return (draft || [])
    .map((row) => ({
      id: row.id,
      title: String(row.title || '').trim(),
      sku: String(row.sku || '').trim(),
      price: Number(row.price) || 0,
      qty: Math.max(1, Number(row.qty) || 1),
      warrantyDays:
        row.warrantyDays === '' || row.warrantyDays == null
          ? null
          : Number(row.warrantyDays),
    }))
    .filter((row) => row.title)
}

export default function OrderPage() {
  const { id } = useParams()
  const location = useLocation()
  const { data, getOrder, getDevice, ordersForDevice, updateOrder, busy, ready } = useCrm()
  const order = getOrder(id)
  const device = order ? getDevice(order.deviceId) : null
  const siblings = order ? ordersForDevice(order.deviceId) : []

  const [itemsDraft, setItemsDraft] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [clientMessage, setClientMessage] = useState(null)
  const [warrantyDays, setWarrantyDays] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (location.state?.justCreated) {
      setMessage('Заказ создан — распечатайте квитанцию приёма')
    }
  }, [location.state])

  useEffect(() => {
    setItemsDraft(null)
    setRecommendations(null)
    setClientMessage(null)
    setWarrantyDays(null)
  }, [order?.id])

  const items = itemsDraft ?? (order ? seedLineItems(order) : [emptyLineItem()])
  const reco = recommendations ?? order?.recommendations ?? order?.handoverNote ?? ''
  const msg = clientMessage ?? order?.clientMessage ?? ''
  const wDays =
    warrantyDays ??
    (order?.warrantyDays != null ? order.warrantyDays : order?.warranty?.days ?? 30)

  const draftTotal = lineItemsTotal(
    items.map((row) => ({
      price: Number(row.price) || 0,
      qty: Math.max(1, Number(row.qty) || 1),
    })),
  )

  const statusMeta = order ? getStatusMeta(data, order.type, order.status) : null
  const next = order ? nextStatuses(data, order.type, order.status) : []
  const pipeline = useMemo(
    () => (order ? progressStatuses(data, order.type) : []),
    [data, order],
  )
  const trackUrl = order ? `${window.location.origin}/t/${order.trackToken}` : ''
  const statusUrl = order
    ? `${window.location.origin}/status-zakaza?number=${encodeURIComponent(order.orderNumber || order.number)}`
    : ''

  const probe = order ? { ...order, lineItems: serializeLineItems(items) } : null
  const issueReady = probe ? canIssueOrder(probe) : false

  if (ready && !order) {
    return (
      <div>
        <p className="text-[14px] text-[var(--crm-text-secondary)]">Заказ не найден.</p>
        <Link
          to="/crm"
          className="mt-3 inline-block text-[13px] font-bold"
          style={{ color: 'var(--crm-brand)' }}
        >
          На доску
        </Link>
      </div>
    )
  }

  if (!order || !device) {
    return <p className="text-[13px] text-[var(--crm-text-faint)]">Загрузка…</p>
  }

  const displayNumber = order.orderNumber || order.number
  const deviceLabel = [device.brand, device.model].filter(Boolean).join(' ')
  const events = [...(order.events || [])].reverse().slice(0, 6)
  const closed = statusMeta?.isTerminal
  const zeroTotalWarn = closed && order.status !== 'cancelled' && draftTotal <= 0

  function updateItem(itemId, patch) {
    setItemsDraft((prev) => {
      const base = prev ?? seedLineItems(order)
      return base.map((row) => (row.id === itemId ? { ...row, ...patch } : row))
    })
  }

  function addItem(presetTitle = '') {
    setItemsDraft((prev) => {
      const base = prev ?? seedLineItems(order)
      const emptyIdx = base.findIndex((row) => !String(row.title).trim())
      if (presetTitle && emptyIdx >= 0) {
        return base.map((row, i) =>
          i === emptyIdx
            ? {
                ...row,
                title: presetTitle,
                warrantyDays: row.warrantyDays || String(wDays || ''),
              }
            : row,
        )
      }
      const nextRow = emptyLineItem()
      if (presetTitle) {
        nextRow.title = presetTitle
        nextRow.warrantyDays = String(wDays || '')
      }
      return [...base, nextRow]
    })
  }

  function removeItem(itemId) {
    setItemsDraft((prev) => {
      const base = prev ?? seedLineItems(order)
      const nextRows = base.filter((row) => row.id !== itemId)
      return nextRows.length ? nextRows : [emptyLineItem()]
    })
  }

  function payload(extra = {}) {
    return {
      lineItems: serializeLineItems(items),
      recommendations: reco,
      handoverNote: reco,
      clientMessage: msg,
      priceFinal: draftTotal > 0 ? draftTotal : null,
      warrantyDays: Number(wDays) || 0,
      ...extra,
    }
  }

  function clearDraft() {
    setItemsDraft(null)
    setRecommendations(null)
    setClientMessage(null)
    setWarrantyDays(null)
  }

  async function saveFields() {
    setError('')
    setMessage('')
    try {
      await updateOrder(order.id, payload())
      clearDraft()
      setMessage('Сохранено')
    } catch (e) {
      setError(e.message)
    }
  }

  async function moveTo(statusId) {
    setError('')
    setMessage('')
    try {
      await updateOrder(order.id, payload({ status: statusId }))
      clearDraft()
      setMessage(
        isIssueStatus(data, order.type, statusId)
          ? 'Выдан — распечатайте акт'
          : 'Статус обновлён',
      )
    } catch (e) {
      setError(e.message)
    }
  }

  async function copyText(text, label = 'Скопировано') {
    try {
      await navigator.clipboard.writeText(text)
      setToast(label)
    } catch {
      setError('Не удалось скопировать')
    }
  }

  const terminalNext = next.filter((s) => isIssueStatus(data, order.type, s.id))
  const normalNext = next.filter((s) => !s.isTerminal)
  const activeIdx = pipeline.findIndex((s) => s.id === order.status)

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Link
          to="/crm"
          className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-brand)] hover:bg-[var(--crm-surface)]"
          title="На доску"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-[1.2rem] font-bold tracking-tight text-[var(--crm-text)]">
          №{displayNumber}
        </h1>
        <span className="text-[12px] font-semibold text-[var(--crm-text-muted)]">
          {orderTypeLabel(order.type)}
        </span>
        <span className="crm-badge">{statusMeta?.label || order.status}</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="crm-btn-ghost"
            onClick={() => copyText(trackUrl, 'Ссылка скопирована')}
          >
            <Copy className="h-3.5 w-3.5" />
            Ссылка
          </button>
          <button type="button" className="crm-btn-primary" disabled={busy} onClick={saveFields}>
            Сохранить
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="crm-stepper mb-3">
        {pipeline.map((s, i) => {
          const done = activeIdx >= 0 && i < activeIdx
          const current = s.id === order.status
          return (
            <div
              key={s.id}
              className={`crm-step ${current ? 'is-active' : done ? 'is-done' : ''}`}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--crm-brand)]" /> : null}
              <span className="truncate">{s.label}</span>
            </div>
          )
        })}
      </div>

      <div className="crm-panel">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_268px]">
          {/* LEFT */}
          <div className="min-w-0 border-b border-[var(--crm-border)] lg:border-b-0 lg:border-r">
            {/* Device */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--crm-border)] px-5 py-4">
              <div className="min-w-0">
                <p className="font-display text-[18px] font-bold leading-tight text-[var(--crm-text)]">
                  {deviceLabel}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[var(--crm-text-secondary)]">
                  <span className="font-medium">{device.clientName}</span>
                  <span className="text-[var(--crm-border-strong)]">·</span>
                  <button
                    type="button"
                    onClick={() => copyText(device.clientPhone, 'Телефон скопирован')}
                    className="inline-flex items-center gap-1 rounded-[var(--crm-radius-sm)] font-semibold tabular-nums text-[var(--crm-text)] underline decoration-[var(--crm-border)] underline-offset-2 hover:decoration-[var(--crm-brand)]"
                    title="Скопировать номер"
                  >
                    {device.clientPhone}
                    <Copy className="h-3 w-3 text-[var(--crm-text-faint)]" />
                  </button>
                  {device.imei ? (
                    <>
                      <span className="text-[var(--crm-border-strong)]">·</span>
                      <span className="text-[var(--crm-text-muted)]">IMEI {device.imei}</span>
                    </>
                  ) : null}
                </p>
                <p className="mt-2 text-[14px] font-medium text-[var(--crm-text)]">{order.issue}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--crm-text-muted)]">
                  {[
                    `Принят ${formatDate(order.createdAt)}`,
                    order.promisedAt ? `Срок ${formatDate(order.promisedAt)}` : null,
                    order.priceFrom != null ? `от ${formatMoney(order.priceFrom)}` : null,
                    order.appearance,
                    order.kit,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div className="flex gap-1.5">
                <Link to={`/crm/devices/${device.id}`} className="crm-btn-ghost">
                  История
                </Link>
                <Link to={`/crm/new?deviceId=${device.id}`} className="crm-btn-ghost">
                  Новый заход
                </Link>
              </div>
            </div>

            {/* Positions */}
            <div className="px-5 py-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <p className="text-[14px] font-bold text-[var(--crm-text)]">Позиции акта</p>
                <select
                  className="crm-input !w-auto !py-1.5 text-[12px] font-semibold"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addItem(e.target.value)
                      e.target.value = ''
                    }
                  }}
                >
                  <option value="" disabled>
                    + Быстро добавить
                  </option>
                  {WORK_POSITION_PRESETS.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
                <button type="button" className="crm-btn-ghost" onClick={() => addItem()}>
                  <Plus className="h-3.5 w-3.5" />
                  Строка
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] table-fixed border-collapse">
                  <colgroup>
                    <col className="w-8" />
                    <col />
                    <col className="w-[104px]" />
                    <col className="w-[68px]" />
                    <col className="w-[72px]" />
                    <col className="w-[88px]" />
                    <col className="w-9" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-[var(--crm-border)] bg-[var(--crm-subtle)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--crm-text-muted)]">
                      <th className="px-2 py-2.5">№</th>
                      <th className="px-2 py-2.5">Название</th>
                      <th className="px-2 py-2.5">Цена</th>
                      <th className="px-2 py-2.5">Кол</th>
                      <th className="px-2 py-2.5">Гар.</th>
                      <th className="px-2 py-2.5">Арт.</th>
                      <th className="px-1 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, index) => (
                      <tr
                        key={row.id}
                        className="border-b border-[var(--crm-border)] hover:bg-[var(--crm-subtle)]"
                      >
                        <td className="px-2 py-2 text-[12px] text-[var(--crm-text-faint)]">
                          {index + 1}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            className="crm-input"
                            value={row.title}
                            onChange={(e) => updateItem(row.id, { title: e.target.value })}
                            placeholder="Название работы / запчасти"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            className="crm-input crm-input-num"
                            value={row.price}
                            onChange={(e) => updateItem(row.id, { price: e.target.value })}
                            placeholder="0"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={1}
                            className="crm-input crm-input-num"
                            value={row.qty}
                            onChange={(e) => updateItem(row.id, { qty: e.target.value })}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            className="crm-input crm-input-num"
                            value={row.warrantyDays}
                            onChange={(e) =>
                              updateItem(row.id, { warrantyDays: e.target.value })
                            }
                            placeholder={String(wDays || '')}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            className="crm-input"
                            value={row.sku}
                            onChange={(e) => updateItem(row.id, { sku: e.target.value })}
                            placeholder="—"
                          />
                        </td>
                        <td className="px-1 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(row.id)}
                            className="rounded p-1 text-[var(--crm-text-faint)] hover:bg-[var(--crm-danger-bg)] hover:text-[var(--crm-danger-text)]"
                            aria-label="Удалить"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[var(--crm-subtle)]">
                      <td colSpan={2} className="px-2 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[12px] font-semibold text-[var(--crm-text-muted)]">
                            Гарантия
                          </span>
                          <select
                            className="crm-input !w-auto !py-1 text-[12px]"
                            value={String(wDays)}
                            onChange={(e) => setWarrantyDays(Number(e.target.value))}
                          >
                            {WARRANTY_DAY_OPTIONS.map((d) => (
                              <option key={d} value={d}>
                                {d === 0 ? 'Нет' : `${d} дн.`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td colSpan={5} className="px-2 py-2.5 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          {zeroTotalWarn ? (
                            <span className="crm-badge-warn rounded-[var(--crm-radius-sm)] px-2 py-0.5 text-[11px] font-semibold">
                              Сумма 0 ₽ — проверьте цену
                            </span>
                          ) : null}
                          <span className="crm-price text-[14px]">
                            Итого {formatMoney(draftTotal)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                    Рекомендации в акт
                  </span>
                  <textarea
                    rows={2}
                    value={reco}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="Необязательно"
                    className="crm-input resize-y"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                    Сообщение на треке
                  </span>
                  <textarea
                    rows={2}
                    value={msg}
                    onChange={(e) => setClientMessage(e.target.value)}
                    placeholder="Необязательно"
                    className="crm-input resize-y"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <aside className="flex flex-col bg-[var(--crm-subtle)]">
            <div className="border-b border-[var(--crm-border)] px-4 py-3.5">
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--crm-text-faint)]">
                Действие
              </p>
              {closed ? (
                <p className="text-[13px] font-medium text-[var(--crm-text-secondary)]">
                  {order.status === 'cancelled' ? 'Отменён' : 'Выдан, акт оформлен'}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {normalNext.map((s) => (
                    <Button
                      key={s.id}
                      className="w-full"
                      disabled={busy}
                      onClick={() => moveTo(s.id)}
                    >
                      → {s.label}
                    </Button>
                  ))}
                  {terminalNext.map((s) => (
                    <div key={s.id}>
                      <Button
                        className="w-full"
                        variant="dark"
                        disabled={busy || !issueReady}
                        onClick={() => moveTo(s.id)}
                      >
                        → {s.label}
                      </Button>
                      {!issueReady ? (
                        <p className="mt-1 text-[11px] text-[var(--crm-warning-text)]">
                          Нужна позиция в акте
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-b border-[var(--crm-border)] px-4 py-3.5">
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--crm-text-faint)]">
                Документы
              </p>
              <OrderDocuments order={order} device={device} compact />
            </div>

            {siblings.length > 1 ? (
              <div className="border-b border-[var(--crm-border)] px-4 py-3.5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--crm-text-faint)]">
                  Заходы
                </p>
                <ul className="space-y-0.5">
                  {siblings.map((o) => (
                    <li key={o.id}>
                      <Link
                        to={`/crm/orders/${o.id}`}
                        className={`block rounded-[var(--crm-radius-sm)] px-2 py-1.5 text-[12px] ${
                          o.id === order.id
                            ? 'bg-[var(--crm-brand-soft)] font-bold text-[var(--crm-brand-text)]'
                            : 'text-[var(--crm-text-secondary)] hover:bg-[var(--crm-surface)]'
                        }`}
                      >
                        №{o.orderNumber || o.number}{' '}
                        <span className="font-normal text-[var(--crm-text-faint)]">
                          {getStatusMeta(data, o.type, o.status)?.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="px-4 py-3.5">
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--crm-text-faint)]">
                События
              </p>
              {events.length ? (
                <ul className="crm-timeline">
                  {events.map((ev) => (
                    <li key={ev.id}>
                      <p className="text-[11px] text-[var(--crm-text-faint)]">{formatDate(ev.at)}</p>
                      <p className="mt-0.5 text-[12px] font-medium leading-snug text-[var(--crm-text)]">
                        {ev.text}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-[var(--crm-text-faint)]">Пока пусто</p>
              )}
              <div className="mt-3 space-y-1 border-t border-[var(--crm-border)] pt-2.5">
                <a
                  href={trackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--crm-text-muted)] hover:text-[var(--crm-brand)]"
                >
                  <Link2 className="h-3 w-3" />
                  Трек по ссылке
                </a>
                <a
                  href={statusUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--crm-text-muted)] hover:text-[var(--crm-brand)]"
                >
                  <Link2 className="h-3 w-3" />
                  Трек по номеру
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {(error || message) && (
        <p
          className={`mt-2 text-[13px] font-medium ${
            error ? 'text-[var(--crm-danger-text)]' : 'text-[var(--crm-brand)]'
          }`}
        >
          {error || message}
        </p>
      )}

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
