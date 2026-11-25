/** CRM v2 — модель как в v1 (акты + трек), удобнее в работе. */

export const ORDER_TYPES = [
  { id: 'regular', label: 'Обычный' },
  { id: 'warranty', label: 'Гарантийный' },
  { id: 'onsite', label: 'Выездной' },
  { id: 'corporate', label: 'Корпоративный' },
]

export const APPEARANCE_OPTIONS = [
  'Царапины',
  'Сколы',
  'Трещины корпуса',
  'Разбит экран',
  'Следы влаги',
  'Потёртости',
  'Без видимых повреждений',
]

export const KIT_OPTIONS = ['Телефон', 'SIM', 'Карта памяти', 'Чехол', 'Зарядка', 'Коробка']

export const WARRANTY_DAY_OPTIONS = [0, 14, 30, 45, 60, 90, 180, 365]

/**
 * Пайплайны по типу. regular ≈ v1.
 * isTerminal = выдача (нужны позиции в акте).
 */
export const DEFAULT_STATUS_PIPELINES = {
  regular: [
    { id: 'accepted', label: 'Принято', isTerminal: false, tone: 'muted' },
    { id: 'diagnostics', label: 'Диагностика', isTerminal: false, tone: 'info' },
    { id: 'waiting_parts', label: 'Ожидание запчасти', isTerminal: false, tone: 'warning' },
    { id: 'in_progress', label: 'В работе', isTerminal: false, tone: 'active' },
    { id: 'ready', label: 'Готово', isTerminal: false, tone: 'success' },
    { id: 'completed', label: 'Выдан', isTerminal: true, tone: 'done' },
    { id: 'cancelled', label: 'Отменено', isTerminal: true, tone: 'cancelled' },
  ],
  warranty: [
    { id: 'accepted', label: 'Принят по гарантии', isTerminal: false, tone: 'muted' },
    { id: 'diagnostics', label: 'Диагностика', isTerminal: false, tone: 'info' },
    { id: 'in_progress', label: 'В ремонте', isTerminal: false, tone: 'active' },
    { id: 'ready', label: 'Готово', isTerminal: false, tone: 'success' },
    { id: 'completed', label: 'Выдан', isTerminal: true, tone: 'done' },
    { id: 'cancelled', label: 'Отменено', isTerminal: true, tone: 'cancelled' },
  ],
  onsite: [
    { id: 'request', label: 'Заявка', isTerminal: false, tone: 'muted' },
    { id: 'en_route', label: 'В пути', isTerminal: false, tone: 'info' },
    { id: 'on_site', label: 'На месте', isTerminal: false, tone: 'active' },
    { id: 'completed', label: 'Закрыт', isTerminal: true, tone: 'done' },
    { id: 'cancelled', label: 'Отменено', isTerminal: true, tone: 'cancelled' },
  ],
  corporate: [
    { id: 'accepted', label: 'Принят', isTerminal: false, tone: 'muted' },
    { id: 'approval', label: 'Согласование', isTerminal: false, tone: 'warning' },
    { id: 'in_progress', label: 'В работе', isTerminal: false, tone: 'active' },
    { id: 'ready', label: 'Готово', isTerminal: false, tone: 'success' },
    { id: 'completed', label: 'Выдан', isTerminal: true, tone: 'done' },
    { id: 'cancelled', label: 'Отменено', isTerminal: true, tone: 'cancelled' },
  ],
}

export function emptyCrmData() {
  return {
    version: 2,
    pipelines: structuredClone(DEFAULT_STATUS_PIPELINES),
    devices: [],
    orders: [],
    nextDeviceNum: 1,
    nextOrderNum: 1,
  }
}

export function getPipeline(data, type) {
  const pipelines = data?.pipelines || DEFAULT_STATUS_PIPELINES
  return pipelines[type] || pipelines.regular || DEFAULT_STATUS_PIPELINES.regular
}

export function getStatusMeta(data, type, statusId) {
  return getPipeline(data, type).find((s) => s.id === statusId) || null
}

export function firstStatusId(data, type) {
  return getPipeline(data, type)[0]?.id || 'accepted'
}

export function progressStatuses(data, type) {
  return getPipeline(data, type).filter((s) => s.id !== 'cancelled')
}

export function getStatusProgressIndex(data, type, statusId) {
  if (statusId === 'cancelled') return -1
  const steps = progressStatuses(data, type)
  const idx = steps.findIndex((s) => s.id === statusId)
  return idx >= 0 ? idx : 0
}

