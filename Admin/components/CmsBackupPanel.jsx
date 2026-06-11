import React, { useEffect, useRef, useState } from 'react';
import { Download, HardDrive, RefreshCw, Upload } from 'lucide-react';
import {
  downloadCmsBackup,
  fetchCmsStoreStatus,
  restoreCmsBackup,
} from '../../src/api/cmsApi';
import { AdminCard } from '../components/ui';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function CmsBackupPanel() {
  const fileRef = useRef(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadStatus = async () => {
    setLoading(true);
    setError('');
    try {
      setStatus(await fetchCmsStoreStatus());
    } catch (err) {
      setError(err.message || 'Не удалось получить статус CMS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleDownload = async () => {
    setBusy('download');
    setMessage('');
    setError('');
    try {
      await downloadCmsBackup();
      setMessage('Резервная копия скачана. Храните файл отдельно от GitHub.');
      await loadStatus();
    } catch (err) {
      setError(err.message || 'Ошибка скачивания');
    } finally {
      setBusy('');
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!window.confirm('Заменить текущий контент сайта данными из файла?')) return;

    setBusy('restore');
    setMessage('');
    setError('');
    try {
      await restoreCmsBackup(file);
      setMessage('Контент восстановлен из файла. Обновите страницу сайта.');
      await loadStatus();
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Ошибка восстановления');
    } finally {
      setBusy('');
    }
  };

  return (
    <AdminCard className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-[#84CC16]" />
            <h2 className="text-[16px] font-semibold text-white">Резервная копия контента</h2>
          </div>
          <p className="max-w-2xl text-[13px] leading-relaxed text-[#9ca3af]">
            Контент сайта не хранится в GitHub. При обновлении через git pull данные сохраняются
            в отдельной папке на сервере. Скачайте копию перед деплоем — так ничего не потеряется.
          </p>
        </div>
        <button
          type="button"
          onClick={loadStatus}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 px-3 py-2 text-[13px] text-[#d1d5db] hover:bg-white/[0.04]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      <div className="mt-5 grid gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-[13px] text-[#d1d5db] sm:grid-cols-2">
        <div>
          <span className="text-[#6b7280]">Статус:</span>{' '}
          {status?.exists ? 'сохранён на сервере' : 'ещё не сохраняли через админку'}
        </div>
        <div>
          <span className="text-[#6b7280]">Обновлено:</span> {formatDate(status?.updatedAt)}
        </div>
        <div className="sm:col-span-2 break-all">
          <span className="text-[#6b7280]">Папка на сервере:</span> {status?.dataDir ?? '—'}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy !== '' || !status?.exists}
          className="inline-flex items-center gap-2 rounded-xl bg-[#84CC16] px-4 py-2.5 text-[14px] font-medium text-[#0c0d10] hover:bg-[#9be02a] disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {busy === 'download' ? 'Скачивание…' : 'Скачать JSON'}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy !== ''}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-[14px] text-[#d1d5db] hover:bg-white/[0.04] disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {busy === 'restore' ? 'Восстановление…' : 'Восстановить из файла'}
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleRestore} />
      </div>

      {message ? <p className="mt-4 text-[13px] text-[#84CC16]">{message}</p> : null}
      {error ? <p className="mt-4 text-[13px] text-[#f87171]">{error}</p> : null}
    </AdminCard>
  );
}
