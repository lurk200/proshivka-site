import { getAdminToken, setAdminToken } from './cmsApi.js'

export async function fetchCalculatorMeta(signal) {
  const res = await fetch('/api/public/calculator', { signal, cache: 'no-store' })
  if (!res.ok) throw new Error('Не удалось загрузить калькулятор')
  return res.json()
}

export async function searchCalculator(query, signal) {
  const res = await fetch(
    `/api/public/calculator/search?q=${encodeURIComponent(query)}`,
    { signal, cache: 'no-store' },
  )
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Поиск временно недоступен')
  return data
}

export async function suggestCalculator(query, signal) {
  const res = await fetch(
    `/api/public/calculator/suggest?q=${encodeURIComponent(query)}`,
    { signal, cache: 'no-store' },
  )
  if (!res.ok) return { suggestions: [] }
  return res.json()
}

export async function fetchAdminCalculator() {
  const res = await fetch('/api/admin/calculator', {
    headers: { 'X-Admin-Token': getAdminToken() },
    cache: 'no-store',
  })
  if (res.status === 401) throw new Error('Сессия истекла — войдите снова')
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки')
  return data.calculator
}

export async function saveAdminCalculator(calculator) {
  const res = await fetch('/api/admin/calculator', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': getAdminToken(),
    },
    body: JSON.stringify({ calculator }),
  })
  if (res.status === 401) {
    setAdminToken('')
    throw new Error('Сессия истекла — войдите снова')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Не удалось сохранить')
  return data.calculator
}
