/**
 * Проверка пакетной загрузки фото в админку (Xiaomi folder или args).
 * Usage: node scripts/test-gallery-upload.mjs [dir]
 */
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5174'
const DIR = process.argv[2] || path.join(process.env.USERPROFILE || '', 'Pictures', 'Xiaomi')
const token = Buffer.from(process.env.ADMIN_PASSWORD || 'admin').toString('base64')

function isImage(name) {
  return /\.(jpe?g|png|webp|gif)$/i.test(name)
}

async function uploadFile(filePath) {
  const buf = fs.readFileSync(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
  const dataUrl = `data:${mime};base64,${buf.toString('base64')}`
  const res = await fetch(`${BASE}/api/admin/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token,
    },
    body: JSON.stringify({ dataUrl, name: path.basename(filePath) }),
  })
  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.error || `upload failed ${res.status}`)
  return data.url
}

async function main() {
  if (!fs.existsSync(DIR)) throw new Error(`Нет папки: ${DIR}`)
  const files = fs
    .readdirSync(DIR)
    .filter(isImage)
    .map((n) => path.join(DIR, n))
    .slice(0, 3)
  if (files.length < 2) throw new Error('Нужно минимум 2 изображения для теста')

  console.log('Uploading', files.length, 'files from', DIR)
  const urls = []
  for (const f of files) {
    const url = await uploadFile(f)
    urls.push(url)
    console.log(' OK', path.basename(f), '->', url)
  }

  const unique = new Set(urls)
  if (unique.size !== urls.length) {
    throw new Error(`Коллизия имён: ${urls.length} загрузок, уникальных URL ${unique.size}`)
  }

  // Привяжем к первой работе в CMS
  const cmsRes = await fetch(`${BASE}/api/admin/cms`, {
    headers: { 'X-Admin-Token': token },
  })
  const cms = await cmsRes.json()
  if (!cmsRes.ok) throw new Error('CMS read failed')
  const works = [...(cms.content?.works || [])]
  if (!works.length) throw new Error('Нет работ в CMS')
  const idx = 0
  works[idx] = {
    ...works[idx],
    images: urls,
    image: urls[0],
    description: works[idx].description || 'Тест фотоотчёта (автозагрузка)',
  }
  const saveRes = await fetch(`${BASE}/api/admin/cms`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token,
    },
    body: JSON.stringify({ content: { ...cms.content, works } }),
  })
  const saved = await saveRes.json()
  if (!saveRes.ok) throw new Error(saved.error || 'CMS save failed')

  const check = saved.content.works[idx]
  console.log('Work', check.id, 'images:', check.images?.length)
  if (!check.images || check.images.length !== urls.length) {
    throw new Error(`Ожидали ${urls.length} фото в CMS, получили ${check.images?.length}`)
  }
  console.log('PASS multi-image upload + CMS gallery')
}

main().catch((e) => {
  console.error('FAIL', e.message)
  process.exit(1)
})
