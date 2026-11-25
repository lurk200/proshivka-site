import { lineItemsTotal, normalizeLineItems } from '../defaults.js'
import { DEFAULT_MANAGER_NAME } from './documentTexts.js'

export function formatMoneyRub(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0,00 ₽'
  return `${n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`
}

export function formatDocDateShort(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return '—'
  }
}

export function formatDocDateTime(iso = new Date()) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

export function qrImageUrl(data, size = 128) {
  if (!data) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=4&data=${encodeURIComponent(data)}`
}

function clientLine(order, device) {
  const parts = []
  const name = order.clientName || device?.clientName
  const phone = order.clientPhone || device?.clientPhone
  if (name?.trim()) parts.push(name.trim())
  if (phone?.trim() && order.hidePhone !== true) parts.push(phone.trim())
  return parts.join(', ') || '—'
}

/**
 * Собирает данные для печати актов из заказа CRM + устройства + компании.
 */
export function buildOrderDocData(order, device, company, opts = {}) {
  const origin =
    opts.siteOrigin ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  const warrantyDays = order.warranty?.days ?? order.warrantyDays ?? null
  const normalized = normalizeLineItems(order.lineItems, order)
  const fallbackPrice = Number(order.priceFinal ?? order.cost ?? order.priceFrom ?? 0) || 0
  const sourceRows =
    normalized.length > 0
      ? normalized
      : [
          {
            title: order.workDone?.trim() || order.workPerformed?.trim() || 'Ремонт устройства',
            sku: '—',
            price: fallbackPrice,
            qty: 1,
            warrantyDays,
            discount: 0,
            sum: fallbackPrice,
          },
        ]

  const lineItems = sourceRows.map((row, i) => ({
    index: i + 1,
    title: row.title,
    sku: row.sku || '—',
    warrantyDays: row.warrantyDays ?? warrantyDays ?? '—',
    price: row.price,
    discount: 0,
    qty: row.qty,
    sum: row.sum ?? row.price * (row.qty || 1),
  }))
  const total = lineItemsTotal(sourceRows) || fallbackPrice
  const orderNumber = order.orderNumber || String(order.number)
  const deviceLabel =
    order.device ||
    [device?.brand, device?.model].filter(Boolean).join(' ') ||
    '—'

  const trackUrl = order.trackToken
    ? `${origin}/t/${order.trackToken}`
    : `${origin}/status-zakaza?number=${encodeURIComponent(orderNumber)}`

  return {
    orderNumber,
    orderDate: formatDocDateShort(order.createdAt),
    printDate: formatDocDateTime(new Date()),
    actDate: formatDocDateShort(order.issuedAt || order.completionAct?.issuedAt),
    actNumber: order.completionAct?.number || `АВР-${orderNumber}`,
    company: {
      name: (company?.name || 'ПРОШИВКА').trim(),
      tagline: (company?.tagline || 'Ремонт смартфонов и электроники').trim(),
      title: `${company?.name || 'ПРОШИВКА'} ${company?.tagline || ''}`.trim(),
      phone: company?.phone || '',
      address: company?.address || '',
    },
    clientLine: clientLine(
      {
        clientName: device?.clientName || order.clientName,
        clientPhone: opts.public ? '' : device?.clientPhone || order.clientPhone,
        hidePhone: opts.public,
      },
      device,
    ),
    clientName: device?.clientName || order.clientName || '',
    reason: order.issue || order.reason || '—',
    device: deviceLabel,
    appearance: order.appearance || '',
    kit: order.kit || '',
    prepayment: formatMoneyRub(order.prepayment ?? 0),
    recommendations: order.recommendations || order.handoverNote || '',
    estimatedReadyAt: formatDocDateShort(order.promisedAt || order.readyAt),
    estimatedCost:
      total != null && total !== ''
        ? formatMoneyRub(total).replace(' ₽', '')
        : '—',
    receiverNote: order.internalNote || '',
    managerName: order.managerName?.trim() || DEFAULT_MANAGER_NAME,
    lineItems,
    total,
    totalFormatted: formatMoneyRub(total),
    warrantyDays,
    warrantyUntil: order.warranty?.until ? formatDocDateShort(order.warranty.until) : null,
    statusQrUrl: trackUrl,
    // QR отзыва только если задана явная ссылка — иначе блок в АВР не печатаем.
    reviewQrUrl: String(opts.reviewUrl || company?.reviewUrl || '').trim(),
  }
}
