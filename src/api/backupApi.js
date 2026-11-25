import { getAdminToken, setAdminToken } from './cmsApi.js'

function authHeaders() {
  return { 'X-Admin-Token': getAdminToken() }
}

export async function fetchBackupInfo() {
  const res = await fetch('/api/admin/backup/info', {
    headers: authHeaders(),
    cache: 'no-store',
  })
  if (res.status === 401) {
    setAdminToken('')
    throw new Error('Сессия истекла — войдите снова')
  }
  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.error || 'Не удалось получить сведения')
  return data.manifest
}

/** Скачивает ZIP на устройство пользователя. */
export async function downloadBackup() {
  const res = await fetch('/api/admin/backup', {
    headers: authHeaders(),
    cache: 'no-store',
  })
  if (res.status === 401) {
    setAdminToken('')
    throw new Error('Сессия истекла — войдите снова')
  }
  if (!res.ok) {
    let msg = 'Не удалось скачать бэкап'
    try {
      const data = await res.json()
      if (data?.error) msg = data.error
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }

  const blob = await res.blob()
  const cd = res.headers.get('Content-Disposition') || ''
  const match = cd.match(/filename="?([^";]+)"?/i)
  const filename = match?.[1] || `proshivka-backup-${Date.now()}.zip`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return { filename, size: blob.size }
}

/** Заливает ZIP и полностью заменяет CMS + uploads + CRM. */
export async function restoreBackup(file) {
  if (!file) throw new Error('Выберите ZIP-файл')
  const res = await fetch('/api/admin/restore', {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/zip',
    },
    body: file,
  })
  if (res.status === 401) {
    setAdminToken('')
    throw new Error('Сессия истекла — войдите снова')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.ok) throw new Error(data.error || 'Не удалось восстановить')
  return data
}
