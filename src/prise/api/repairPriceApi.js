const API_BASE = '/api/repair-price';
const SERVICES_BASE = '/api/services';
const ADMIN_SERVICES_BASE = '/api/admin/services';
const ADMIN_SUPPLIERS_BASE = '/api/admin/suppliers';

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Ошибка запроса');
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

/** @param {string} [query] */
export async function fetchRepairModels(query = '', signal) {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  const qs = params.toString();
  const url = `${API_BASE}/models${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { signal });
  const data = await parseResponse(res);
  return data.models ?? [];
}

/**
 * @param {string} modelIdOrQuery — id модели или текст
 * @param {AbortSignal} [signal]
 * @param {{ label?: string }} [options]
 */
export async function fetchRepairPrice(modelIdOrQuery, signal, options = {}) {
  const value = String(modelIdOrQuery || '').trim();
  const params = new URLSearchParams();
  if (/^\d+$/.test(value)) {
    params.set('model', value);
    if (options.label?.trim()) params.set('label', options.label.trim());
  } else {
    params.set('q', value);
  }
  const res = await fetch(`${API_BASE}?${params}`, { signal });
  return parseResponse(res);
}

// ── Services catalog ─────────────────────────────────────────────────────────

export async function fetchServices({ category, deviceType, partType, brand, search, sort } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (deviceType) params.set('deviceType', deviceType);
  if (partType) params.set('partType', partType);
  if (brand) params.set('brand', brand);
  if (search) params.set('search', search);
  if (sort) params.set('sort', sort);
  const qs = params.toString();
  const res = await fetch(`${SERVICES_BASE}${qs ? `?${qs}` : ''}`);
  const data = await parseResponse(res);
  return data.items ?? [];
}

export async function fetchAdminServices({ category, deviceType, partType, search, archived } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (deviceType) params.set('deviceType', deviceType);
  if (partType) params.set('partType', partType);
  if (search) params.set('search', search);
  if (archived !== undefined) params.set('archived', String(archived));
  const qs = params.toString();
  const res = await fetch(`${ADMIN_SERVICES_BASE}${qs ? `?${qs}` : ''}`);
  const data = await parseResponse(res);
  return data.items ?? [];
}

export async function createAdminService(data) {
  const res = await fetch(ADMIN_SERVICES_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return parseResponse(res);
}

export async function updateAdminService(id, patch) {
  const res = await fetch(`${ADMIN_SERVICES_BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  return parseResponse(res);
}

export async function deleteAdminService(id) {
  const res = await fetch(`${ADMIN_SERVICES_BASE}/${id}`, { method: 'DELETE' });
  return parseResponse(res);
}

export async function bulkAdminServices(ids, action, extra = {}) {
  const res = await fetch(`${ADMIN_SERVICES_BASE}/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, action, ...extra }),
  });
  return parseResponse(res);
}

export function exportServicesCsvUrl(ids) {
  if (ids?.length) return `${ADMIN_SERVICES_BASE}/export-csv?ids=${ids.join(',')}`;
  return `${ADMIN_SERVICES_BASE}/export-csv`;
}

// ── Suppliers ─────────────────────────────────────────────────────────────────

export async function fetchAdminSuppliers() {
  const res = await fetch(ADMIN_SUPPLIERS_BASE);
  const data = await parseResponse(res);
  return data.items ?? [];
}

export async function createAdminSupplier(data) {
  const res = await fetch(ADMIN_SUPPLIERS_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return parseResponse(res);
}

export async function updateAdminSupplier(id, patch) {
  const res = await fetch(`${ADMIN_SUPPLIERS_BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  return parseResponse(res);
}

export async function deleteAdminSupplier(id) {
  const res = await fetch(`${ADMIN_SUPPLIERS_BASE}/${id}`, { method: 'DELETE' });
  return parseResponse(res);
}

// ── Search analytics ──────────────────────────────────────────────────────────

export function trackSearch(query) {
  // fire-and-forget; no await, no error bubbling
  fetch('/api/services', {
    method: 'GET',
    // The server already logs the search when called via /api/services?search=
    // This dedicated call is a no-op shim for explicit tracking from components
  }).catch(() => {});
}

export async function fetchPopularSearches(limit = 10) {
  const res = await fetch(`/api/search-analytics/popular?limit=${limit}`);
  const data = await parseResponse(res);
  return data.items ?? [];
}

export async function fetchAdminSearchAnalytics() {
  const res = await fetch('/api/admin/search-analytics');
  return parseResponse(res);
}

export async function markServicesChecked(ids) {
  const res = await fetch(`${ADMIN_SERVICES_BASE}/mark-checked`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  return parseResponse(res);
}
