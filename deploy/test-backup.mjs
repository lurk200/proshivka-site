/** Smoke: login → backup info → download ZIP → restore same ZIP. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BASE = process.env.SITE_URL || 'https://proshivka.online'
const PASS = process.env.ADMIN_PASSWORD || 'Lolipop1199'
const OUT = path.join(ROOT, 'tmp-phone', `smoke-backup-${Date.now()}.zip`)

const login = await fetch(`${BASE}/api/admin/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: PASS }),
})
const { token, ok } = await login.json()
if (!ok) throw new Error('login failed')
console.log('login ok')

const infoRes = await fetch(`${BASE}/api/admin/backup/info`, {
  headers: { 'X-Admin-Token': token },
})
const info = await infoRes.json()
console.log('info', infoRes.status, info.manifest?.counts)

const dl = await fetch(`${BASE}/api/admin/backup`, {
  headers: { 'X-Admin-Token': token },
})
if (!dl.ok) throw new Error(`download ${dl.status}`)
const buf = Buffer.from(await dl.arrayBuffer())
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, buf)
console.log('downloaded', OUT, buf.length, 'bytes')

const restore = await fetch(`${BASE}/api/admin/restore`, {
  method: 'POST',
  headers: {
    'X-Admin-Token': token,
    'Content-Type': 'application/zip',
  },
  body: buf,
})
const restored = await restore.json()
console.log('restore', restore.status, restored)

const after = await fetch(`${BASE}/api/admin/backup/info`, {
  headers: { 'X-Admin-Token': token },
})
const afterInfo = await after.json()
console.log('after', afterInfo.manifest?.counts)
