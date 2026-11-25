/**
 * Клиент поиска poiskzip.ru: Ставрополь + TAGGSM / Liberti.
 * Парсит SSR __NUXT_DATA__ (публичного JSON API с нужными фильтрами нет).
 */
import {
  DEFAULT_CALCULATOR,
  POISKZIP,
  buildClientPrice,
  matchCategory,
  normalizeCalculator,
  publicPartTitle,
} from '../src/calculator/defaults.js'
import { extractQualityKey, resolveQualityGuide } from '../src/calculator/qualityGuide.js'

const SEARCH_TIMEOUT_MS = 18000
const USER_AGENT =
  'Mozilla/5.0 (compatible; ProshivkaCalc/1.0; +https://localhost; repair-price-estimator)'

function resolveNuxt(data, idx, seen = new Set()) {
  if (typeof idx !== 'number') return idx
  if (seen.has(idx)) return null
  if (idx < 0 || idx >= data.length) return idx
  seen.add(idx)
  const v = data[idx]
  if (v === null || typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number') {
    return v
  }
  if (Array.isArray(v)) {
    if (v.length === 2 && typeof v[0] === 'string' && typeof v[1] === 'number') {
      return resolveNuxt(data, v[1], seen)
    }
    return v.map((item) => (typeof item === 'number' ? resolveNuxt(data, item, new Set(seen)) : item))
  }
  if (typeof v === 'object') {
    const out = {}
    for (const [k, val] of Object.entries(v)) {
      out[k] = typeof val === 'number' ? resolveNuxt(data, val, new Set(seen)) : val
    }
    return out
  }
  return v
}

function extractNuxtPayload(html) {
  const match = String(html || '').match(
    /<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i,
  )
  if (!match) return null
  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

function extractProducts(payload) {
  if (!Array.isArray(payload)) return []
  const allowed = new Set([
    POISKZIP.primarySupplierName.toLowerCase(),
    POISKZIP.backupSupplierName.toLowerCase(),
  ])
  const out = []
  for (let i = 0; i < payload.length; i++) {
    const item = payload[i]
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    if (!('price' in item) || !('name' in item) || !('shop' in item) || !('slug' in item)) continue
    const p = resolveNuxt(payload, i)
    if (!p || typeof p.name !== 'string') continue
    const shopName = p.shop?.name
    if (!shopName || !allowed.has(String(shopName).toLowerCase())) continue
    // Позиции сервисов «Установка/Замена» — это уже готовый ремонт, не закупка
    if (/установка\s*\/\s*замена/i.test(p.name)) continue
    const price = Number(p.price)
    if (!Number.isFinite(price) || price <= 0) continue
    const wholesale = Number(p.wholesale_price)
    const partCost = Number.isFinite(wholesale) && wholesale > 0 ? wholesale : price
    out.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      partCost,
      inStock: Boolean(p.in_stock),
      shopName: String(shopName),
      shopId: Number(p.shop?.id) || null,
      office: p.stocks?.[0]?.office?.name || null,
    })
  }
  return out
}

/** Баннер «Установка в Ставрополе ≈ N ₽» из search.stats.installation_cost */
function extractSearchMeta(payload) {
  const empty = { installationCost: null, cheapestPartCost: null }
  if (!Array.isArray(payload) || !payload[1] || typeof payload[1].data !== 'number') return empty
  try {
    const dataMap = resolveNuxt(payload, payload[1].data)
    if (!dataMap || typeof dataMap !== 'object') return empty
    const searchKey = Object.keys(dataMap).find((k) => k.startsWith('search-'))
    if (!searchKey) return empty
    const search = dataMap[searchKey]
    const install = Number(search?.stats?.installation_cost)
    const cheapest = Number(search?.cheapest_product?.price)
    return {
      installationCost: Number.isFinite(install) && install > 0 ? install : null,
      cheapestPartCost: Number.isFinite(cheapest) && cheapest > 0 ? cheapest : null,
    }
  } catch {
    return empty
  }
}

