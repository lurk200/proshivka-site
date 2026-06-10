const API = '/api/orders';
const NOTIFY_API = '/api/admin/notifications';

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

/** @param {string} orderNumber */
export async function fetchOrderTrack(orderNumber, signal) {
  const params = new URLSearchParams({ number: orderNumber.trim() });
  const res = await fetch(`${API}/track?${params}`, { signal });
  return parseResponse(res);
}

function adminHeaders() {
  const pwd = sessionStorage.getItem('proshivka-admin-api-key') || '';
  return {
    'Content-Type': 'application/json',
    'X-Admin-Password': pwd,
  };
}

export async function fetchOrdersAdmin() {
  const res = await fetch(API, { headers: adminHeaders() });
  return parseResponse(res);
}

/** @param {object} payload */
export async function createOrderAdmin(payload) {
  const res = await fetch(API, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

/** @param {string} id @param {object} patch */
export async function updateOrderAdmin(id, patch) {
  const res = await fetch(`${API}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(patch),
  });
  return parseResponse(res);
}

/** @param {string} id */
export async function deleteOrderAdmin(id) {
  const res = await fetch(`${API}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  return parseResponse(res);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function fetchOrderAnalytics() {
  const res = await fetch(`${API}/analytics`, { headers: adminHeaders() });
  return parseResponse(res);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function fetchNotificationTemplates() {
  const res = await fetch(`${NOTIFY_API}/templates`, { headers: adminHeaders() });
  return parseResponse(res);
}

export async function updateNotificationTemplate(id, patch) {
  const res = await fetch(`${NOTIFY_API}/templates/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(patch),
  });
  return parseResponse(res);
}

export async function fetchNotificationLog(limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`${NOTIFY_API}/log?${params}`, { headers: adminHeaders() });
  return parseResponse(res);
}

export async function fetchOrderNotificationEvents(orderId) {
  const res = await fetch(`${NOTIFY_API}/order/${encodeURIComponent(orderId)}`, {
    headers: adminHeaders(),
  });
  return parseResponse(res);
}
