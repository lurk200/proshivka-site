import React from 'react';
import { useAdminPageLabel } from '../hooks/useAdminPageKey';
import { usePageDraft } from '../hooks/usePageCms';
import { PageHeader, AdminCard, Field, Input, SaveBar } from '../components/ui';

const SECTION_KEYS = [
  { key: 'services', label: 'Услуги' },
  { key: 'portfolio', label: 'Кейсы' },
  { key: 'principles', label: 'О лаборатории' },
];

export default function SectionsPage() {
  const { draft, setDraft, save, reset, saved, pageKey } = usePageDraft((p) => p.sections);
  const pageLabel = useAdminPageLabel(pageKey);

  const updateSection = (key, patch) => {
    setDraft({ ...draft, [key]: { ...draft[key], ...patch } });
  };

  return (
    <>
      <PageHeader
        title={`Заголовки секций — ${pageLabel}`}
        description="Подписи блоков на странице /programmnyj-remont."
      />
      <div className="space-y-6">
        {SECTION_KEYS.map(({ key, label }) => (
          <AdminCard key={key}>
            <p className="text-[12px] font-mono text-[#84CC16] mb-4">{label}</p>
            <div className="space-y-4">
              <Field label="Подпись (eyebrow)">
                <Input
                  value={draft[key].eyebrow}
                  onChange={(e) => updateSection(key, { eyebrow: e.target.value })}
                />
              </Field>
              <Field label="Заголовок">
                <Input
                  value={draft[key].title}
                  onChange={(e) => updateSection(key, { title: e.target.value })}
                />
              </Field>
              {draft[key].subtitle !== undefined ? (
                <Field label="Описание">
                  <Input
                    value={draft[key].subtitle}
                    onChange={(e) => updateSection(key, { subtitle: e.target.value })}
                  />
                </Field>
              ) : null}
            </div>
          </AdminCard>
        ))}
      </div>
      <AdminCard className="mt-6">
        <SaveBar onSave={() => save({ sections: draft })} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
