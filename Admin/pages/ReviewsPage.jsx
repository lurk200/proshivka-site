import React from 'react';
import { useAdminPageLabel } from '../hooks/useAdminPageKey';
import { usePageDraft } from '../hooks/usePageCms';
import { PageHeader, AdminCard, Field, Input, Textarea, SaveBar } from '../components/ui';

export default function ReviewsPage() {
  const { draft, setDraft, save, reset, saved, pageKey } = usePageDraft((p) => p.reviews);
  const pageLabel = useAdminPageLabel(pageKey);

  const updateReview = (idx, patch) => {
    const next = [...draft];
    next[idx] = { ...next[idx], ...patch };
    setDraft(next);
  };

  return (
    <>
      <PageHeader title={`Отзывы — ${pageLabel}`} description="Отзывы на странице /programmnyj-remont." />
      <div className="space-y-6">
        {draft.map((review, idx) => (
          <AdminCard key={review.id}>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Имя">
                  <Input value={review.name} onChange={(e) => updateReview(idx, { name: e.target.value })} />
                </Field>
                <Field label="Устройство">
                  <Input value={review.model} onChange={(e) => updateReview(idx, { model: e.target.value })} />
                </Field>
              </div>
              <Field label="Текст отзыва">
                <Textarea value={review.text} onChange={(e) => updateReview(idx, { text: e.target.value })} rows={4} />
              </Field>
              <Field label="Рейтинг (1–5)">
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={review.rating}
                  onChange={(e) => updateReview(idx, { rating: Number(e.target.value) })}
                />
              </Field>
            </div>
          </AdminCard>
        ))}
      </div>
      <AdminCard className="mt-6">
        <SaveBar onSave={() => save({ reviews: draft })} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
