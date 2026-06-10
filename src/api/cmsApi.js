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

export async function fetchSiteCms(signal) {
  const res = await fetch('/api/cms', { signal });
  return parseResponse(res);
}

export async function saveSiteCms(content) {
  const pwd = sessionStorage.getItem('proshivka-admin-api-key') || '';
  const res = await fetch('/api/admin/cms', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Password': pwd,
    },
    body: JSON.stringify(content),
  });
  return parseResponse(res);
}