export function nextStatuses(data, type, currentStatusId) {
  const pipe = getPipeline(data, type).filter((s) => s.id !== 'cancelled')
  const idx = pipe.findIndex((s) => s.id === currentStatusId)
  if (idx < 0) return pipe.slice(0, 1)
  if (idx >= pipe.length - 1) return []
  return [pipe[idx + 1]]
}

export function isTerminalStatus(data, type, statusId) {
  return Boolean(getStatusMeta(data, type, statusId)?.isTerminal)
}

export function isIssueStatus(data, type, statusId) {
  if (statusId === 'cancelled') return false
  if (statusId === 'completed' || statusId === 'issued') return true
  const meta = getStatusMeta(data, type, statusId)
  return Boolean(meta?.isTerminal)
}

/** Пустая строка позиций акта. */
export function emptyLineItem() {
  return {
    id: makeId('li'),
    title: '',
    sku: '',
    price: '',
    qty: 1,
    warrantyDays: '',
  }
}

/** Нормализация позиций акта (несколько работ/запчастей). */
export function normalizeLineItems(raw, order = {}) {
  if (Array.isArray(raw) && raw.length) {
    return raw
      .map((row) => {
        const qty = Math.max(1, Number(row.qty) || 1)
        const price = Number(row.price)
        const safePrice = Number.isFinite(price) ? price : 0
        const warrantyRaw = row.warrantyDays
        const warrantyDays =
          warrantyRaw === '' || warrantyRaw == null ? null : Number(warrantyRaw)
        return {
          id: String(row.id || makeId('li')),
          title: String(row.title || '').trim(),
          sku: String(row.sku || '').trim() || '—',
          price: safePrice,
          qty,
          warrantyDays: Number.isFinite(warrantyDays) ? warrantyDays : null,
          discount: 0,
          sum: safePrice * qty,
        }
      })
      .filter((row) => row.title)
  }

  const work = String(order.workDone || order.workPerformed || '').trim()
  if (!work) return []
  const price = Number(order.priceFinal ?? order.cost ?? 0) || 0
  const warrantyDays =
    order.warranty?.days ?? (order.warrantyDays != null ? Number(order.warrantyDays) : null)
  return [
    {
      id: 'legacy',
      title: work,
      sku: '—',
      price,
      qty: 1,
      warrantyDays: Number.isFinite(warrantyDays) ? warrantyDays : null,
      discount: 0,
      sum: price,
    },
  ]
}

export function lineItemsTotal(items) {
  return (items || []).reduce((sum, row) => {
    const qty = Math.max(1, Number(row.qty) || 1)
    const price = Number(row.price) || 0
    const explicit = Number(row.sum)
    return sum + (Number.isFinite(explicit) && explicit > 0 ? explicit : price * qty)
  }, 0)
}

export function workDoneFromLineItems(items) {
  return normalizeLineItems(items)
    .map((row) => row.title)
    .filter(Boolean)
    .join('; ')
}

/** Выдача: достаточно хотя бы одной заполненной позиции акта. */
export function canIssueOrder(order) {
  const items = normalizeLineItems(order?.lineItems, order)
  return items.length > 0
}

export function orderTypeLabel(type) {
  return ORDER_TYPES.find((t) => t.id === type)?.label || type
}

/** Цвет этапа канбана (CSS-переменная). */
const STAGE_COLOR_BY_ID = {
  accepted: 'var(--crm-stage-accepted)',
  diagnostics: 'var(--crm-stage-diag)',
  waiting_parts: 'var(--crm-stage-parts)',
  in_progress: 'var(--crm-stage-work)',
  ready: 'var(--crm-stage-ready)',
  request: 'var(--crm-stage-accepted)',
  en_route: 'var(--crm-stage-diag)',
  on_site: 'var(--crm-stage-work)',
  approval: 'var(--crm-stage-parts)',
}

export function getStageColor(statusId) {
  return STAGE_COLOR_BY_ID[statusId] || 'var(--crm-brand)'
}

/** Краткий список работ для карточек / архива. */
export function orderWorksSummary(order) {
  const items = normalizeLineItems(order?.lineItems, order || {})
  if (items.length) return items.map((row) => row.title).join(', ')
  return String(order?.workDone || order?.issue || '').trim()
}

export function orderTotalAmount(order) {
  const fromItems = lineItemsTotal(normalizeLineItems(order?.lineItems, order || {}))
  if (fromItems > 0) return fromItems
  const final = Number(order?.priceFinal)
  if (Number.isFinite(final) && final > 0) return final
  return 0
}

export function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function makeTrackToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 8)
}

