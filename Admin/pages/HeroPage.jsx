import React from 'react';
import { usePageDraft } from '../hooks/usePageCms';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';
import { PageHeader, AdminCard, Field, Input, Textarea, SaveBar } from '../components/ui';

export default function HeroPage() {
  const { draft, setDraft, save, reset, saved, isDirty } = usePageDraft((p) => ({
    meta: p.meta,
    hero: p.hero,
  }));
  useUnsavedGuard(isDirty);

  const handleSave = () => {
    save((page) => ({ ...page, meta: draft.meta, hero: draft.hero }));
  };

  const handleReset = () => {
    reset();
  };

  return (
    <>
      <PageHeader
        title="Первый экран — Программный ремонт"
        description="Hero-блок на странице /programmnyj-remont. Главная сайта (/) настраивается в разделе «Главная /»."
      />
      <AdminCard>
        <div className="space-y-5">
          <Field label="Заголовок вкладки браузера">
            <Input
              value={draft.meta.title}
              onChange={(e) => setDraft({ ...draft, meta: { ...draft.meta, title: e.target.value } })}
            />
          </Field>
          <Field label="Рейтинг в блоке отзывов">
            <Input
              value={draft.meta.rating}
              onChange={(e) => setDraft({ ...draft, meta: { ...draft.meta, rating: e.target.value } })}
            />
          </Field>
          <div className="border-t border-white/[0.06] pt-5">
            <Field label="Заголовок hero">
              <Input value={draft.hero.title} onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, title: e.target.value } })} />
            </Field>
          </div>
          <Field label="Подзаголовок">
            <Textarea value={draft.hero.subtitle} onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, subtitle: e.target.value } })} rows={3} />
          </Field>
          <Field label="URL изображения hero">
            <Input
              value={draft.hero.imageUrl ?? ''}
              onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, imageUrl: e.target.value } })}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Кнопка 1">
              <Input
                value={draft.hero.primaryButton ?? ''}
                onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, primaryButton: e.target.value } })}
              />
            </Field>
            <Field label="Кнопка 2">
              <Input
                value={draft.hero.secondaryButton ?? ''}
                onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, secondaryButton: e.target.value } })}
              />
            </Field>
          </div>
          <Field label="Теги" hint="Через запятую">
            <Input
              value={draft.hero.tags.join(', ')}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  hero: {
                    ...draft.hero,
                    tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                  },
                })
              }
            />
          </Field>
          <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-white/[0.06]">
            <Field label="Статус системы">
              <Input
                value={draft.hero.telemetry.status}
                onChange={(e) =>
                  setDraft({ ...draft, hero: { ...draft.hero, telemetry: { ...draft.hero.telemetry, status: e.target.value } } })
                }
              />
            </Field>
            <Field label="Время диагностики">
              <Input
                value={draft.hero.telemetry.diagTime}
                onChange={(e) =>
                  setDraft({ ...draft, hero: { ...draft.hero, telemetry: { ...draft.hero.telemetry, diagTime: e.target.value } } })
                }
              />
            </Field>
            <Field label="Успешность">
              <Input
                value={draft.hero.telemetry.successRate}
                onChange={(e) =>
                  setDraft({ ...draft, hero: { ...draft.hero, telemetry: { ...draft.hero.telemetry, successRate: e.target.value } } })
                }
              />
            </Field>
          </div>
        </div>
        <SaveBar onSave={handleSave} onReset={handleReset} saved={saved} />
      </AdminCard>
    </>
  );
}
