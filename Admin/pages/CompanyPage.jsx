import React, { useState } from 'react';
import { useCms } from '../../src/context/CmsContext';
import { PageHeader, AdminCard, Field, Input, SaveBar } from '../components/ui';
import { useAdminPersist } from '../hooks/useAdminPersist';

export default function CompanyPage() {
  const { content, defaults } = useCms();
  const { persist, saving, saved, saveError } = useAdminPersist();
  const [draft, setDraft] = useState(content.company);

  const handleSave = async () => {
    await persist((prev) => ({ ...prev, company: draft }));
  };

  const handleReset = () => {
    setDraft(defaults.company);
  };

  return (
    <>
      <PageHeader title="Компания" description="Контакты и основная информация, отображаемые на сайте." />
      <AdminCard>
        <div className="space-y-5">
          <Field label="Название">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="Подпись под названием (шапка)" hint="Как на логотипе: ремонт смартфонов и электроники">
            <Input
              value={draft.brandTagline ?? ''}
              onChange={(e) => setDraft({ ...draft, brandTagline: e.target.value })}
            />
          </Field>
          <Field label="Описание">
            <Input value={draft.descriptor} onChange={(e) => setDraft({ ...draft, descriptor: e.target.value })} />
          </Field>
          <Field label="Телефон">
            <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          </Field>

          <div className="pt-2 border-t border-[#2a2a2e]">
            <p className="text-[13px] font-medium text-[#e5e5e5] mb-1">Соцсети и мессенджеры</p>
            <p className="text-[12px] text-[#9ca3af] mb-4">
              Ссылки отображаются в шапке сайта. Оставьте поле пустым, чтобы скрыть иконку.
            </p>
            <div className="space-y-4">
              {(draft.contacts ?? []).map((contact, index) => (
                <Field key={contact.type} label={contact.label}>
                  <Input
                    value={contact.url}
                    onChange={(e) => {
                      const contacts = [...(draft.contacts ?? [])];
                      contacts[index] = { ...contact, url: e.target.value };
                      setDraft({ ...draft, contacts });
                    }}
                    placeholder={
                      contact.type === 'telegram'
                        ? 'https://t.me/username'
                        : contact.type === 'whatsapp'
                          ? 'https://wa.me/79001234567'
                          : contact.type === 'vk'
                            ? 'https://vk.com/your_page'
                            : 'https://max.ru/your_profile'
                    }
                  />
                </Field>
              ))}
            </div>
          </div>
          <Field label="Адрес">
            <Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
          </Field>
          <Field label="График работы">
            <Input value={draft.schedule} onChange={(e) => setDraft({ ...draft, schedule: e.target.value })} />
          </Field>
          <Field label="Рейтинг">
            <Input value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: e.target.value })} />
          </Field>
          <Field label="Подпись в футере">
            <Input
              value={draft.footerTagline ?? ''}
              onChange={(e) => setDraft({ ...draft, footerTagline: e.target.value })}
            />
          </Field>
        </div>
        <SaveBar onSave={handleSave} onReset={handleReset} saved={saved} saving={saving} saveError={saveError} />
      </AdminCard>
    </>
  );
}
