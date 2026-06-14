import React, { useEffect, useState } from 'react';
import { Loader2, Save, Check, Building2, Plus, Trash2 } from 'lucide-react';
import { PageHeader, AdminCard, Field, Input } from '../../components/ui';
import { useUnsavedGuard } from '../../hooks/useUnsavedGuard';

function adminHeaders() {
  const pwd = sessionStorage.getItem('proshivka-admin-api-key') || '';
  return { 'Content-Type': 'application/json', 'X-Admin-Password': pwd };
}

const qrPreview = (url) =>
  url ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=4&data=${encodeURIComponent(url)}` : null;

const CONTACT_TYPES = [
  { type: 'telegram', label: 'Telegram', placeholder: 'https://t.me/username' },
  { type: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/79001234567' },
  { type: 'vk', label: 'ВКонтакте', placeholder: 'https://vk.com/your_page' },
  { type: 'viber', label: 'Viber', placeholder: 'viber://chat?number=79001234567' },
  { type: 'max', label: 'MAX', placeholder: 'https://max.ru/your_profile' },
];

function SectionLabel({ children }) {
  return (
    <p className="text-[12px] font-mono uppercase tracking-widest text-[#4b5563] mb-4">{children}</p>
  );
}

export default function CompanySettingsPage() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState('');
  useUnsavedGuard(isDirty);

  useEffect(() => {
    fetch('/api/admin/settings/company', { headers: adminHeaders() })
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data.contacts)) {
          data.contacts = [
            { type: 'telegram', label: 'Telegram', url: '' },
            { type: 'whatsapp', label: 'WhatsApp', url: '' },
            { type: 'vk', label: 'ВКонтакте', url: '' },
            { type: 'max', label: 'MAX', url: '' },
          ];
        }
        setForm(data);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const markDirty = () => setIsDirty(true);

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); markDirty(); };

  const setContact = (idx, url) => {
    setForm(f => {
      const contacts = [...(f.contacts ?? [])];
      contacts[idx] = { ...contacts[idx], url };
      return { ...f, contacts };
    });
    markDirty();
  };

  const addContact = () => {
    setForm(f => ({
      ...f,
      contacts: [...(f.contacts ?? []), { type: 'telegram', label: 'Telegram', url: '' }],
    }));
    markDirty();
  };

  const removeContact = (idx) => {
    setForm(f => ({
      ...f,
      contacts: (f.contacts ?? []).filter((_, i) => i !== idx),
    }));
    markDirty();
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError('');
    try {
      const r = await fetch('/api/admin/settings/company', {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error(await r.text());
      const savedData = await r.json();
      setForm(savedData);
      setIsDirty(false);
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
        title="Компания и контакты"
        description="Единый источник данных о компании — используется на всём сайте и во всех документах."
        icon={Building2}
      />

      {/* Идентификация */}
      <AdminCard className="mb-4">
        <SectionLabel>Идентификация</SectionLabel>
        <div className="space-y-4">
          <Field label="Название компании">
            <Input value={form.name || ''} onChange={set('name')} placeholder="ПРОШИВКА" />
          </Field>
          <Field label="Подпись под логотипом (шапка)" hint="Отображается рядом с названием в хедере сайта">
            <Input value={form.brandTagline || ''} onChange={set('brandTagline')} placeholder="Ремонт смартфонов и электроники" />
          </Field>
          <Field label="Описание компании" hint="Используется в разделе «О нас» и мета-тегах">
            <Input value={form.descriptor || ''} onChange={set('descriptor')} placeholder="Лаборатория восстановления устройств" />
          </Field>
          <Field label="Подпись в подвале">
            <Input value={form.footerTagline || ''} onChange={set('footerTagline')} placeholder="Диагностика · Ремонт · Восстановление данных" />
          </Field>
          <Field label="Рейтинг" hint="Отображается в подвале рядом со звёздочкой">
            <Input value={form.rating || ''} onChange={set('rating')} placeholder="5.0" />
          </Field>
        </div>
      </AdminCard>

      {/* Контакты */}
      <AdminCard className="mb-4">
        <SectionLabel>Контакты</SectionLabel>
        <div className="space-y-4">
          <Field label="Телефон">
            <Input value={form.phone || ''} onChange={set('phone')} placeholder="+7 (988) 087-43-12" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email || ''} onChange={set('email')} placeholder="info@proshivka.online" />
          </Field>
          <Field label="Сайт">
            <Input value={form.website || ''} onChange={set('website')} placeholder="proshivka.online" />
          </Field>
          <Field label="Адрес">
            <Input value={form.address || ''} onChange={set('address')} placeholder="улица Пирогова, 5Ак4, Ставрополь" />
          </Field>
          <Field label="График работы">
            <Input value={form.schedule || ''} onChange={set('schedule')} placeholder="10:00 - 20:00 Ежедневно" />
          </Field>
        </div>
      </AdminCard>

      {/* Мессенджеры и соцсети */}
      <AdminCard className="mb-4">
        <SectionLabel>Мессенджеры и соцсети</SectionLabel>
        <p className="text-[12px] text-[#9ca3af] mb-4">
          Ссылки отображаются в шапке сайта. Оставьте поле пустым, чтобы скрыть иконку.
        </p>
        <div className="space-y-3">
          {(form.contacts ?? []).map((contact, idx) => {
            const preset = CONTACT_TYPES.find(t => t.type === contact.type);
            return (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1">
                  <Field label={contact.label || preset?.label || contact.type}>
                    <Input
                      value={contact.url || ''}
                      onChange={(e) => setContact(idx, e.target.value)}
                      placeholder={preset?.placeholder || 'https://...'}
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => removeContact(idx)}
                  className="mt-5 p-2 text-[#6b7280] hover:text-red-400 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={addContact}
            className="flex items-center gap-1.5 text-[12.5px] text-[#84CC16] hover:text-[#9be02a] transition-colors mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Добавить ссылку
          </button>
        </div>
      </AdminCard>

      {/* Отзывы */}
      <AdminCard className="mb-4">
        <SectionLabel>Ссылка для отзывов</SectionLabel>
        <div className="space-y-4">
          <Field
            label="Ссылка Яндекс.Карты / другой сервис"
            hint="QR-код генерируется автоматически. Показывается клиентам после выдачи заказа и во всех документах."
          >
            <Input
              value={form.reviewUrl || ''}
              onChange={set('reviewUrl')}
              placeholder="https://yandex.ru/maps/org/proshivka/..."
            />
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
      </AdminCard>

      {error && (
        <p className="mb-4 text-[13px] text-red-400">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#84CC16] text-[#0c0d10] font-semibold text-[13.5px] hover:bg-[#9be02a] disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Сохранение…' : saved ? 'Сохранено' : 'Сохранить изменения'}
        </button>
      </div>
    </>
  );
}
