import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCrm } from '../context/CrmContext.jsx'
import { getStatusMeta, orderTypeLabel } from './defaults.js'
import { Button, Card, PageHeader, formatDate, formatMoney } from './components/ui.jsx'

export default function DevicePage() {
  const { id } = useParams()
  const { data, getDevice, ordersForDevice, ready } = useCrm()
  const device = getDevice(id)
  const orders = device ? ordersForDevice(device.id) : []

  if (ready && !device) {
    return (
      <div>
        <p className="text-[14px] text-slate-600">Устройство не найдено.</p>
        <Link to="/crm/search" className="mt-3 inline-block text-[13px] font-bold text-lime-700">
          К поиску
        </Link>
      </div>
    )
  }

  if (!device) return <p className="text-[13px] text-slate-400">Загрузка…</p>

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/crm/search"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-lime-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Поиск
      </Link>

      <PageHeader
        title={[device.brand, device.model].filter(Boolean).join(' ')}
        description={`${device.clientName} · ${device.clientPhone}`}
        actions={
          <Link to={`/crm/new?deviceId=${device.id}`}>
            <Button>Новый заход</Button>
          </Link>
        }
      />

      <Card className="mb-4 text-[13px] text-slate-600">
        {device.imei ? <p>IMEI: {device.imei}</p> : null}
        {device.serial ? <p>S/N: {device.serial}</p> : null}
        <p className="text-slate-400">В базе с {formatDate(device.createdAt)}</p>
      </Card>

      <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-slate-400">
        Все заходы ({orders.length})
      </p>
      <div className="space-y-2">
        {orders.map((o) => (
          <Link
            key={o.id}
            to={`/crm/orders/${o.id}`}
            className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-lime-500/40"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900">
                  №{o.orderNumber || o.number} · {orderTypeLabel(o.type)}
                </p>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  {getStatusMeta(data, o.type, o.status)?.label || o.status}
                </p>
              </div>
              <p className="text-[12px] text-slate-400">{formatDate(o.createdAt)}</p>
            </div>
            {o.issue ? <p className="mt-2 text-[13px] text-slate-700">{o.issue}</p> : null}
            {o.priceFinal != null ? (
              <p className="mt-1 text-[12px] font-semibold text-slate-500">
                {formatMoney(o.priceFinal)}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  )
}
