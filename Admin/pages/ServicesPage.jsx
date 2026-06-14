import React from 'react';
import { useAdminPageKey, useAdminPageLabel } from '../hooks/useAdminPageKey';
import { usePageDraft } from '../hooks/usePageCms';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';
import { PAGE_KEYS } from '../../src/data/cmsStore';
import { ICON_MAP } from '../../src/data/iconMap';
import { PageHeader, AdminCard, Field, Input, Textarea, Select, SaveBar } from '../components/ui';

const ICON_OPTIONS = Object.keys(ICON_MAP);

function ServiceEditor({ service, onChange }) {
  return (
    <div className="p-5 rounded-xl bg-[#0c0d10] border border-white/[0.06] space-y-4">
      <Field label="Иконка (Lucide)">
        <Select value={service.icon} onChange={(e) => onChange({ ...service, icon: e.target.value })}>
          {ICON_OPTIONS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Заголовок">
        <Input value={service.title} onChange={(e) => onChange({ ...service, title: e.target.value })} />
      </Field>
      <Field label="Описание">
        <Textarea value={service.desc} onChange={(e) => onChange({ ...service, desc: e.target.value })} rows={3} />
      </Field>
    </div>
  );
}

export default function ServicesPage() {
  const { draft, setDraft, save, reset, saved, isDirty, pageKey } = usePageDraft((p) => p.services);
  useUnsavedGuard(isDirty);
  const pageLabel = useAdminPageLabel(pageKey);
  const isSoftwarePage = pageKey === PAGE_KEYS.SOFTWARE_REPAIR;

  return (
    <>
      <PageHeader
        title={`Услуги — ${pageLabel}`}
        description={
          isSoftwarePage
            ? 'Только программные направления на /programmnyj-remont. Аппаратный ремонт — на главной.'
            : 'Программные услуги на главной странице.'
        }
      />
      <div className="space-y-8">
        <AdminCard>
          <h2 className="text-[15px] font-semibold text-[#84CC16] mb-4 font-mono uppercase tracking-wider">
            {isSoftwarePage ? 'Направления программного ремонта' : 'Программные услуги'}
          </h2>
          <div className="space-y-4">
            {draft.featured.map((service, idx) => (
              <ServiceEditor
                key={service.id}
                service={service}
                onChange={(next) => {
                  const featured = [...draft.featured];
                  featured[idx] = next;
                  setDraft({ ...draft, featured });
                }}
              />
            ))}
          </div>
        </AdminCard>
        {!isSoftwarePage && draft.standard?.length > 0 ? (
          <AdminCard>
            <h2 className="text-[15px] font-semibold text-[#84CC16] mb-4 font-mono uppercase tracking-wider">
              Аппаратные услуги (главная)
            </h2>
            <div className="space-y-4">
              {draft.standard.map((service, idx) => (
                <ServiceEditor
                  key={service.id}
                  service={service}
                  onChange={(next) => {
                    const standard = [...draft.standard];
                    standard[idx] = next;
                    setDraft({ ...draft, standard });
                  }}
                />
              ))}
            </div>
          </AdminCard>
        ) : null}
      </div>
      <AdminCard className="mt-6">
        <SaveBar onSave={() => save({ services: draft })} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
