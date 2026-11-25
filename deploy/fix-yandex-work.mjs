/** Обновить карточку «Яндекс Станция Мини» текстом из объявления. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.SITE_URL || 'https://proshivka.online'
const PASS = process.env.ADMIN_PASSWORD || 'Lolipop1199'
const IMG =
  process.env.IMG ||
  'C:\\Users\\Lurk\\Pictures\\Xiaomi\\photo_2026-07-04_17-29-32.jpg'

function toDataUrl(filePath) {
  const buf = fs.readFileSync(filePath)
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

const login = await fetch(`${BASE}/api/admin/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: PASS }),
})
const { token, ok } = await login.json()
if (!ok) throw new Error('login failed')

const up = await fetch(`${BASE}/api/admin/upload`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
  body: JSON.stringify({ dataUrl: toDataUrl(IMG), name: path.basename(IMG) }),
})
const uploaded = await up.json()
if (!uploaded.ok) throw new Error(uploaded.error || 'upload failed')
console.log('photo', uploaded.url)

const cmsRes = await fetch(`${BASE}/api/admin/cms`, { headers: { 'X-Admin-Token': token } })
const { content } = await cmsRes.json()

const description = [
  'Устройство поступило на замену разъёма.',
  '',
  'Выполнена замена неисправного разъёма с восстановлением работоспособности устройства.',
].join('\n')

const work = {
  id: 'yandex-station-mini',
  title: 'Яндекс Станция Мини',
  model: 'Яндекс Станция Мини',
  category: 'Разъём / зарядка',
  status: 'Готово',
  published: true,
  image: uploaded.url,
  images: [uploaded.url],
  description,
  highlights: [
    'Диагностика разъёма',
    'Замена неисправного разъёма',
    'Проверка работоспособности',
  ],
}

const rest = (content.works || []).filter((w) => w.id !== work.id && !String(w.id).startsWith('w-yandex-mini'))
content.works = [work, ...rest]

const save = await fetch(`${BASE}/api/admin/cms`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-Admin-Token': token,
  },
  body: JSON.stringify({ content }),
})
const saved = await save.json()
console.log('saved', save.status, saved.ok, 'first', saved.content?.works?.[0]?.title, saved.content?.works?.[0]?.image)