export function makeOrderNumber(data, date = new Date()) {
  const y = String(date.getFullYear()).slice(2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const prefix = `${y}${m}${d}`
  const today = (data.orders || []).filter((o) =>
    String(o.orderNumber || '').startsWith(`${prefix}-`),
  ).length
  return `${prefix}-${String(today + 1).padStart(2, '0')}`
}

export function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

export function addDaysIso(iso, days) {
  const d = new Date(iso)
  d.setDate(d.getDate() + Number(days || 0))
  return d.toISOString()
}

export function warrantyDaysLeft(warranty) {
  if (!warranty?.until) return null
  const ms = new Date(warranty.until).getTime() - Date.now()
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

export function publicTrackPayload(data, order, device, company) {
  const pipe = progressStatuses(data, order.type)
  const status = getStatusMeta(data, order.type, order.status)
  const events = (order.events || [])
    .filter((e) => e.public !== false)
    .map((e) => ({
      at: e.at,
      kind: e.kind,
      label: e.publicText || e.text,
      text: e.publicText || e.text,
      note: e.note || '',
    }))

  const lineItems = normalizeLineItems(order.lineItems, order).map((row) => ({
    title: row.title,
    qty: row.qty,
    sum: row.sum,
    price: row.price,
  }))
  const priceFinal = order.priceFinal != null ? Number(order.priceFinal) : null
  const priceFrom = order.priceFrom != null ? Number(order.priceFrom) : null
  const itemsTotal = lineItemsTotal(lineItems)
  const issued = Boolean(order.completionAct) || order.status === 'completed' || order.status === 'issued'
  const ready = order.status === 'ready'

  let paymentBadge = null
  if (issued) paymentBadge = 'paid'
  else if (ready) paymentBadge = 'pay_on_pickup'

  return {
    id: order.id,
    orderNumber: order.orderNumber || String(order.number),
    trackToken: order.trackToken,
    type: order.type,
    typeLabel: orderTypeLabel(order.type),
    status: order.status,
    statusLabel: status?.label || order.status,
    statusTone: status?.tone || 'muted',
    statusTimestamps: order.statusTimestamps || {},
    progressSteps: pipe.map((s) => ({ id: s.id, label: s.label })),
    deviceLabel: [device?.brand, device?.model].filter(Boolean).join(' ') || 'Устройство',
    issue: order.issue || '',
    appearance: order.appearance || '',
    kit: order.kit || '',
    promisedAt: order.promisedAt || null,
    priceFrom,
    priceFinal,
    cost: priceFinal ?? (itemsTotal > 0 ? itemsTotal : null) ?? priceFrom,
    lineItems,
    paymentBadge,
    clientMessage: order.clientMessage || '',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    issuedAt: order.issuedAt || null,
    readyAt: order.readyAt || null,
    events,
    documents: {
      receipt: true,
      act: Boolean(order.completionAct),
      warranty: order.warranty || null,
    },
    warranty: order.warranty || null,
    // ПДн: на публичном трекере не отдаём ФИО / телефон / IMEI в UI.
    // В PDF квитанции имя клиента допустимо (юридический документ приёмки).
    print: {
      clientName: device?.clientName || '',
      clientPhone: '',
      reason: order.issue || '',
      device: [device?.brand, device?.model].filter(Boolean).join(' ') || '',
      appearance: order.appearance || '',
      kit: order.kit || '',
      estimatedReadyAt: order.promisedAt || null,
      cost: priceFinal ?? priceFrom,
      priceFinal,
      priceFrom,
      lineItems: order.lineItems || [],
      workDone: order.workDone || '',
      prepayment: order.prepayment ?? 0,
      workPerformed: order.workDone || '',
      recommendations: order.recommendations || order.handoverNote || '',
      managerName: order.managerName || 'Мастер',
      internalNote: '',
      warrantyDays: order.warranty?.days ?? null,
      warrantyUntil: order.warranty?.until ?? null,
      completionAct: order.completionAct || null,
      createdAt: order.createdAt,
      issuedAt: order.issuedAt || null,
      orderNumber: order.orderNumber || String(order.number),
      trackToken: order.trackToken,
    },
    // Явно не включаем: clientPhone, imei, clientName на верхнем уровне ответа
    company: company
      ? {
          name: company.name,
          phone: company.phone,
          phoneHref: company.phoneHref,
          address: company.address,
          city: company.city,
          schedule: company.schedule || '',
          whatsapp: company.whatsapp,
          tagline: company.tagline,
        }
      : null,
  }
}
