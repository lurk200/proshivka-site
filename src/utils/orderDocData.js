import { DEFAULT_MANAGER_NAME } from '../data/orderDocumentTexts';

export function formatMoneyRub(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0,00 ₽';
  return `${n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;
}

export function formatDocDateShort(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '—';
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
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function qrImageUrl(data, size = 128) {
  if (!data) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=4&data=${encodeURIComponent(data)}`;
}

function clientLine(order) {
  const parts = [];
  if (order.clientName?.trim()) parts.push(order.clientName.trim());
  if (order.clientPhone?.trim()) parts.push(order.clientPhone.trim());
  return parts.join(', ') || '—';
}

function buildLineItems(order, warrantyDays) {
  const text = order.workPerformed?.trim() || order.publicComment?.trim() || 'Ремонт устройства';
  const price = order.cost ?? 0;
  return [
    {
      index: 1,
      title: text,
      sku: '—',
      warrantyDays: warrantyDays ?? '—',
      price,
      discount: 0,
      qty: 1,
      sum: price,
    },
  ];
}

/**
 * @param {object} order — поля заказа (публичные или из админки)
 * @param {object} company — cms company
 * @param {{ siteOrigin?: string, settings?: object }} [opts]
 *   settings.reviewUrl — ссылка для QR отзывов из /admin/settings/company
 */
export function buildOrderDocData(order, company, opts = {}) {
  const origin =
    opts.siteOrigin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://proshivka.ru');
  const warrantyDays = order.warranty?.days ?? order.warrantyDays ?? null;
  const lineItems = buildLineItems(order, warrantyDays);
  const total = lineItems.reduce((s, i) => s + (Number(i.sum) || 0), 0);

  const settings = opts.settings || {};
  const companyName = settings.name || company.name || 'ПРОШИВКА';
  const companyTagline = settings.tagline || company.brandTagline || company.descriptor || 'Ремонт смартфонов и электроники';
  const companyPhone = settings.phone || company.phone || '';
  const companyAddress = settings.address || company.address || '';
  const reviewUrl = settings.reviewUrl || origin;

  return {
    orderNumber: order.orderNumber,
    orderDate: formatDocDateShort(order.createdAt || order.issuedAt || order.updatedAt),
    printDate: formatDocDateTime(new Date()),
    actDate: formatDocDateShort(order.issuedAt || order.completionAct?.issuedAt),
    actNumber: order.completionAct?.number || `АВР-${order.orderNumber}`,
    company: {
      name: companyName.trim(),
      tagline: companyTagline.trim(),
      title: `${companyName} ${companyTagline}`.trim(),
      phone: companyPhone,
      address: companyAddress,
    },
    clientLine: clientLine(order),
    clientName: order.clientName?.trim() || '',
    reason: order.reason?.trim() || order.publicComment?.trim() || '—',
    device: order.device || '—',
    appearance: order.appearance?.trim() || '',
    kit: order.kit?.trim() || '',
    prepayment: formatMoneyRub(order.prepayment ?? 0),
    recommendations: order.recommendations?.trim() || order.publicComment?.trim() || '',
    estimatedReadyAt: formatDocDateShort(order.estimatedReadyAt || order.readyAt),
    estimatedCost:
      order.cost != null && order.cost !== ''
        ? formatMoneyRub(order.cost).replace(' ₽', '')
        : order.cost === 0
          ? '0'
          : '—',
    receiverNote: order.internalNote?.trim() || '',
    managerName: order.managerName?.trim() || DEFAULT_MANAGER_NAME,
    lineItems,
    total,
    totalFormatted: formatMoneyRub(total),
    warrantyDays,
    warrantyUntil: order.warranty?.until ? formatDocDateShort(order.warranty.until) : null,
    statusQrUrl: `${origin}/status-zakaza?number=${encodeURIComponent(order.orderNumber)}`,
    reviewQrUrl: reviewUrl,
  };
}
