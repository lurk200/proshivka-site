import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_STATUS_PIPELINES,
  addDaysIso,
  canIssueOrder,
  emptyCrmData,
  firstStatusId,
  getStatusMeta,
  isIssueStatus,
  lineItemsTotal,
  makeId,
  makeOrderNumber,
  makeTrackToken,
  normalizeLineItems,
  normalizePhone,
  publicTrackPayload,
  workDoneFromLineItems,
} from '../src/crm/defaults.js'
import { DEFAULT_SITE } from '../src/data/defaults.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CRM_DIR = path.join(ROOT, 'server', 'crm')
const CRM_FILE = path.join(CRM_DIR, 'data.json')
const CMS_FILE = path.join(ROOT, 'server', 'cms', 'content.json')

function adminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || 'admin'
}

function isAuthed(req) {
  const header = req.headers['x-admin-token'] || ''
  const expected = Buffer.from(adminPassword()).toString('base64')
  return header === expected
}

function ensureCrm() {
  if (!fs.existsSync(CRM_DIR)) fs.mkdirSync(CRM_DIR, { recursive: true })
  if (!fs.existsSync(CRM_FILE)) {
    fs.writeFileSync(CRM_FILE, JSON.stringify(emptyCrmData(), null, 2), 'utf8')
  }
}

function readCrm() {
  ensureCrm()
  try {
    const raw = JSON.parse(fs.readFileSync(CRM_FILE, 'utf8'))
    const base = emptyCrmData()
    return {
      ...base,
      ...raw,
      // Пайплайны — из кода (как в v1), пока нет UI настроек статусов
      pipelines: structuredClone(DEFAULT_STATUS_PIPELINES),
      devices: Array.isArray(raw.devices) ? raw.devices : [],
      orders: (Array.isArray(raw.orders) ? raw.orders : []).map((o) =>
        o.status === 'issued' || o.status === 'closed'
          ? { ...o, status: 'completed' }
          : o,
      ),
      nextDeviceNum: Number(raw.nextDeviceNum) || 1,
      nextOrderNum: Number(raw.nextOrderNum) || 1,
    }
  } catch {
    return emptyCrmData()
  }
}

function writeCrm(data) {
  ensureCrm()
  fs.writeFileSync(CRM_FILE, JSON.stringify(data, null, 2), 'utf8')
}

function readCompany() {
  try {
    if (!fs.existsSync(CMS_FILE)) return DEFAULT_SITE.company
    const raw = JSON.parse(fs.readFileSync(CMS_FILE, 'utf8'))
    return { ...DEFAULT_SITE.company, ...(raw.company || {}) }
  } catch {
    return DEFAULT_SITE.company
  }
}

