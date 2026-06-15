import React from 'react';
import { useSiteDraft } from '../../hooks/useSiteDraft';
import { useUnsavedGuard } from '../../hooks/useUnsavedGuard';
import { PageHeader, AdminCard, Field, Input, SaveBar } from '../../components/ui';

export default function MainAboutPage() {
  const { draft, setDraft, save, reset, saved, saving, saveError, isDirty } = useSiteDraft('mainHome');
  useUnsavedGuard(isDirty);
  const about = draft.about;

  const setAbout = (patch) => setDraft({ ...draft, about: { ...about, ...patch } });

  return (
    <>
      <PageHeader title="О нас" description="Секция «О нас» на главной: текст, фото и карта." />
      <AdminCard>
        <div className="space-y-5">
          <Field label="Ярлык над заголовком (eyebrow)" hint="Оставьте пустым — ярлык не отображается">
            <Input
              value={about.eyebrow ?? ''}
              onChange={(e) => setAbout({ eyebrow: e.target.value })}
              placeholder="Пусто — ярлык скрыт"
            />
          </Field>
          <Field label="Заголовок">
            <Input value={about.title} onChange={(e) => setAbout({ title: e.target.value })} />
          </Field>
          <Field label="Подзаголовок">
            <Input value={about.subtitle} onChange={(e) => setAbout({ subtitle: e.target.value })} />
          </Field>
          <div className="border-t border-white/[0.06] pt-5 space-y-4">
            <p className="text-[13px] font-medium text-white">Фото сервиса</p>
            <Field label="URL фото">
              <Input
                value={about.servicePhoto.src}
                onChange={(e) =>
                  setAbout({ servicePhoto: { ...about.servicePhoto, src: e.target.value } })
                }
              />
            </Field>
            <Field label="Alt-текст">
              <Input
                value={about.servicePhoto.alt}
                onChange={(e) =>
                  setAbout({ servicePhoto: { ...about.servicePhoto, alt: e.target.value } })
                }
              />
            </Field>
          </div>
          <div className="border-t border-white/[0.06] pt-5 space-y-4">
            <p className="text-[13px] font-medium text-white">Яндекс.Карты</p>
            <Field
              label="Embed URL (iframe)"
              hint="Формат: https://yandex.ru/map-widget/v1/?ll=41.916583,45.019395&z=16&ol=biz&oid=120325503052 — параметры ol=biz&oid= показывают карточку организации. Ссылки /maps/org/ в iframe заблокированы."
            >
              <Input
                value={about.yandexMap.embedUrl}
                onChange={(e) =>
                  setAbout({ yandexMap: { ...about.yandexMap, embedUrl: e.target.value } })
                }
                placeholder="https://yandex.ru/map-widget/v1/?ll=41.916583,45.019395&z=16&ol=biz&oid=120325503052"
              />
            </Field>
            <Field label="Кнопка «Построить маршрут»">
              <Input
                value={about.yandexMap.openUrl}
                onChange={(e) =>
                  setAbout({ yandexMap: { ...about.yandexMap, openUrl: e.target.value } })
                }
                placeholder="https://yandex.ru/maps/org/proshivka/..."
              />
            </Field>
            <Field label="Карточка организации">
              <Input
                value={about.yandexMap.orgUrl ?? ''}
                onChange={(e) =>
                  setAbout({ yandexMap: { ...about.yandexMap, orgUrl: e.target.value } })
                }
                placeholder="https://yandex.ru/maps/org/..."
              />
            </Field>
          </div>
        </div>
        <SaveBar onSave={save} onReset={reset} saved={saved} saving={saving} saveError={saveError} />
      </AdminCard>
    </>
  );
}
