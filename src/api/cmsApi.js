const TOKEN_KEY = 'proshivka_v2_admin_token'

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function fetchSiteCms(signal) {
  const res = await fetch('/api/cms', { signal, cache: 'no-store' })
  if (!res.ok) throw new Error('Не удалось загрузить контент')
  return res.json()
}

export async function loginAdmin(password) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.error || 'Ошибка входа')
  setAdminToken(data.token)
  return data
}

export async function saveSiteCms(content) {
  const res = await fetch('/api/admin/cms', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': getAdminToken(),
    },
    body: JSON.stringify({ content }),
  })
  if (res.status === 401) {
    setAdminToken('')
    throw new Error('Сессия истекла — войдите снова')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Не удалось сохранить')
  return data
}

export function logoutAdmin() {
  setAdminToken('')
}

export async function uploadAdminImage({ dataUrl, name }) {
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': getAdminToken(),
    },
    body: JSON.stringify({ dataUrl, name }),
  })
  if (res.status === 401) {
    setAdminToken('')
    throw new Error('Сессия истекла — войдите снова')
  }
  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.error || 'Не удалось загрузить фото')
  return data
}