function readBody(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        reject(new Error('Payload too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8')
      if (!text) return resolve(null)
      try {
        resolve(JSON.parse(text))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

function pushEvent(order, event) {
  order.events = order.events || []
  order.events.push({
    id: makeId('ev'),
    at: new Date().toISOString(),
    public: true,
    ...event,
  })
}

function findDeviceMatches(data, q) {
  const query = String(q || '').trim().toLowerCase()
  if (!query) return []
  const digits = normalizePhone(query)
  return data.devices.filter((d) => {
    const hay = [
      d.brand,
      d.model,
      d.imei,
      d.serial,
      d.clientName,
      d.clientPhone,
      normalizePhone(d.clientPhone),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (hay.includes(query)) return true
    if (digits && normalizePhone(d.clientPhone).includes(digits)) return true
    if (digits && String(d.imei || '').includes(digits)) return true
    return false
  })
}

function findOrderByTrack(data, tokenOrNumber) {
  const key = String(tokenOrNumber || '').trim()
  if (!key) return null
  return (
    data.orders.find((o) => o.trackToken === key) ||
    data.orders.find((o) => String(o.orderNumber) === key) ||
    data.orders.find((o) => String(o.number) === key) ||
    null
  )
}

function createOrder(data, body) {
  const now = new Date().toISOString()
  const type = body.type || 'regular'
  let device = null

  if (body.deviceId) {
    device = data.devices.find((d) => d.id === body.deviceId)
    if (!device) throw new Error('Устройство не найдено')
  } else {
    device = {
      id: makeId('dev'),
      number: data.nextDeviceNum++,
      brand: String(body.brand || '').trim() || '—',
      model: String(body.model || '').trim() || 'Устройство',
      imei: String(body.imei || '').trim(),
      serial: String(body.serial || '').trim(),
      clientName: String(body.clientName || '').trim() || 'Клиент',
      clientPhone: String(body.clientPhone || '').trim(),
      createdAt: now,
      updatedAt: now,
    }
    data.devices.unshift(device)
  }

  if (body.clientName) device.clientName = String(body.clientName).trim()
  if (body.clientPhone) device.clientPhone = String(body.clientPhone).trim()
  if (body.brand) device.brand = String(body.brand).trim()
  if (body.model) device.model = String(body.model).trim()
  if (body.imei != null) device.imei = String(body.imei).trim()
  if (body.serial != null) device.serial = String(body.serial).trim()
  device.updatedAt = now

  const status = firstStatusId(data, type)
  const orderNumber = makeOrderNumber(data)
  const order = {
    id: makeId('ord'),
    number: data.nextOrderNum++,
    orderNumber,
    deviceId: device.id,
    type,
    status,
    issue: String(body.issue || '').trim(),
    appearance: String(body.appearance || '').trim(),
    kit: String(body.kit || '').trim(),
    managerName: String(body.managerName || 'Мастер').trim(),
    promisedAt: body.promisedAt || null,
    priceFrom: body.priceFrom != null && body.priceFrom !== '' ? Number(body.priceFrom) : null,
    priceFinal: body.priceFinal != null && body.priceFinal !== '' ? Number(body.priceFinal) : null,
    prepayment: body.prepayment != null && body.prepayment !== '' ? Number(body.prepayment) : 0,
    workDone: '',
    lineItems: [],
    recommendations: '',
    clientMessage: String(body.clientMessage || '').trim(),
    handoverNote: '',
    handoverAck: false,
    handoverAckAt: null,
    warrantyDays: null,
    warranty: null,
    completionAct: null,
    readyAt: null,
    issuedAt: null,
    statusTimestamps: { [status]: now },
    trackToken: makeTrackToken(),
    createdAt: now,
    updatedAt: now,
    events: [],
  }

  const statusLabel = getStatusMeta(data, type, status)?.label || status
  pushEvent(order, {
    kind: 'created',
    text: `Заказ ${orderNumber} принят`,
    publicText: 'Устройство принято в сервис',
  })
  pushEvent(order, {
    kind: 'status',
    text: `Статус: ${statusLabel}`,
    publicText: `Статус: ${statusLabel}`,
    status,
  })

  data.orders.unshift(order)
  return { order, device }
}

function applyIssueDocuments(order, body, now) {
  const days =
    body.warrantyDays !== undefined
      ? Number(body.warrantyDays) || 0
      : Number(order.warrantyDays) || 0
  order.warrantyDays = days
  order.issuedAt = now
  order.completionAct = {
    number: `АВР-${order.orderNumber || order.number}`,
    issuedAt: now,
  }
  if (days > 0) {
    order.warranty = { days, from: now, until: addDaysIso(now, days) }
  } else {
    order.warranty = null
  }
}

function clearIssueDocuments(order) {
  order.completionAct = null
  order.warranty = null
  order.issuedAt = null
}

function patchOrder(data, orderId, body) {
  const order = data.orders.find((o) => o.id === orderId)
  if (!order) throw new Error('Заказ не найден')
  const now = new Date().toISOString()

  const fields = [
    'issue',
    'promisedAt',
    'workDone',
    'handoverNote',
    'appearance',
    'kit',
    'managerName',
    'recommendations',
    'clientMessage',
  ]
  for (const key of fields) {
    if (body[key] !== undefined) order[key] = body[key]
  }

  if (body.lineItems !== undefined) {
    const items = normalizeLineItems(body.lineItems, order)
    order.lineItems = items
    order.workDone = workDoneFromLineItems(items)
    if (body.priceFinal === undefined) {
      const total = lineItemsTotal(items)
      order.priceFinal = total > 0 ? total : null
    }
  }

  if (body.priceFrom !== undefined) {
    order.priceFrom = body.priceFrom === '' || body.priceFrom == null ? null : Number(body.priceFrom)
  }
  if (body.priceFinal !== undefined) {
    order.priceFinal =
      body.priceFinal === '' || body.priceFinal == null ? null : Number(body.priceFinal)
  }
  if (body.prepayment !== undefined) {
    order.prepayment =
      body.prepayment === '' || body.prepayment == null ? 0 : Number(body.prepayment)
  }
  if (body.warrantyDays !== undefined) {
    order.warrantyDays = Number(body.warrantyDays) || 0
    if (order.completionAct && order.issuedAt) {
      const days = order.warrantyDays
      order.warranty =
        days > 0 ? { days, from: order.issuedAt, until: addDaysIso(order.issuedAt, days) } : null
    }
  }

  if (body.handoverAck !== undefined) {
    const ack = Boolean(body.handoverAck)
    if (ack && !order.handoverAck) {
      order.handoverAck = true
      order.handoverAckAt = now
      pushEvent(order, {
        kind: 'handover_ack',
        text: 'Заметка к выдаче прочитана',
        public: false,
      })
    } else if (!ack) {
      order.handoverAck = false
      order.handoverAckAt = null
    }
  }

  if (body.status != null && body.status !== order.status) {
    const next = String(body.status)
    const wasIssue = isIssueStatus(data, order.type, order.status)
    const willIssue = isIssueStatus(data, order.type, next)

    if (willIssue) {
      if (!canIssueOrder(order)) {
        throw new Error('Для выдачи добавьте хотя бы одну позицию в акт')
      }
    }

    order.status = next
    order.statusTimestamps = { ...(order.statusTimestamps || {}), [next]: now }

    if (next === 'ready' && !order.readyAt) order.readyAt = now

    if (willIssue) {
      applyIssueDocuments(order, body, now)
      pushEvent(order, {
        kind: 'act',
        text: `Оформлен акт ${order.completionAct.number}`,
        publicText: 'Оформлен акт выполненных работ',
      })
    } else if (wasIssue && !willIssue) {
      clearIssueDocuments(order)
    }

    if (next === 'cancelled') {
      clearIssueDocuments(order)
    }

    const label = getStatusMeta(data, order.type, next)?.label || next
    pushEvent(order, {
      kind: 'status',
      text: `Статус: ${label}`,
      publicText: `Статус: ${label}`,
      status: next,
    })
  }

  order.updatedAt = now
  const device = data.devices.find((d) => d.id === order.deviceId)
  return { order, device }
}

function attachMiddleware(middlewares) {
  middlewares.use(async (req, res, next) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const { pathname } = url

    try {
      if (req.method === 'GET' && pathname === '/api/crm') {
        if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' })
        return sendJson(res, 200, { data: readCrm() })
      }

      if (req.method === 'GET' && pathname === '/api/crm/devices/search') {
        if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' })
        const data = readCrm()
        const devices = findDeviceMatches(data, url.searchParams.get('q'))
        const withOrders = devices.map((device) => ({
          device,
          orders: data.orders.filter((o) => o.deviceId === device.id),
        }))
        return sendJson(res, 200, { results: withOrders })
      }

      if (req.method === 'POST' && pathname === '/api/crm/orders') {
        if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' })
        const body = await readBody(req)
        const data = readCrm()
        const result = createOrder(data, body || {})
        writeCrm(data)
        return sendJson(res, 200, { ok: true, ...result, data })
      }

      const orderMatch = pathname.match(/^\/api\/crm\/orders\/([^/]+)$/)
      if (orderMatch) {
        if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' })
        const orderId = decodeURIComponent(orderMatch[1])

        if (req.method === 'GET') {
          const data = readCrm()
          const order = data.orders.find((o) => o.id === orderId)
          if (!order) return sendJson(res, 404, { error: 'Не найдено' })
          const device = data.devices.find((d) => d.id === order.deviceId)
          const siblingOrders = data.orders.filter((o) => o.deviceId === order.deviceId)
          return sendJson(res, 200, { order, device, siblingOrders, data })
        }

        if (req.method === 'PATCH') {
          const body = await readBody(req)
          const data = readCrm()
          const result = patchOrder(data, orderId, body || {})
          writeCrm(data)
          return sendJson(res, 200, { ok: true, ...result, data })
        }
      }

      const deviceMatch = pathname.match(/^\/api\/crm\/devices\/([^/]+)$/)
      if (req.method === 'GET' && deviceMatch) {
        if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' })
        const deviceId = decodeURIComponent(deviceMatch[1])
        const data = readCrm()
        const device = data.devices.find((d) => d.id === deviceId)
        if (!device) return sendJson(res, 404, { error: 'Не найдено' })
        const orders = data.orders.filter((o) => o.deviceId === deviceId)
        return sendJson(res, 200, { device, orders, data })
      }

      if (req.method === 'GET' && pathname === '/api/public/track') {
        const key = url.searchParams.get('number') || url.searchParams.get('token') || ''
        const data = readCrm()
        const order = findOrderByTrack(data, key)
        if (!order) return sendJson(res, 404, { error: 'Заказ не найден' })
        const device = data.devices.find((d) => d.id === order.deviceId)
        return sendJson(res, 200, {
          track: publicTrackPayload(data, order, device, readCompany()),
        })
      }

      const trackMatch = pathname.match(/^\/api\/public\/track\/([^/]+)$/)
      if (req.method === 'GET' && trackMatch) {
        const token = decodeURIComponent(trackMatch[1])
        const data = readCrm()
        const order = findOrderByTrack(data, token)
        if (!order) return sendJson(res, 404, { error: 'Заказ не найден' })
        const device = data.devices.find((d) => d.id === order.deviceId)
        return sendJson(res, 200, {
          track: publicTrackPayload(data, order, device, readCompany()),
        })
      }
    } catch (e) {
      return sendJson(res, 400, { error: e.message || 'Bad request' })
    }

    next()
  })
}

export function crmApiPlugin() {
  return {
    name: 'proshivka-crm-api',
    configureServer(server) {
      attachMiddleware(server.middlewares)
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares)
    },
  }
}
