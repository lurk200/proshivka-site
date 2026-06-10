import React from 'react';
import { useAdminPageLabel } from '../hooks/useAdminPageKey';
import { usePageDraft } from '../hooks/usePageCms';
import { PageHeader, AdminCard, Field, Input, Textarea, SaveBar } from '../components/ui';

export default function CtaPage() {
  const { draft, setDraft, save, reset, saved, pageKey } = usePageDraft((p) => p.cta);
  const pageLabel = useAdminPageLabel(pageKey);

  return (
    <>
      <PageHeader title={`Блок CTA — ${pageLabel}`} description="Призыв к действию внизу /programmnyj-remont." />
      <AdminCard>
        <div className="space-y-5">
          <Field label="Заголовок">
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </Field>
          <Field label="Текст">
            <Textarea value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} rows={4} />
          </Field>
          <Field label="Кнопка">
            <Input value={draft.buttonLabel} onChange={(e) => setDraft({ ...draft, buttonLabel: e.target.value })} />
          </Field>
        </div>
        <SaveBar onSave={() => save({ cta: draft })} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
