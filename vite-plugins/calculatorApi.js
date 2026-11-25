import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_SITE } from '../src/data/defaults.js'
import { DEFAULT_CALCULATOR, normalizeCalculator } from '../src/calculator/defaults.js'
import { fetchQuickSuggestions, searchRepairQuotes } from './poiskzipClient.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CMS_FILE = path.join(ROOT, 'server', 'cms', 'content.json')

function adminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || 'admin'
}

function isAuthed(req) {
  const header = req.headers['x-admin-token'] || ''
  const expected = Buffer.from(adminPassword()).toString('base64')
  return header === expected
}

function readCmsRaw() {
  try {
    if (!fs.existsSync(CMS_FILE)) return structuredClone(DEFAULT_SITE)
    return {
      ...DEFAULT_SITE,
      ...JSON.parse(fs.readFileSync(CMS_FILE, 'utf8')),
    }
  } catch {
    return structuredClone(DEFAULT_SITE)
  }
}

function readCalculator() {
  const cms = readCmsRaw()
  return normalizeCalculator(cms.calculator || DEFAULT_CALCULATOR)
}

function writeCalculator(next) {
  const dir = path.dirname(CMS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const cms = readCmsRaw()
  cms.calculator = normalizeCalculator(next)
  fs.writeFileSync(CMS_FILE, JSON.stringify(cms, null, 2), 'utf8')
  return cms.calculator
}

function readBody(req, limit = 256 * 1024) {
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
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(data))
}

function attachMiddleware(middlewares) {
  middlewares.use(async (req, res, next) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const { pathname } = url

    try {
      if (req.method === 'GET' && pathname === '/api/public/calculator') {
        const calc = readCalculator()
        return sendJson(res, 200, {
          enabled: calc.enabled,
          suggestions: calc.suggestions,
        })
      }

      if (req.method === 'GET' && pathname === '/api/public/calculator/suggest') {
        const q = url.searchParams.get('q') || ''
        const suggestions = await fetchQuickSuggestions(q)
        return sendJson(res, 200, { suggestions })
      }

      if (req.method === 'GET' && pathname === '/api/public/calculator/search') {
        const calc = readCalculator()
        if (!calc.enabled) {
          return sendJson(res, 200, { query: '', items: [], disabled: true })
        }
        const q = url.searchParams.get('q') || ''
        const result = await searchRepairQuotes(q, calc)
        return sendJson(res, 200, result)
      }

      if (pathname === '/api/admin/calculator') {
        if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' })

        if (req.method === 'GET') {
          return sendJson(res, 200, { calculator: readCalculator() })
        }

        if (req.method === 'PUT') {
          const body = await readBody(req)
          if (!body?.calculator) return sendJson(res, 400, { error: 'calculator required' })
          const calculator = writeCalculator(body.calculator)
          return sendJson(res, 200, { ok: true, calculator })
        }
      }
    } catch (e) {
      const msg = e?.name === 'AbortError' ? 'Поставщик не ответил вовремя' : e.message || 'Ошибка'
      return sendJson(res, 502, { error: msg, items: [] })
    }

    next()
  })
}

export function calculatorApiPlugin() {
  return {
    name: 'proshivka-calculator-api',
    configureServer(server) {
      attachMiddleware(server.middlewares)
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares)
    },
  }
}
