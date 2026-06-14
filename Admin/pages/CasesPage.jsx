import React from 'react';
import { useAdminPageLabel } from '../hooks/useAdminPageKey';
import { usePageDraft } from '../hooks/usePageCms';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';
import { PageHeader, AdminCard, Field, Input, Textarea, SaveBar } from '../components/ui';

export default function CasesPage() {
  const { draft, setDraft, save, reset, saved, isDirty, pageKey } = usePageDraft((p) => p.portfolio);
  useUnsavedGuard(isDirty);
  const pageLabel = useAdminPageLabel(pageKey);

  const updateCase = (idx, patch) => {
    const next = [...draft];
    next[idx] = { ...next[idx], ...patch };
    setDraft(next);
  };

  return (
    <>
      <PageHeader title={`Кейсы — ${pageLabel}`} description="Портфолио на странице /programmnyj-remont." />
      <div className="space-y-6">
        {draft.map((item, idx) => (
          <AdminCard key={item.id}>
            <p className="text-[12px] font-mono text-[#84CC16] mb-4">{item.id}</p>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Модель">
                  <Input value={item.model} onChange={(e) => updateCase(idx, { model: e.target.value })} />
                </Field>
                <Field label="Категория">
                  <Input value={item.category} onChange={(e) => updateCase(idx, { category: e.target.value })} />
                </Field>
              </div>
              <Field label="Проблема">
                <Input value={item.problem} onChange={(e) => updateCase(idx, { problem: e.target.value })} />
              </Field>
              <Field label="Заголовок кейса">
                <Input value={item.title} onChange={(e) => updateCase(idx, { title: e.target.value })} />
              </Field>
              <Field label="Описание">
                <Textarea value={item.desc} onChange={(e) => updateCase(idx, { desc: e.target.value })} rows={4} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Статус">
                  <Input value={item.status} onChange={(e) => updateCase(idx, { status: e.target.value })} />
                </Field>
                <Field label="Данные">
                  <Input value={item.dataSaved} onChange={(e) => updateCase(idx, { dataSaved: e.target.value })} />
                </Field>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
      <AdminCard className="mt-6">
        <SaveBar onSave={() => save({ portfolio: draft })} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
