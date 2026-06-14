import React from 'react';
import { useAdminPageLabel } from '../hooks/useAdminPageKey';
import { usePageDraft } from '../hooks/usePageCms';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';
import { ICON_MAP } from '../../src/data/iconMap';
import { PageHeader, AdminCard, Field, Input, Textarea, Select, SaveBar } from '../components/ui';

const ICON_OPTIONS = Object.keys(ICON_MAP);

export default function PrinciplesPage() {
  const { draft, setDraft, save, reset, saved, isDirty, pageKey } = usePageDraft((p) => p.principles);
  useUnsavedGuard(isDirty);
  const pageLabel = useAdminPageLabel(pageKey);

  return (
    <>
      <PageHeader title={`О лаборатории — ${pageLabel}`} description="Блок «О нас» на /programmnyj-remont." />
      <div className="space-y-4">
        {draft.map((item, idx) => (
          <AdminCard key={item.id}>
            <div className="space-y-4">
              <Field label="Иконка">
                <Select
                  value={item.icon}
                  onChange={(e) => {
                    const next = [...draft];
                    next[idx] = { ...next[idx], icon: e.target.value };
                    setDraft(next);
                  }}
                >
                  {ICON_OPTIONS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Заголовок">
                <Input
                  value={item.title}
                  onChange={(e) => {
                    const next = [...draft];
                    next[idx] = { ...next[idx], title: e.target.value };
                    setDraft(next);
                  }}
                />
              </Field>
              <Field label="Описание">
                <Textarea
                  value={item.desc}
                  onChange={(e) => {
                    const next = [...draft];
                    next[idx] = { ...next[idx], desc: e.target.value };
                    setDraft(next);
                  }}
                  rows={3}
                />
              </Field>
            </div>
          </AdminCard>
        ))}
      </div>
      <AdminCard className="mt-6">
        <SaveBar onSave={() => save({ principles: draft })} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
