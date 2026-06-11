import React, { useEffect, useState } from 'react';
import { Loader2, Save, Check, FileText, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader, AdminCard, Field, Input } from '../../components/ui';

function adminHeaders() {
  const pwd = sessionStorage.getItem('proshivka-admin-api-key') || '';
  return { 'Content-Type': 'application/json', 'X-Admin-Password': pwd };
}

const qrPreview = (url) =>
  url ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=4&data=${encodeURIComponent(url)}` : null;

export default function DocumentSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings/company', { headers: adminHeaders() })
      .then(r => r.json())
      .then(data => { setSettings(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError('');
    try {
      const r = await fetch('/api/admin/settings/company', {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify(settings),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-[#84CC16]" />
    </div>
  );

  return (
    <>
      <PageHeader
        title="Настройки документов"
        description="QR-код для отзывов и параметры, встраиваемые в квитанции и акты."
        icon={FileText}
      />

      <AdminCard>
        <div className="space-y-5">
          {/* QR section */}
          <div className="space-y-4">
            <Field
              label="Ссылка для отзывов (QR-код)"
              hint="QR-код с этой ссылкой печатается на акте выполненных работ и гарантийном талоне. По умолчанию — Яндекс Карты."
            >
              <Input
                value={settings.reviewUrl || ''}
                onChange={e => setSettings(s => ({ ...s, reviewUrl: e.target.value }))}
                placeholder="https://yandex.ru/maps/org/proshivka/120325503052/"
              />
            </Field>

            {settings.reviewUrl && (
              <div className="flex items-center gap-5 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="shrink-0">
                  <img
                    src={qrPreview(settings.reviewUrl)}
                    alt="QR код для отзывов"
                    className="w-[100px] h-[100px] rounded-xl border border-white/[0.1]"
                  />
                  <p className="text-[10px] text-[#4b5563] text-center mt-1">Предпросмотр</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#d1d5db] mb-1">QR-код для отзывов</p>
                  <p className="text-[11px] text-[#6b7280] break-all mb-3">{settings.reviewUrl}</p>
                  <a href={settings.reviewUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12px] text-[#84CC16] hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Открыть ссылку
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Hint about company settings */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="text-[12.5px] text-[#9ca3af]">
              Название, адрес и телефон в документах берутся из{' '}
              <Link to="/admin/settings/company" className="text-[#84CC16] hover:underline">
                настроек компании
              </Link>.
            </p>
          </div>
        </div>

        {error && <p className="mt-4 text-[13px] text-red-400">{error}</p>}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#84CC16] text-[#0c0d10] font-semibold text-[13.5px] hover:bg-[#9be02a] disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Сохранение…' : saved ? 'Сохранено' : 'Сохранить'}
          </button>
        </div>
      </AdminCard>
    </>
  );
}
