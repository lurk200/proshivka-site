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

  const hero = draft.hero ?? {};
  const telemetry = hero.telemetry ?? {};
  const labels = hero.telemetryLabels ?? {};
  const sideCard = hero.sideCard ?? {};

  const setHero = (patch) => setDraft({ ...draft, hero: { ...hero, ...patch } });
  const setTelemetry = (patch) => setHero({ telemetry: { ...telemetry, ...patch } });
  const setLabels = (patch) => setHero({ telemetryLabels: { ...labels, ...patch } });
  const setSideCard = (patch) => setHero({ sideCard: { ...sideCard, ...patch } });

  return (
    <>
      <PageHeader
        title="Первый экран — Программный ремонт"
        description="Hero-блок на /programmnyj-remont: бейдж, заголовок, телеметрия и карточка Recovery mode."
      />
      <AdminCard>
        <div className="space-y-5">
          <Field label="Заголовок вкладки браузера">
            <Input
              value={draft.meta?.title ?? ''}
              onChange={(e) => setDraft({ ...draft, meta: { ...draft.meta, title: e.target.value } })}
            />
          </Field>

          <div className="border-t border-white/[0.06] pt-5 space-y-5">
            <Field label="Бейдж над заголовком">
              <Input
                value={hero.eyebrow ?? ''}
                onChange={(e) => setHero({ eyebrow: e.target.value })}
              />
            </Field>
            <Field label="Заголовок">
              <Input
                value={hero.title ?? ''}
                onChange={(e) => setHero({ title: e.target.value })}
              />
            </Field>
            <Field label="Подзаголовок">
              <Textarea
                value={hero.subtitle ?? ''}
                onChange={(e) => setHero({ subtitle: e.target.value })}
                rows={3}
              />
            </Field>
          </div>

          <div className="border-t border-white/[0.06] pt-5">
            <p className="text-[12px] font-mono text-[#84CC16] mb-4">Телеметрия</p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-3">
                <Field label="Подпись 1">
                  <Input
                    value={labels.status ?? ''}
                    onChange={(e) => setLabels({ status: e.target.value })}
                  />
                </Field>
                <Field label="Значение 1">
                  <Input
                    value={telemetry.status ?? ''}
                    onChange={(e) => setTelemetry({ status: e.target.value })}
                  />
                </Field>
              </div>
              <div className="space-y-3">
                <Field label="Подпись 2">
                  <Input
                    value={labels.diagTime ?? ''}
                    onChange={(e) => setLabels({ diagTime: e.target.value })}
                  />
                </Field>
                <Field label="Значение 2">
                  <Input
                    value={telemetry.diagTime ?? ''}
                    onChange={(e) => setTelemetry({ diagTime: e.target.value })}
                  />
                </Field>
              </div>
              <div className="space-y-3">
                <Field label="Подпись 3">
                  <Input
                    value={labels.successRate ?? ''}
                    onChange={(e) => setLabels({ successRate: e.target.value })}
                  />
                </Field>
                <Field label="Значение 3">
                  <Input
                    value={telemetry.successRate ?? ''}
                    onChange={(e) => setTelemetry({ successRate: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-5 space-y-4">
            <p className="text-[12px] font-mono text-[#84CC16]">Карточка справа (Recovery mode)</p>
            <Field label="Заголовок карточки">
              <Input
                value={sideCard.title ?? ''}
                onChange={(e) => setSideCard({ title: e.target.value })}
              />
            </Field>
            <Field label="Текст карточки">
              <Textarea
                value={sideCard.subtitle ?? ''}
                onChange={(e) => setSideCard({ subtitle: e.target.value })}
                rows={2}
              />
            </Field>
          </div>
        </div>
        <SaveBar
          onSave={() => save((page) => ({ ...page, meta: draft.meta, hero: draft.hero }))}
          onReset={reset}
          saved={saved}
        />
      </AdminCard>
    </>
  );
}
