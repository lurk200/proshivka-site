import { useCallback, useEffect, useRef, useState } from 'react';

const API_URL = '/api/repair-price/settings';

function adminHeaders() {
  return {
    'X-Admin-Password': sessionStorage.getItem('proshivka-admin-api-key') || '',
    'Content-Type': 'application/json',
  };
}

export function useRepairSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const savedTimerRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setSettings(data);
    } catch {
      // fall through with null — UI shows loading state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => clearTimeout(savedTimerRef.current);
  }, [load]);

  const save = useCallback(async (overrideSettings) => {
    const payload = overrideSettings ?? settings;
    if (!payload) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Ошибка сохранения на сервере');
      const updated = await res.json();
      setSettings(updated);
      setSaved(true);
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const reset = useCallback(() => {
    load();
  }, [load]);

  return { settings, setSettings, save, reset, loading, saving, saved, saveError };
}
