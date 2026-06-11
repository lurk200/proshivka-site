import React, { useEffect, useState } from 'react';
import { Loader2, Save, Check, Building2, QrCode } from 'lucide-react';
import { PageHeader, AdminCard, Field, Input } from '../../components/ui';

function adminHeaders() {
  const pwd = sessionStorage.getItem('proshivka-admin-api-key') || '';
  return { 'Content-Type': 'application/json', 'X-Admin-Password': pwd };
}

const qrPreview = (url) =>
  url ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=4&data=${encodeURIComponent(url)}` : null;

export default function CompanySettingsPage() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings/company', { headers: adminHeaders() })
      .then(r => r.json())
      .then(data => { setForm(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError('');
    try {
      const r = await fetch('/api/admin/settings/company', {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error(await r.text());
      const saved = await r.json();
      setForm(saved);
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
        title="Настройки компании"
        description="Реквизиты, контакты и ссылка на отзывы — используются во всех документах."
        icon={Building2}
      />

      <AdminCard>
        <div className="space-y-5">
          <div className="border-b border-white/[0.06] pb-5 space-y-4">
            <p className="text-[12px] font-mono uppercase tracking-widest text-[#4b5563]">Основное</p>
            <Field label="Название компании">
              <Input value={form.name || ''} onChange={set('name')} placeholder="ПРОШИВКА" />
            </Field>
            <Field label="Слоган / описание">
              <Input value={form.tagline || ''} onChange={set('tagline')} placeholder="Ремонт смартфонов и электроники" />
            </Field>
            <Field label="Адрес">
              <Input value={form.address || ''} onChange={set('address')} placeholder="улица Пирогова, 5Ак4, Ставрополь, 355032" />
            </Field>
            <Field label="Телефон">
              <Input value={form.phone || ''} onChange={set('phone')} placeholder="+7 (988) 087-43-12" />
            </Field>
          </div>

          <div className="border-b border-white/[0.06] pb-5 space-y-4">
            <p className="text-[12px] font-mono uppercase tracking-widest text-[#4b5563]">Контакты</p>
            <Field label="Email">
              <Input type="email" value={form.email || ''} onChange={set('email')} placeholder="info@proshivka.online" />
            </Field>
            <Field label="Сайт">
              <Input value={form.website || ''} onChange={set('website')} placeholder="proshivka.online" />
            </Field>
          </div>

          <div className="space-y-4">
            <p className="text-[12px] font-mono uppercase tracking-widest text-[#4b5563]">QR-код для отзывов</p>
            <Field
              label="Ссылка для отзывов"
              hint="QR-код генерируется автоматически из этой ссылки. Отображается на всех документах."
            >
              <Input value={form.reviewUrl || ''} onChange={set('reviewUrl')}
                placeholder="https://yandex.ru/maps/org/proshivka/120325503052/" />
            </Field>
            {form.reviewUrl && (
              <div className="flex items-start gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <img
                  src={qrPreview(form.reviewUrl)}
                  alt="QR код"
                  className="w-[80px] h-[80px] rounded-lg border border-white/[0.08]"
                />
                <div>
                  <p className="text-[12px] text-[#9ca3af] mb-1">Предпросмотр QR-кода</p>
                  <p className="text-[11px] text-[#4b5563] break-all max-w-[300px]">{form.reviewUrl}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-[13px] text-red-400">{error}</p>
        )}

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
