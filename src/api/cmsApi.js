import { clearAdminSession, hasAdminSession, handleAdminApiError } from '../utils/adminSession';

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
  const res = await fetch('/api/cms', { signal, cache: 'no-store' });
  return parseResponse(res);
}

export async function saveSiteCms(content) {
  if (!hasAdminSession()) {
    return { skipped: true };
  }

  const pwd = sessionStorage.getItem('proshivka-admin-api-key') || '';

  try {
    const res = await fetch('/api/admin/cms', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': pwd,
      },
      body: JSON.stringify(content),
    });
    return await parseResponse(res);
  } catch (error) {
    handleAdminApiError(error);
    throw error;
  }
}

function adminHeaders() {
  return {
    'X-Admin-Password': sessionStorage.getItem('proshivka-admin-api-key') || '',
  };
}

export async function fetchCmsStoreStatus() {
  const res = await fetch('/api/admin/cms/status', { headers: adminHeaders() });
  return parseResponse(res);
}

export async function downloadCmsBackup() {
  const res = await fetch('/api/admin/cms/export', { headers: adminHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Не удалось скачать резервную копию');
  }
  const blob = await res.blob();
  const stamp = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `proshivka-cms-${stamp}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function restoreCmsBackup(file) {
  const text = await file.text();
  const content = JSON.parse(text);
  return saveSiteCms(content);
}
