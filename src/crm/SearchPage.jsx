import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import { searchCrmDevices } from '../api/crmApi.js'
import { getStatusMeta, orderTypeLabel } from './defaults.js'
import { Button, Card, Input, PageHeader, formatDate } from './components/ui.jsx'
import { useCrm } from '../context/CrmContext.jsx'

export default function SearchPage() {
  const { data } = useCrm()
  const location = useLocation()
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!location.state?.focusSearch) return
    const el = document.getElementById('crm-search-input')
    el?.focus()
    el?.select()
  }, [location.state])

  async function onSearch(e) {
    e?.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await searchCrmDevices(q)
      setResults(res.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Поиск устройства"
        description="По телефону, IMEI, модели или имени — все заходы сразу. Ctrl+K с любого экрана CRM."
      />

      <form onSubmit={onSearch} className="mb-4 flex gap-2">
        <Input
          id="crm-search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Телефон, IMEI, модель…"
          className="flex-1"
        />
        <Button type="submit" disabled={busy || q.trim().length < 2}>
          <Search className="h-4 w-4" />
          Найти
        </Button>
      </form>

      {error ? <p className="mb-3 text-[13px] text-[var(--crm-danger-text)]">{error}</p> : null}

      <div className="space-y-3">
        {results.map(({ device, orders }) => (
          <Card key={device.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[16px] font-bold text-[var(--crm-text)]">
                  {[device.brand, device.model].filter(Boolean).join(' ')}
                </p>
                <p className="text-[13px] text-[var(--crm-text-secondary)]">
                  {device.clientName} ·{' '}
                  <span className="tabular-nums">{device.clientPhone}</span>
                </p>
                {device.imei ? (
                  <p className="text-[12px] tabular-nums text-[var(--crm-text-faint)]">
                    IMEI: {device.imei}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Link to={`/crm/devices/${device.id}`}>
                  <Button variant="ghost">Карточка</Button>
                </Link>
                <Link to={`/crm/new?deviceId=${device.id}`}>
                  <Button>Новый заход</Button>
                </Link>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 border-t border-[var(--crm-border)] pt-3">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/crm/orders/${o.id}`}
                    className="flex items-center justify-between rounded-[var(--crm-radius-sm)] px-2 py-1.5 text-[13px] hover:bg-[var(--crm-hover)]"
                  >
                    <span className="tabular-nums text-[var(--crm-text-secondary)]">
                      №{o.orderNumber || o.number} · {orderTypeLabel(o.type)} ·{' '}
                      {getStatusMeta(data, o.type, o.status)?.label || o.status}
                    </span>
                    <span className="text-[11px] tabular-nums text-[var(--crm-text-faint)]">
                      {formatDate(o.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
        {!busy && q && !results.length ? (
          <p className="text-[13px] text-[var(--crm-text-faint)]">Ничего не найдено</p>
        ) : null}
      </div>
    </div>
  )
}
