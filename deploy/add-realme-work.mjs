/** Добавить кейс Realme C63 с фото с телефона. */
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.SITE_URL || 'https://proshivka.online'
const PASS = process.env.ADMIN_PASSWORD || 'Lolipop1199'
const IMG =
  process.env.IMG ||
  path.resolve('tmp-phone/tg-1.jpg')

function toDataUrl(filePath) {
  const buf = fs.readFileSync(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg'
  return `data:${mime};base64,${buf.toString('base64')}`
}

const login = await fetch(`${BASE}/api/admin/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: PASS }),
})
const { token, ok } = await login.json()
if (!ok) throw new Error('login failed')

const images = []
const candidates = [
  IMG,
  path.resolve('tmp-phone/tg-2.jpg'),
  path.resolve('tmp-phone/realme-cover.jpg'),
].filter((p, i, arr) => fs.existsSync(p) && arr.indexOf(p) === i)

for (const filePath of candidates.slice(0, 2)) {
  const up = await fetch(`${BASE}/api/admin/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify({ dataUrl: toDataUrl(filePath), name: path.basename(filePath) }),
  })
  const uploaded = await up.json()
  if (!uploaded.ok) throw new Error(uploaded.error || `upload failed: ${filePath}`)
  images.push(uploaded.url)
  console.log('photo', uploaded.url)
}

const cmsRes = await fetch(`${BASE}/api/admin/cms`, { headers: { 'X-Admin-Token': token } })
const { content } = await cmsRes.json()

const description = [
  'Успешно восстановлен доступ к устройству без сброса до заводских настроек и потери пользовательской информации.',
  '',
  'Все данные владельца сохранены:',
  '• Фотографии и видео',
  '• Установленные приложения',
  '• Личные файлы и пользовательская информация',
  '',
  'Работа выполнена с сохранением всей информации на устройстве.',
].join('\n')

const work = {
  id: 'realme-c63-unlock',
  title: 'Разблокировка с сохранением данных',
  model: 'Realme C63 (RMX3939)',
  category: 'Разблокировка',
  status: 'Готово',
  published: true,
  image: images[0] || '',
  images,
  description,
  highlights: [
    'Разблокировка без сброса',
    'Сохранены фото, приложения и файлы',
    'Проверка входа после работы',
  ],
}

const rest = (content.works || []).filter((w) => w.id !== work.id)
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
console.log(
  'saved',
  save.status,
  saved.ok,
  'first',
  saved.content?.works?.[0]?.title,
  saved.content?.works?.[0]?.model,
  saved.content?.works?.[0]?.image,
)
