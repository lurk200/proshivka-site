import { getAdminToken, setAdminToken } from './cmsApi.js'

async function crmFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': getAdminToken(),
      ...(options.headers || {}),
    },
    cache: 'no-store',
  })
  if (res.status === 401) {
    setAdminToken('')
    throw new Error('Сессия истекла — войдите снова')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Ошибка CRM')
  return data
}

export async function fetchCrm() {
  return crmFetch('/api/crm')
}

export async function createCrmOrder(payload) {
  return crmFetch('/api/crm/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function patchCrmOrder(id, payload) {
  return crmFetch(`/api/crm/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function fetchCrmOrder(id) {
  return crmFetch(`/api/crm/orders/${encodeURIComponent(id)}`)
}

export async function searchCrmDevices(q) {
  return crmFetch(`/api/crm/devices/search?q=${encodeURIComponent(q || '')}`)
}

export async function fetchCrmDevice(id) {
  return crmFetch(`/api/crm/devices/${encodeURIComponent(id)}`)
}

export async function fetchPublicTrack(tokenOrNumber, signal) {
  const key = String(tokenOrNumber || '').trim()
  const looksLikeNumber = /^\d{6}-\d+$/.test(key) || /^\d+$/.test(key)
  const url = looksLikeNumber
    ? `/api/public/track?number=${encodeURIComponent(key)}`
    : `/api/public/track/${encodeURIComponent(key)}`
  const res = await fetch(url, { signal, cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Не найдено')
  return data
}