function extractInstallCostFromHtml(html) {
  const m = String(html || '').match(
    /search-recommended-service-centers-banner__price[^>]*>\s*([^<]+)/i,
  )
  if (!m) return null
  const n = Number(String(m[1]).replace(/[^\d]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

function buildSearchUrl(query, { cityId = true } = {}) {
  const params = new URLSearchParams()
  params.set('search', query)
  params.set('page', '1')
  if (cityId) params.set('city_id', String(POISKZIP.cityId))
  params.append('supplier', String(POISKZIP.primarySupplierId))
  params.append('supplier', String(POISKZIP.backupSupplierId))
  return `https://poiskzip.ru/search?${params.toString()}`
}

async function fetchSearchHtml(query, options = {}) {
  const url = buildSearchUrl(query, options)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), SEARCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': USER_AGENT,
        'Accept-Language': 'ru-RU,ru;q=0.9',
      },
    })
    if (!res.ok) throw new Error(`poiskzip HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

function supplierRank(shopName) {
  const n = String(shopName || '').toLowerCase()
  if (n === POISKZIP.primarySupplierName.toLowerCase()) return 0
  if (n === POISKZIP.backupSupplierName.toLowerCase()) return 1
  return 9
}

function sortParts(parts) {
  return [...parts].sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1
    const sr = supplierRank(a.shopName) - supplierRank(b.shopName)
    if (sr) return sr
    return a.partCost - b.partCost
  })
}

/** Убрать почти дубли по названию, оставить лучший по приоритету. */
function dedupeParts(parts) {
  const map = new Map()
  for (const p of sortParts(parts)) {
    const key = String(p.name || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
    if (!key) continue
    if (!map.has(key)) map.set(key, p)
  }
  return [...map.values()]
}

function toClientItem(part, calculator, priceCtx, { forceOnOrder = false } = {}) {
  const onOrder = forceOnOrder || !part.inStock
  const category = matchCategory(calculator, part.name)
  const repairPrice = buildClientPrice(part.partCost, category, calculator, {
    onOrder,
    installationCost: priceCtx?.installationCost ?? null,
  })
  const title = publicPartTitle(part.name)
  // Сначала публичный title (сегмент после ·) — чище, чем сырое имя с «для …»
  const qualityKey = extractQualityKey(title) || extractQualityKey(part.name)
  const guide = resolveQualityGuide(qualityKey, { title, name: part.name })
  return {
    id: String(part.id || part.slug || `${part.shopId}-${part.name}`),
    title,
    repairPrice,
    term: onOrder ? category.termOnOrder : category.termInStock,
    warrantyDays: category.warrantyDays,
    availability: onOrder ? 'on_order' : 'in_stock',
    availabilityLabel: onOrder ? 'Под заказ' : 'В наличии',
    deliveryIncluded: onOrder && Number(calculator.deliveryFee) > 0,
    qualityLabel: guide?.label || null,
    qualityPoints: guide?.points || null,
  }
}

/**
 * @param {string} query
 * @param {object} [calculatorRaw]
 */
export async function searchRepairQuotes(query, calculatorRaw) {
  const q = String(query || '').trim()
  if (q.length < 2) {
    return { query: q, items: [], source: 'empty' }
  }
  if (q.length > 120) {
    return { query: q.slice(0, 120), items: [], error: 'Слишком длинный запрос' }
  }

  const calculator = normalizeCalculator(calculatorRaw || DEFAULT_CALCULATOR)

  let html = await fetchSearchHtml(q, { cityId: true })
  let payload = extractNuxtPayload(html)
  let parts = dedupeParts(extractProducts(payload))
  let meta = extractSearchMeta(payload)
  let forceOnOrder = false
  let source = 'local'

  if (!parts.length) {
    html = await fetchSearchHtml(q, { cityId: false })
    payload = extractNuxtPayload(html)
    parts = dedupeParts(extractProducts(payload))
    meta = extractSearchMeta(payload)
    forceOnOrder = true
    source = 'order'
  }

  if (meta.installationCost == null) {
    const fromHtml = extractInstallCostFromHtml(html)
    if (fromHtml) meta = { ...meta, installationCost: fromHtml }
  }

  const priceCtx = {
    installationCost: meta.installationCost,
  }

  const items = sortParts(parts)
    .slice(0, 24)
    .map((p) => toClientItem(p, calculator, priceCtx, { forceOnOrder }))

  return {
    query: q,
    items,
    source,
    city: POISKZIP.cityName,
    installationCost: meta.installationCost,
  }
}

export async function fetchQuickSuggestions(query) {
  const q = String(query || '').trim()
  if (q.length < 2) return []
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const url = `https://poiskzip.ru/api/quick-search?query=${encodeURIComponent(q)}&count=6`
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data.map(String).filter(Boolean).slice(0, 6) : []
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}
