import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeCalculator } from '../src/calculator/defaults.js'
import { DEFAULT_SITE, normalizeWorks } from '../src/data/defaults.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CMS_DIR = path.join(ROOT, 'server', 'cms')
const CMS_FILE = path.join(CMS_DIR, 'content.json')
const UPLOADS_DIR = path.join(CMS_DIR, 'uploads')

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || 'admin'
}

function ensureDirs() {
  if (!fs.existsSync(CMS_DIR)) fs.mkdirSync(CMS_DIR, { recursive: true })
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  if (!fs.existsSync(CMS_FILE)) {
    fs.writeFileSync(CMS_FILE, JSON.stringify(DEFAULT_SITE, null, 2), 'utf8')
  }
}

function readCms() {
  ensureDirs()
  try {
    const raw = JSON.parse(fs.readFileSync(CMS_FILE, 'utf8'))
    return {
      ...DEFAULT_SITE,
      ...raw,
      company: { ...DEFAULT_SITE.company, ...raw.company },
      hero: { ...DEFAULT_SITE.hero, ...raw.hero },
      calculator: normalizeCalculator(raw.calculator || DEFAULT_SITE.calculator),
      services: Array.isArray(raw.services) && raw.services.length ? raw.services : DEFAULT_SITE.services,
      works: normalizeWorks(raw.works),
      trust: Array.isArray(raw.trust) && raw.trust.length ? raw.trust : DEFAULT_SITE.trust,
    }
  } catch {
    return structuredClone(DEFAULT_SITE)
  }
}

function writeCms(content) {
  ensureDirs()
  // Явно UTF-8 без BOM — иначе кириллица легко ломается внешними скриптами
  fs.writeFileSync(CMS_FILE, `${JSON.stringify(content, null, 2)}\n`, {
    encoding: 'utf8',
  })
}

function readBody(req, limit = 12 * 1024 * 1024) {
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

function isAuthed(req) {
  const header = req.headers['x-admin-token'] || ''
  const expected = Buffer.from(adminPassword()).toString('base64')
  return header === expected
}

function safeUploadName(name) {
  return String(name || 'photo')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

function serveUpload(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false
  if (!url.pathname.startsWith('/uploads/')) return false

  ensureDirs()
  const rel = decodeURIComponent(url.pathname.slice('/uploads/'.length))
  if (!rel || rel.includes('..') || path.isAbsolute(rel)) {
    sendJson(res, 400, { error: 'Bad path' })
    return true
  }

  const filePath = path.join(UPLOADS_DIR, rel)
  if (!filePath.startsWith(UPLOADS_DIR) || !fs.existsSync(filePath)) {
    res.statusCode = 404
    res.end('Not found')
    return true
  }

  const ext = path.extname(filePath).toLowerCase()
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  }
  res.statusCode = 200
  res.setHeader('Content-Type', types[ext] || 'application/octet-stream')
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  if (req.method === 'HEAD') {
    res.end()
    return true
  }
  fs.createReadStream(filePath).pipe(res)
  return true
}

async function handleUpload(req, res) {
  if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' })
  try {
    const body = await readBody(req)
    const dataUrl = body?.dataUrl || body?.data
    if (!dataUrl || typeof dataUrl !== 'string') {
      return sendJson(res, 400, { error: 'dataUrl required' })
    }

    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (!match) return sendJson(res, 400, { error: 'Ожидается data URL изображения' })

    const mime = match[1].toLowerCase()
    const ext = MIME_EXT[mime]
    if (!ext) return sendJson(res, 400, { error: 'Поддерживаются JPG, PNG, WebP, GIF' })

    const buffer = Buffer.from(match[2], 'base64')
    if (buffer.length > 8 * 1024 * 1024) {
      return sendJson(res, 400, { error: 'Файл слишком большой (макс. 8 МБ)' })
    }

    ensureDirs()
    // Уникальное имя: Date.now() одного мс мало при пакетной загрузке нескольких фото
    const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const base = safeUploadName(body?.name || 'photo').replace(/\.[a-z0-9]+$/, '')
    const filename = `${stamp}-${base || 'photo'}.${ext}`
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer)

    return sendJson(res, 200, {
      ok: true,
      url: `/uploads/${filename}`,
      filename,
    })
  } catch (e) {
    return sendJson(res, 400, { error: e.message || 'Ошибка загрузки' })
  }
}

function attachMiddleware(middlewares) {
  middlewares.use(async (req, res, next) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1')

    if (serveUpload(req, res, url)) return

    if (req.method === 'GET' && url.pathname === '/api/cms') {
      return sendJson(res, 200, { content: readCms(), persisted: fs.existsSync(CMS_FILE) })
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/login') {
      try {
        const body = await readBody(req)
        if (body?.password === adminPassword()) {
          return sendJson(res, 200, {
            ok: true,
            token: Buffer.from(adminPassword()).toString('base64'),
          })
        }
        return sendJson(res, 401, { ok: false, error: 'Неверный пароль' })
      } catch {
        return sendJson(res, 400, { ok: false, error: 'Bad request' })
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/upload') {
      return handleUpload(req, res)
    }

    if (url.pathname === '/api/admin/cms') {
      if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' })

      if (req.method === 'GET') {
        return sendJson(res, 200, { content: readCms() })
      }

      if (req.method === 'PUT') {
        try {
          const body = await readBody(req)
          if (!body?.content) return sendJson(res, 400, { error: 'content required' })
          const next = {
            ...body.content,
            works: normalizeWorks(body.content.works),
          }
          writeCms(next)
          return sendJson(res, 200, { ok: true, content: readCms() })
        } catch {
          return sendJson(res, 400, { error: 'Bad request' })
        }
      }
    }

    next()
  })
}

export function cmsApiPlugin() {
  return {
    name: 'proshivka-cms-api',
    configureServer(server) {
      attachMiddleware(server.middlewares)
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares)
    },
  }
}
