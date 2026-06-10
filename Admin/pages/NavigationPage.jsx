import React from 'react';
import { useSiteDraft } from '../hooks/useSiteDraft';
import { PageHeader, AdminCard, Field, Input, SaveBar } from '../components/ui';

export default function NavigationPage() {
  const { draft, setDraft, save, reset, saved } = useSiteDraft('siteNavigation');

  const updateNav = (idx, patch) => {
    const serviceNav = [...draft.serviceNav];
    serviceNav[idx] = { ...serviceNav[idx], ...patch };
    setDraft({ ...draft, serviceNav });
  };

  const updateFooter = (idx, patch) => {
    const footerLinks = [...draft.footerLinks];
    footerLinks[idx] = { ...footerLinks[idx], ...patch };
    setDraft({ ...draft, footerLinks });
  };

  const updateHeader = (idx, patch) => {
    const headerLinks = [...(draft.headerLinks ?? [])];
    headerLinks[idx] = { ...headerLinks[idx], ...patch };
    setDraft({ ...draft, headerLinks });
  };

  return (
    <>
      <PageHeader title="Навигация" description="Меню в шапке, карточки услуг и ссылки в футере." />

      <AdminCard className="mb-6">
        <p className="text-[13px] font-medium text-white mb-4">Программный ремонт (карточка)</p>
        <div className="space-y-4">
          <Field label="Заголовок">
            <Input
              value={draft.softwareNav.title}
              onChange={(e) =>
                setDraft({ ...draft, softwareNav: { ...draft.softwareNav, title: e.target.value } })
              }
            />
          </Field>
          <Field label="Ссылка">
            <Input
              value={draft.softwareNav.path}
              onChange={(e) =>
                setDraft({ ...draft, softwareNav: { ...draft.softwareNav, path: e.target.value } })
              }
            />
          </Field>
        </div>
      </AdminCard>

      <div className="space-y-6 mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6b7280] px-1">Карточки аппаратных услуг</p>
        {draft.serviceNav.map((item, idx) => (
          <AdminCard key={item.id}>
            <div className="space-y-4">
              <Field label="Заголовок">
                <Input value={item.title} onChange={(e) => updateNav(idx, { title: e.target.value })} />
              </Field>
              <Field label="Ссылка">
                <Input value={item.path} onChange={(e) => updateNav(idx, { path: e.target.value })} />
              </Field>
            </div>
          </AdminCard>
        ))}
      </div>

      <AdminCard className="mb-6">
        <p className="text-[13px] font-medium text-white mb-4">Главное меню (шапка)</p>
        <p className="text-[12px] text-[#6b7280] mb-4">
          Пункты после «Услуги». Калькулятор: <code className="text-[#84CC16]">/prise</code>
        </p>
        <div className="space-y-4">
          {(draft.headerLinks ?? []).map((link, idx) => (
            <div key={`${link.to}-${idx}`} className="grid sm:grid-cols-2 gap-4">
              <Field label="Текст">
                <Input value={link.label} onChange={(e) => updateHeader(idx, { label: e.target.value })} />
              </Field>
              <Field label="URL">
                <Input value={link.to} onChange={(e) => updateHeader(idx, { to: e.target.value })} />
              </Field>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard>
        <p className="text-[13px] font-medium text-white mb-4">Ссылки в футере «На сайте»</p>
        <div className="space-y-4">
          {draft.footerLinks.map((link, idx) => (
            <div key={link.to} className="grid sm:grid-cols-2 gap-4">
              <Field label="Текст">
                <Input value={link.label} onChange={(e) => updateFooter(idx, { label: e.target.value })} />
              </Field>
              <Field label="URL">
                <Input value={link.to} onChange={(e) => updateFooter(idx, { to: e.target.value })} />
              </Field>
            </div>
          ))}
        </div>
        <SaveBar onSave={save} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
