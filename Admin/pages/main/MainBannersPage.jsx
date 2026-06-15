import React from 'react';
import { useSiteDraft } from '../../hooks/useSiteDraft';
import { useUnsavedGuard } from '../../hooks/useUnsavedGuard';
import { PageHeader, AdminCard, Field, Input, ArrayLinesInput, SaveBar, PreviewLink } from '../../components/ui';

function clampPercent(value, fallback = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, n));
}

function GradientSlider({ label, hint, value, onChange }) {
  const v = clampPercent(value, 100);
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={0}
          max={100}
          value={v}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-[#84CC16]"
        />
        <span className="w-11 shrink-0 text-right font-mono text-[13px] tabular-nums text-[#9ca3af]">
          {v}%
        </span>
      </div>
    </Field>
  );
}

export default function MainBannersPage() {
  const { draft, setDraft, save, reset, saved, isDirty } = useSiteDraft('mainHome');
  useUnsavedGuard(isDirty);
  const gradient = draft.bannersSection.gradient ?? {
    bottomFade: 100,
    heroOverlay: 100,
    imageOpacity: 100,
  };

  const setGradient = (patch) =>
    setDraft({
      ...draft,
      bannersSection: {
        ...draft.bannersSection,
        gradient: { ...gradient, ...patch },
      },
    });

  const updateBanner = (idx, patch) => {
    const banners = [...draft.banners];
    banners[idx] = { ...banners[idx], ...patch };
    setDraft({ ...draft, banners });
  };

  return (
    <>
      <PageHeader
        title="Баннеры услуг"
        description="Карточки на главной странице сайта (маршрут /)."
        actions={<PreviewLink href="/" label="Открыть главную" />}
      />
      <AdminCard className="mb-6">
        <p className="text-[13px] font-medium text-white mb-4">Градиент на карточках</p>
        <div className="space-y-5">
          <GradientSlider
            label="Нижний градиент (читаемость текста)"
            hint="0 — почти без подложки, 100 — сильное осветление снизу, как по умолчанию"
            value={gradient.bottomFade}
            onChange={(bottomFade) => setGradient({ bottomFade })}
          />
          <GradientSlider
            label="Затемнение hero-градиента"
            hint="Наложение var(--hero-gradient) поверх фото"
            value={gradient.heroOverlay}
            onChange={(heroOverlay) => setGradient({ heroOverlay })}
          />
          <GradientSlider
            label="Яркость фото"
            hint="0 — бледное фото, 100 — как в теме сайта (светлая/тёмная)"
            value={gradient.imageOpacity}
            onChange={(imageOpacity) => setGradient({ imageOpacity })}
          />
        </div>
      </AdminCard>

      <AdminCard className="mb-6">
        <div className="space-y-4">
          <Field label="Ярлык секции (над описанием)" hint="Пусто — ярлык не отображается">
            <Input
              value={draft.bannersSection.eyebrow ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, bannersSection: { ...draft.bannersSection, eyebrow: e.target.value } })
              }
              placeholder="Пусто — ярлык скрыт"
            />
          </Field>
          <Field label="Ярлык карточки (над названием услуги)" hint="Общий для всех карточек. Пусто — ярлык не отображается">
            <Input
              value={draft.bannersSection.cardEyebrow ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, bannersSection: { ...draft.bannersSection, cardEyebrow: e.target.value } })
              }
              placeholder="Пусто — ярлык скрыт"
            />
          </Field>
          <Field label="Описание секции">
            <Input
              value={draft.bannersSection.subtitle}
              onChange={(e) =>
                setDraft({ ...draft, bannersSection: { ...draft.bannersSection, subtitle: e.target.value } })
              }
            />
          </Field>
        </div>
      </AdminCard>

      <div className="space-y-6">
        {draft.banners.map((banner, idx) => (
          <AdminCard key={banner.id}>
            <p className="text-[12px] font-mono text-[#84CC16] mb-4">{banner.id}</p>
            <div className="space-y-4">
              <Field label="Заголовок">
                <Input value={banner.title} onChange={(e) => updateBanner(idx, { title: e.target.value })} />
              </Field>
              <Field label="Описание">
                <Input
                  value={banner.description}
                  onChange={(e) => updateBanner(idx, { description: e.target.value })}
                />
              </Field>
              <Field label="Преимущества" hint="Каждый пункт с новой строки">
                <ArrayLinesInput
                  value={banner.advantages}
                  onChange={(advantages) => updateBanner(idx, { advantages })}
                />
              </Field>
              <Field label="URL изображения">
                <Input value={banner.image} onChange={(e) => updateBanner(idx, { image: e.target.value })} />
              </Field>
              <Field label="Ссылка (path)">
                <Input value={banner.path} onChange={(e) => updateBanner(idx, { path: e.target.value })} />
              </Field>
            </div>
          </AdminCard>
        ))}
      </div>

      <AdminCard className="mt-6">
        <SaveBar onSave={save} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
