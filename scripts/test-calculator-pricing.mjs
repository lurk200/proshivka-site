/**
 * Живая проверка калькулятора vs poiskzip.
 * node scripts/test-calculator-pricing.mjs
 */
import { buildClientPrice, normalizeCalculator, DEFAULT_CALCULATOR } from '../src/calculator/defaults.js'

const BASE = process.env.CALC_BASE || 'http://127.0.0.1:5174'
const calc = normalizeCalculator(DEFAULT_CALCULATOR)

function roundRub(n) {
  return Math.ceil(n / (calc.roundTo || 50)) * (calc.roundTo || 50)
}

function expectPrice(part, install) {
  return roundRub(part * (1 + calc.markupPercent / 100) + install)
}

async function fetchPoiskzipMeta(query) {
  const params = new URLSearchParams({ search: query, page: '1', city_id: '76' })
  params.append('supplier', '129')
  params.append('supplier', '447')
  const html = await (
    await fetch(`https://poiskzip.ru/search?${params}`, {
      headers: { 'Accept-Language': 'ru', 'User-Agent': 'ProshivkaCalcTest/1.0' },
    })
  ).text()
  const m = html.match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i)
  if (!m) throw new Error('no NUXT payload')
  const data = JSON.parse(m[1])
  function resolve(idx, seen = new Set()) {
    if (typeof idx !== 'number') return idx
    if (seen.has(idx) || idx < 0 || idx >= data.length) return null
    seen.add(idx)
    const v = data[idx]
    if (v === null || typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number') return v
    if (Array.isArray(v)) {
      if (v.length === 2 && typeof v[0] === 'string' && typeof v[1] === 'number') return resolve(v[1], seen)
      return v.map((x) => (typeof x === 'number' ? resolve(x, new Set(seen)) : x))
    }
    if (typeof v === 'object') {
      const o = {}
      for (const [k, val] of Object.entries(v)) o[k] = typeof val === 'number' ? resolve(val, new Set(seen)) : val
      return o
    }
    return v
  }
  const dataMap = resolve(data[1].data)
  const searchKey = Object.keys(dataMap || {}).find((k) => k.startsWith('search-'))
  const search = dataMap[searchKey]
  const install = Number(search?.stats?.installation_cost)
  const prices = []
  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    if (!('price' in item) || !('name' in item) || !('shop' in item) || !('slug' in item)) continue
    const p = resolve(i)
    if (!p || typeof p.name !== 'string') continue
    if (p.shop?.name !== 'TAGGSM' && p.shop?.name !== 'Liberti') continue
    if (/установка\s*\/\s*замена/i.test(p.name)) continue
    const price = Number(p.price)
    if (Number.isFinite(price) && price > 0) prices.push(price)
  }
  return {
    installationCost: Number.isFinite(install) && install > 0 ? install : null,
    partPrices: [...new Set(prices)].sort((a, b) => a - b),
  }
}

let failed = 0

// Unit: A54 must not use min floor / subtract cheapest
{
  console.log('=== unit A54 ===')
  const got = buildClientPrice(900, { labor: 3000, minRepairPrice: 4500 }, calc, {
    installationCost: 2785,
  })
  const exp = expectPrice(900, 2785)
  if (got === 4500) {
    console.error('FAIL floored to 4500')
    failed++
  } else if (got !== exp) {
    console.error(`FAIL got ${got} exp ${exp}`)
    failed++
  } else {
    console.log(`OK 900 + install 2785 +${calc.markupPercent}% → ${got}`)
  }

  // old wrong formula would be 900*1.15 + (2785-900) = 2920 → floor 4500
  if (got === 4500 || got === roundRub(900 * 1.15 + (2785 - 900))) {
    console.error('FAIL still using install-cheapest formula')
    failed++
  }
}

const CASES = ['Samsung A54 дисплей', 'iPhone 13 АКБ', 'iPhone 13 дисплей']

for (const q of CASES) {
  console.log(`\n=== ${q} ===`)
  const [api, pz] = await Promise.all([
    fetch(`${BASE}/api/public/calculator/search?q=${encodeURIComponent(q)}`).then((r) => r.json()),
    fetchPoiskzipMeta(q),
  ])
  console.log(`install api=${api.installationCost} pz=${pz.installationCost}`)
  if (api.installationCost !== pz.installationCost) {
    console.error('FAIL install mismatch')
    failed++
  }

  const expectedSet = new Map()
  for (const part of pz.partPrices) {
    expectedSet.set(expectPrice(part, api.installationCost), part)
  }

  for (const item of api.items || []) {
    const part = expectedSet.get(item.repairPrice)
    if (part != null) {
      console.log(`OK ${item.repairPrice} ← part ${part} | ${item.title}`)
    } else {
      // allow if reverse-solvable within rounding
      const implied = (item.repairPrice - api.installationCost) / (1 + calc.markupPercent / 100)
      const near = pz.partPrices.find((p) => Math.abs(expectPrice(p, api.installationCost) - item.repairPrice) < 1)
      if (near != null) {
        console.log(`OK ${item.repairPrice} ← part ${near} | ${item.title}`)
      } else {
        console.error(
          `FAIL ${item.repairPrice} (implied part≈${implied.toFixed(0)}) not in ${pz.partPrices.join(',')}`,
        )
        failed++
      }
    }
  }
}

console.log(failed ? `\nFAILED: ${failed}` : '\nALL PASSED')
process.exit(failed ? 1 : 0)
