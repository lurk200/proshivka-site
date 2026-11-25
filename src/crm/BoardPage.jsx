import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useCrm } from '../context/CrmContext.jsx'
import {
  ORDER_TYPES,
  getPipeline,
  getStageColor,
  getStatusMeta,
  orderTotalAmount,
  orderTypeLabel,
  orderWorksSummary,
} from './defaults.js'
import { Button, PageHeader, formatDate, formatMoney } from './components/ui.jsx'

export default function BoardPage() {
  const { data, orders, devices, ready } = useCrm()
  const [type, setType] = useState('regular')
  const [filter, setFilter] = useState('')

  const pipeline = getPipeline(data, type)

  const q = filter.trim().toLowerCase()

  function deviceOf(order) {
    return devices.find((d) => d.id === order.deviceId)
  }

  function orderMatches(order) {
    if (!q) return true
    const device = deviceOf(order)
    const hay = [
      order.orderNumber,
      order.number,
      order.issue,
      order.workDone,
      orderWorksSummary(order),
      device?.brand,
      device?.model,
      device?.clientName,
      device?.clientPhone,
      device?.imei,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  }

  const typedOrders = orders.filter(
    (o) =>
      o.type === type &&
      !getStatusMeta(data, o.type, o.status)?.isTerminal &&
      orderMatches(o),
  )

  const doneOrders = orders
    .filter(
      (o) =>
        o.type === type &&
        getStatusMeta(data, o.type, o.status)?.isTerminal &&
        orderMatches(o),
    )
    .slice(0, 18)

  return (
    <div>
      <PageHeader
        title="Доска заказов"
        description="Колонки по этапам. Закрытые — плотной сеткой внизу."
        actions={
          <Link to="/crm/new">
            <Button>
              <Plus className="h-4 w-4" />
              Приёмка
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ORDER_TYPES.map((t) => {
          const count = orders.filter(
            (o) => o.type === t.id && !getStatusMeta(data, o.type, o.status)?.isTerminal,
          ).length
          const active = type === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`rounded-[var(--crm-radius-md)] px-3.5 py-2 text-[13px] font-semibold transition ${
                active
                  ? 'bg-[var(--crm-brand)] text-white shadow-[0_1px_2px_rgba(82,168,0,0.25)]'
                  : 'border border-[var(--crm-border)] bg-[var(--crm-surface)] text-[var(--crm-text-secondary)] hover:border-[var(--crm-border-strong)] hover:text-[var(--crm-text)]'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-[11px] tabular-nums ${active ? 'opacity-80' : 'opacity-60'}`}>
                {count}
              </span>
            </button>
          )
        })}

        <div className="relative ml-auto min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--crm-text-faint)]" />
          <input
            className="crm-input !pl-8"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Фильтр: клиент, модель, №…"
          />
        </div>
      </div>

      {!ready ? <p className="text-[13px] text-[var(--crm-text-faint)]">Загрузка…</p> : null}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {pipeline
          .filter((s) => !s.isTerminal)
          .map((col) => {
            const list = typedOrders.filter((o) => o.status === col.id)
            return (
              <div
                key={col.id}
                className="crm-kanban-col"
                style={{ '--stage-color': getStageColor(col.id) }}
              >
                <div className="crm-kanban-col-head">
                  <p className="text-[12px] font-bold text-[var(--crm-text)]">{col.label}</p>
                  <span className="rounded-full bg-[var(--crm-subtle)] px-2 py-0.5 text-[11px] font-bold tabular-nums text-[var(--crm-text-muted)]">
                    {list.length}
                  </span>
                </div>
                <div className="crm-kanban-drop space-y-2">
                  {list.map((order) => {
                    const device = deviceOf(order)
                    return (
                      <Link
                        key={order.id}
                        to={`/crm/orders/${order.id}`}
                        className="crm-kanban-card"
                      >
                        <p className="text-[11px] font-bold tabular-nums text-[var(--crm-text-muted)]">
                          №{order.orderNumber || order.number}
                        </p>
                        <p className="mt-0.5 truncate text-[14px] font-bold text-[var(--crm-text)]">
                          {[device?.brand, device?.model].filter(Boolean).join(' ') || 'Устройство'}
                        </p>
                        <p className="mt-1 truncate text-[12px] text-[var(--crm-text-secondary)]">
                          {device?.clientName || '—'} · {device?.clientPhone || '—'}
                        </p>
                        {order.issue ? (
                          <p className="mt-1.5 line-clamp-2 text-[12px] text-[var(--crm-text-muted)]">
                            {order.issue}
                          </p>
                        ) : null}
                        {order.promisedAt ? (
                          <p className="mt-2 text-[11px] font-semibold text-[var(--crm-brand-text)]">
                            Срок: {formatDate(order.promisedAt)}
                          </p>
                        ) : null}
                      </Link>
                    )
                  })}
                  {!list.length ? (
                    <p className="px-2 py-10 text-center text-[12px] text-[var(--crm-text-faint)]">
                      Пусто
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })}
      </div>

      {doneOrders.length ? (
        <div className="mt-8">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--crm-text-faint)]">
            Недавно закрытые · {orderTypeLabel(type)}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {doneOrders.map((order) => {
              const device = deviceOf(order)
              const works = orderWorksSummary(order)
              const total = orderTotalAmount(order)
              const issuedAt = order.issuedAt || order.updatedAt
              return (
                <Link
                  key={order.id}
                  to={`/crm/orders/${order.id}`}
                  className="crm-closed-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12px] font-bold tabular-nums text-[var(--crm-text-muted)]">
                      №{order.orderNumber || order.number}
                    </p>
                    <span
                      className={`tabular-nums text-[13px] font-bold ${
                        total <= 0
                          ? 'rounded bg-[var(--crm-warning-bg)] px-1.5 py-0.5 text-[var(--crm-warning-text)]'
                          : 'text-[var(--crm-text)]'
                      }`}
                    >
                      {formatMoney(total)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[15px] font-bold text-[var(--crm-text)]">
                    {[device?.brand, device?.model].filter(Boolean).join(' ') || 'Устройство'}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-[var(--crm-text-secondary)]">
                    {device?.clientName || 'Клиент не указан'}
                  </p>
                  {works ? (
                    <p className="mt-1.5 line-clamp-2 text-[12px] text-[var(--crm-text-muted)]">
                      {works}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[11px] tabular-nums text-[var(--crm-text-faint)]">
                    {order.status === 'cancelled' ? 'Отменён' : 'Выдан'}{' '}
                    {issuedAt ? formatDate(issuedAt) : ''}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
