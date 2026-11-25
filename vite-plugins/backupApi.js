import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Lazy — чтобы vite.config мог загрузиться до наличия deps в node_modules. */
async function loadArchiver() {
  const { ZipArchive } = await import('archiver')
  return ZipArchive
}

async function loadExtractZip() {
  const mod = await import('extract-zip')
  return mod.default || mod
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CMS_DIR = path.join(ROOT, 'server', 'cms')
const CMS_FILE = path.join(CMS_DIR, 'content.json')
const UPLOADS_DIR = path.join(CMS_DIR, 'uploads')
const CRM_DIR = path.join(ROOT, 'server', 'crm')
const CRM_FILE = path.join(CRM_DIR, 'data.json')
const BACKUPS_DIR = path.join(ROOT, 'server', 'backups')

const MANIFEST_VERSION = 1
const MAX_RESTORE_BYTES = 300 * 1024 * 1024

function adminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || 'admin'
}

function isAuthed(req) {
  const header = req.headers['x-admin-token'] || ''
  const expected = Buffer.from(adminPassword()).toString('base64')
  return header === expected
}

function sendJson(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

function ensureDirs() {
  for (const dir of [CMS_DIR, UPLOADS_DIR, CRM_DIR, BACKUPS_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0
  let n = 0
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    try {
      if (fs.statSync(full).isFile()) n += 1
    } catch {
      /* skip */
    }
  }
  return n
}

function safeReadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

function buildManifest() {
  ensureDirs()
  const cms = safeReadJson(CMS_FILE, {})
  const crm = safeReadJson(CRM_FILE, {})
  const uploads = countFiles(UPLOADS_DIR)
  return {
    version: MANIFEST_VERSION,
    app: 'proshivka-site-v2',
    createdAt: new Date().toISOString(),
    counts: {
      works: Array.isArray(cms.works) ? cms.works.length : 0,
      services: Array.isArray(cms.services) ? cms.services.length : 0,
      orders: Array.isArray(crm.orders) ? crm.orders.length : 0,
      devices: Array.isArray(crm.devices) ? crm.devices.length : 0,
      uploads,
    },
  }
}

function rmDirSafe(dir) {
  if (!fs.existsSync(dir)) return
  fs.rmSync(dir, { recursive: true, force: true })
}

function copyFileSafe(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function copyDirContents(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  if (!fs.existsSync(src)) return
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name)
    const to = path.join(dest, name)
    const st = fs.statSync(from)
    if (st.isDirectory()) copyDirContents(from, to)
    else fs.copyFileSync(from, to)
  }
}

/** Страховочный снимок перед restore — чтобы кривой ZIP не стёр всё безвозвратно. */
function snapshotPreRestore() {
  ensureDirs()
  const dir = path.join(BACKUPS_DIR, `pre-restore-${stamp()}`)
  fs.mkdirSync(dir, { recursive: true })
  if (fs.existsSync(CMS_FILE)) copyFileSafe(CMS_FILE, path.join(dir, 'content.json'))
  if (fs.existsSync(CRM_FILE)) copyFileSafe(CRM_FILE, path.join(dir, 'data.json'))
  if (fs.existsSync(UPLOADS_DIR)) copyDirContents(UPLOADS_DIR, path.join(dir, 'uploads'))
  // Храним только последний pre-restore + текущий (не раздувать диск)
  pruneOldPreRestores(1)
  return dir
}

function pruneOldPreRestores(keep = 1) {
  if (!fs.existsSync(BACKUPS_DIR)) return
  const dirs = fs
    .readdirSync(BACKUPS_DIR)
    .filter((n) => n.startsWith('pre-restore-'))
    .map((n) => ({ name: n, full: path.join(BACKUPS_DIR, n) }))
    .sort((a, b) => b.name.localeCompare(a.name))
  for (const item of dirs.slice(keep + 1)) {
    rmDirSafe(item.full)
  }
}

async function handleExport(req, res) {
  if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' })
  ensureDirs()

  const manifest = buildManifest()
  const filename = `proshivka-backup-${stamp()}.zip`

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Cache-Control', 'no-store')

  const ZipArchive = await loadArchiver()
  const archive = new ZipArchive({ zlib: { level: 6 } })
  archive.on('error', (err) => {
    console.error('[backup] archive error', err)
    if (!res.headersSent) sendJson(res, 500, { error: err.message || 'Ошибка архива' })
    else res.destroy(err)
  })

  archive.pipe(res)
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' })

  if (fs.existsSync(CMS_FILE)) {
    archive.file(CMS_FILE, { name: 'cms/content.json' })
  } else {
    archive.append('{}\n', { name: 'cms/content.json' })
  }

  if (fs.existsSync(CRM_FILE)) {
    archive.file(CRM_FILE, { name: 'crm/data.json' })
  } else {
    archive.append(JSON.stringify({ orders: [], devices: [] }, null, 2), { name: 'crm/data.json' })
  }

  if (fs.existsSync(UPLOADS_DIR)) {
    archive.directory(UPLOADS_DIR, 'cms/uploads')
  }

  await archive.finalize()
}

function streamBodyToFile(req, dest, limit) {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(dest)
    let size = 0
    let failed = false

    const fail = (err) => {
      if (failed) return
      failed = true
      req.unpipe(ws)
      ws.destroy()
      fs.unlink(dest, () => {})
      reject(err instanceof Error ? err : new Error(String(err)))
    }

    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        fail(new Error(`Файл слишком большой (макс. ${Math.round(limit / (1024 * 1024))} МБ)`))
        try {
          req.destroy()
        } catch {
          /* ignore */
        }
      }
    })
    req.on('error', fail)
    ws.on('error', fail)
    ws.on('finish', () => {
      if (!failed) resolve(size)
    })
    req.pipe(ws)
  })
}

