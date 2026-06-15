const API_BASE = '/api/repair-price';
const SERVICES_BASE = '/api/services';
const ADMIN_SERVICES_BASE = '/api/admin/services';
const ADMIN_SUPPLIERS_BASE = '/api/admin/suppliers';

function adminHeaders(extra = {}) {
  const pwd = sessionStorage.getItem('proshivka-admin-api-key') || '';
  return { 'X-Admin-Password': pwd, ...extra };
}

async function parseResponse(res) {
  if (res.status === 401) {
    sessionStorage.removeItem('proshivka-admin-api-key');
    window.location.href = '/admin/login';
    throw new Error('Unauthorized');
  }
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
  try {
    const sid = sessionStorage.getItem('proshivka-sid');
    if (sid) params.set('sessionId', sid);
  } catch {}
  const res = await fetch(`${API_BASE}?${params}`, { signal });
  return parseResponse(res);
}

// ── Services catalog ─────────────────────────────────────────────────────────

export async function fetchServices({ category, deviceType, partType, brand, search, sort, sessionId } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (deviceType) params.set('deviceType', deviceType);
  if (partType) params.set('partType', partType);
  if (brand) params.set('brand', brand);
  if (search) params.set('search', search);
  if (sort) params.set('sort', sort);
  if (sessionId) params.set('sessionId', sessionId);
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
  const res = await fetch(`${ADMIN_SERVICES_BASE}${qs ? `?${qs}` : ''}`, { headers: adminHeaders() });
  const data = await parseResponse(res);
  return data.items ?? [];
}

export async function createAdminService(data) {
  const res = await fetch(ADMIN_SERVICES_BASE, { method: 'POST', headers: adminHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(data) });
  return parseResponse(res);
}

export async function updateAdminService(id, patch) {
  const res = await fetch(`${ADMIN_SERVICES_BASE}/${id}`, { method: 'PUT', headers: adminHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(patch) });
  return parseResponse(res);
}

export async function deleteAdminService(id) {
  const res = await fetch(`${ADMIN_SERVICES_BASE}/${id}`, { method: 'DELETE', headers: adminHeaders() });
  return parseResponse(res);
}

export async function bulkAdminServices(ids, action, extra = {}) {
  const res = await fetch(`${ADMIN_SERVICES_BASE}/bulk`, {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ ids, action, ...extra }),
  });
  return parseResponse(res);
}

export async function downloadServicesCsv(ids) {
  const params = new URLSearchParams();
  if (ids?.length) params.set('ids', ids.join(','));
  const url = `${ADMIN_SERVICES_BASE}/export-csv${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url, { headers: adminHeaders() });
  if (!res.ok) throw new Error('Ошибка экспорта');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'services.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Suppliers ─────────────────────────────────────────────────────────────────

export async function fetchAdminSuppliers() {
  const res = await fetch(ADMIN_SUPPLIERS_BASE, { headers: adminHeaders() });
  const data = await parseResponse(res);
  return data.items ?? [];
}

export async function createAdminSupplier(data) {
  const res = await fetch(ADMIN_SUPPLIERS_BASE, { method: 'POST', headers: adminHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(data) });
  return parseResponse(res);
}

export async function updateAdminSupplier(id, patch) {
  const res = await fetch(`${ADMIN_SUPPLIERS_BASE}/${id}`, { method: 'PUT', headers: adminHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(patch) });
  return parseResponse(res);
}

export async function deleteAdminSupplier(id) {
  const res = await fetch(`${ADMIN_SUPPLIERS_BASE}/${id}`, { method: 'DELETE', headers: adminHeaders() });
  return parseResponse(res);
}

// ── Search analytics ──────────────────────────────────────────────────────────

export async function fetchPopularSearches(limit = 10) {
  const res = await fetch(`/api/search-analytics/popular?limit=${limit}`);
  const data = await parseResponse(res);
  return data.items ?? [];
}

export async function fetchAdminSearchAnalytics() {
  const res = await fetch('/api/admin/search-analytics', { headers: adminHeaders() });
  return parseResponse(res);
}

export async function fetchAdminAnalytics(headers = {}) {
  const res = await fetch('/api/admin/analytics', { headers: adminHeaders(headers) });
  return parseResponse(res);
}

export async function fetchAdminAnalyticsSearchDemand(headers = {}, limit = 100) {
  const res = await fetch(`/api/admin/analytics/search-demand?limit=${limit}`, { headers: adminHeaders(headers) });
  return parseResponse(res);
}

export async function cleanupAnalyticsEvents(headers = {}) {
  const res = await fetch('/api/admin/analytics/cleanup', { method: 'POST', headers: adminHeaders(headers) });
  return parseResponse(res);
}

export async function markServicesChecked(ids) {
  const res = await fetch(`${ADMIN_SERVICES_BASE}/mark-checked`, {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ ids }),
  });
  return parseResponse(res);
}

export async function fetchSupplierSyncStatus() {
  const res = await fetch('/api/admin/supplier-sync', { headers: adminHeaders() });
  return parseResponse(res);
}

export async function triggerSupplierSync() {
  const res = await fetch('/api/admin/supplier-sync', { method: 'POST', headers: adminHeaders() });
  return parseResponse(res);
}

export async function fetchSupplierStock() {
  const res = await fetch('/api/admin/supplier-stock', { headers: adminHeaders() });
  return parseResponse(res);
}

export async function fetchLibertiMapStatus() {
  const res = await fetch('/api/admin/liberti-model-map', { headers: adminHeaders() });
  return parseResponse(res);
}

/** brands = ['apple','samsung'] or null = all brands */
export async function triggerLibertiMapBuild(brands = null) {
  const qs = brands?.length ? `?brands=${brands.join(',')}` : '';
  const res = await fetch(`/api/admin/liberti-model-map${qs}`, { method: 'POST', headers: adminHeaders() });
  return parseResponse(res);
}
