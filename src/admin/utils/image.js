function supportsWebp() {
  try {
    return document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    return false
  }
}

function looksLikeImage(file) {
  if (!file) return false
  if (file.type?.startsWith('image/')) return true
  // iOS/Android иногда отдаёт пустой type
  if (!file.type || file.type === 'application/octet-stream') {
    if (!file.name || !file.name.includes('.')) return true
    return /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(file.name)
  }
  return /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(file.name || '')
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })
}

/** Запасной путь без canvas — если браузер не декодирует (редко) или canvas упал. */
async function fileToRawDataUrl(file) {
  const dataUrl = await readAsDataUrl(file)
  if (!dataUrl.startsWith('data:image/')) {
    throw new Error('Файл не похож на изображение')
  }
  const name = file.name || 'photo.jpg'
  const mime = dataUrl.slice(5, dataUrl.indexOf(';')) || file.type || 'image/jpeg'
  return { dataUrl, name, mime }
}

/** Сжимает фото в браузере перед загрузкой — быстрее и без гигантских файлов. */
export function fileToCompressedDataUrl(
  file,
  { maxSide = 1600, quality = 0.82, preferWebp = false, maxBytes = 40 * 1024 * 1024 } = {},
) {
  return new Promise((resolve, reject) => {
    if (!looksLikeImage(file)) {
      reject(new Error('Выберите изображение'))
      return
    }
    if (file.size > maxBytes) {
      reject(new Error('Файл слишком большой (макс. 40 МБ)'))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    // Нужно для некоторых Android WebView / кросс-origin blob edge cases
    img.decoding = 'async'

    const failDecode = () => {
      URL.revokeObjectURL(objectUrl)
      // Fallback: отправить оригинал (сервер лимит 8 МБ — крупные режем сообщением)
      if (file.size > 7.5 * 1024 * 1024) {
        reject(
          new Error(
            'Не удалось сжать фото. Выберите снимок поменьше или сохраните как JPG.',
          ),
        )
        return
      }
      fileToRawDataUrl(file).then(resolve).catch(reject)
    }

    img.onload = () => {
      try {
        const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1))
        const w = Math.max(1, Math.round((img.width || 1) * scale))
        const h = Math.max(1, Math.round((img.height || 1) * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('canvas')
        ctx.drawImage(img, 0, 0, w, h)
        const preferPng = file.type === 'image/png' && hasTransparency(ctx, w, h)
        let mime = 'image/jpeg'
        let name = file.name || 'photo.jpg'
        if (preferPng) {
          mime = 'image/png'
          name = name.replace(/\.[^.]+$/, '.png')
        } else if (preferWebp && supportsWebp()) {
          mime = 'image/webp'
          name = name.replace(/\.[^.]+$/, '.webp')
        } else if (!/\.(jpe?g|png|webp)$/i.test(name)) {
          name = `${name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`
        }
        const dataUrl =
          mime === 'image/png' ? canvas.toDataURL(mime) : canvas.toDataURL(mime, quality)
        URL.revokeObjectURL(objectUrl)
        resolve({ dataUrl, name, mime })
      } catch {
        failDecode()
      }
    }
    img.onerror = failDecode
    img.src = objectUrl
  })
}

function hasTransparency(ctx, w, h) {
  try {
    const sample = ctx.getImageData(0, 0, Math.min(w, 64), Math.min(h, 64)).data
    for (let i = 3; i < sample.length; i += 4) {
      if (sample[i] < 250) return true
    }
  } catch {
    /* ignore */
  }
  return false
}