async function handleRestore(req, res) {
  if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' })
  ensureDirs()

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'proshivka-restore-'))
  const zipPath = path.join(tmpRoot, 'backup.zip')
  const extractDir = path.join(tmpRoot, 'extracted')

  try {
    const size = await streamBodyToFile(req, zipPath, MAX_RESTORE_BYTES)
    if (size < 32) throw new Error('Пустой или повреждённый ZIP')

    fs.mkdirSync(extractDir, { recursive: true })
    const extractZip = await loadExtractZip()
    await extractZip(zipPath, { dir: extractDir })

    const manifestPath = path.join(extractDir, 'manifest.json')
    const cmsPath = path.join(extractDir, 'cms', 'content.json')
    const crmPath = path.join(extractDir, 'crm', 'data.json')
    const uploadsSrc = path.join(extractDir, 'cms', 'uploads')

    if (!fs.existsSync(manifestPath)) throw new Error('В архиве нет manifest.json')
    if (!fs.existsSync(cmsPath)) throw new Error('В архиве нет cms/content.json')
    if (!fs.existsSync(crmPath)) throw new Error('В архиве нет crm/data.json')

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    if (Number(manifest.version) !== MANIFEST_VERSION) {
      throw new Error(`Неподдерживаемая версия бэкапа: ${manifest.version}`)
    }

    const cms = JSON.parse(fs.readFileSync(cmsPath, 'utf8'))
    const crm = JSON.parse(fs.readFileSync(crmPath, 'utf8'))
    if (!cms || typeof cms !== 'object') throw new Error('content.json повреждён')
    if (!crm || typeof crm !== 'object') throw new Error('data.json повреждён')

    const preRestore = snapshotPreRestore()

    // Атомарнее: пишем во временные файлы рядом, потом rename
    const cmsTmp = `${CMS_FILE}.restoring`
    const crmTmp = `${CRM_FILE}.restoring`
    fs.writeFileSync(cmsTmp, `${JSON.stringify(cms, null, 2)}\n`, 'utf8')
    fs.writeFileSync(crmTmp, `${JSON.stringify(crm, null, 2)}\n`, 'utf8')
    fs.renameSync(cmsTmp, CMS_FILE)
    fs.renameSync(crmTmp, CRM_FILE)

    const uploadsTmp = path.join(CMS_DIR, `uploads.restoring-${Date.now()}`)
    const uploadsBak = path.join(CMS_DIR, `uploads.bak-${Date.now()}`)
    fs.mkdirSync(uploadsTmp, { recursive: true })
    if (fs.existsSync(uploadsSrc)) copyDirContents(uploadsSrc, uploadsTmp)

    if (fs.existsSync(UPLOADS_DIR)) fs.renameSync(UPLOADS_DIR, uploadsBak)
    fs.renameSync(uploadsTmp, UPLOADS_DIR)
    rmDirSafe(uploadsBak)

    const resultManifest = buildManifest()
    return sendJson(res, 200, {
      ok: true,
      restoredFrom: manifest.createdAt || null,
      preRestore: path.basename(preRestore),
      counts: resultManifest.counts,
    })
  } catch (e) {
    return sendJson(res, 400, { ok: false, error: e.message || 'Ошибка восстановления' })
  } finally {
    rmDirSafe(tmpRoot)
  }
}

function attachMiddleware(middlewares) {
  middlewares.use(async (req, res, next) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1')

    if (req.method === 'GET' && url.pathname === '/api/admin/backup') {
      try {
        await handleExport(req, res)
      } catch (e) {
        if (!res.headersSent) sendJson(res, 500, { error: e.message || 'Ошибка бэкапа' })
      }
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/backup/info') {
      if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' })
      return sendJson(res, 200, { ok: true, manifest: buildManifest() })
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/restore') {
      return handleRestore(req, res)
    }

    next()
  })
}

export function backupApiPlugin() {
  return {
    name: 'proshivka-backup-api',
    configureServer(server) {
      attachMiddleware(server.middlewares)
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares)
    },
  }
}
