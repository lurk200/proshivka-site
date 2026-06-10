import React from 'react';
import { useSiteDraft } from '../../hooks/useSiteDraft';
import { PageHeader, AdminCard, Field, Input, SaveBar } from '../../components/ui';

export default function MainSeoPage() {
  const { draft, setDraft, save, reset, saved } = useSiteDraft('mainHome');

  return (
    <>
      <PageHeader title="SEO главной" description="Мета-описание для страницы /." />
      <AdminCard>
        <Field label="Meta description">
          <Input
            value={draft.seo.description}
            onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, description: e.target.value } })}
          />
        </Field>
        <SaveBar onSave={save} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
