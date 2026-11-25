/**
 * Проверка загрузки фото на прод: логин → upload → CMS works.
 * Запуск: node deploy/test-upload.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.SITE_URL || 'https://proshivka.online'
const PASS = process.env.ADMIN_PASSWORD || 'Lolipop1199'
const IMG =
  process.env.IMG ||
  'C:\\Users\\Lurk\\Pictures\\Xiaomi\\photo_2026-07-04_17-29-32.jpg'

function toDataUrl(filePath) {
  const buf = fs.readFileSync(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const mime =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
  return `data:${mime};base64,${buf.toString('base64')}`
}

async function main() {
  console.log('BASE', BASE)
  console.log('IMG', IMG, fs.statSync(IMG).size)

  const login = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: PASS }),
  })
  const loginData = await login.json()
  console.log('login', login.status, loginData)
  if (!loginData.ok) throw new Error('login failed')
  const token = loginData.token

  const dataUrl = toDataUrl(IMG)
  console.log('dataUrl length', dataUrl.length)

  const up = await fetch(`${BASE}/api/admin/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token,
    },
    body: JSON.stringify({
      dataUrl,
      name: path.basename(IMG),
    }),
  })
  const text = await up.text()
  console.log('upload status', up.status)
  console.log('upload body', text.slice(0, 500))
  let upData
  try {
    upData = JSON.parse(text)
  } catch {
    throw new Error('upload not json')
  }
  if (!upData.ok) throw new Error(upData.error || 'upload failed')

  // verify file served
  const imgRes = await fetch(`${BASE}${upData.url}`)
  console.log('serve', imgRes.status, imgRes.headers.get('content-type'), 'bytes', (await imgRes.arrayBuffer()).byteLength)

  // add work to CMS
  const cmsGet = await fetch(`${BASE}/api/admin/cms`, {
    headers: { 'X-Admin-Token': token },
  })
  const cms = await cmsGet.json()
  const content = cms.content
  const work = {
    id: `w-yandex-mini-${Date.now()}`,
    title: 'Яндекс Станция Мини',
    model: 'Яндекс Станция Мини',
    category: 'Разъём / зарядка',
    status: 'Готово',
    published: true,
    image: upData.url,
    images: [upData.url],
    description:
      'Устройство поступило на замену разъёма. Выполнена замена неисправного разъёма с восстановлением работоспособности устройства.',
    highlights: [
      'Диагностика разъёма',
      'Замена неисправного разъёма',
      'Проверка зарядки и работоспособности',
    ],
  }
  content.works = [work, ...(content.works || [])]
  const save = await fetch(`${BASE}/api/admin/cms`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token,
    },
    body: JSON.stringify({ content }),
  })
  const saveData = await save.json()
  console.log('save', save.status, saveData.ok, 'works', saveData.content?.works?.length)
}

main().catch((e) => {
  console.error('FAIL', e)
  process.exit(1)
})
