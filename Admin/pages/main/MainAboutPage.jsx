import React from 'react';
import { useSiteDraft } from '../../hooks/useSiteDraft';
import { PageHeader, AdminCard, Field, Input, SaveBar } from '../../components/ui';

export default function MainAboutPage() {
  const { draft, setDraft, save, reset, saved } = useSiteDraft('mainHome');
  const about = draft.about;

  const setAbout = (patch) => setDraft({ ...draft, about: { ...about, ...patch } });

  return (
    <>
      <PageHeader title="О нас" description="Секция «О нас» на главной: текст, фото и карта." />
      <AdminCard>
        <div className="space-y-5">
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
            <Field label="Embed URL (iframe)">
              <Input
                value={about.yandexMap.embedUrl}
                onChange={(e) =>
                  setAbout({ yandexMap: { ...about.yandexMap, embedUrl: e.target.value } })
                }
              />
            </Field>
            <Field label="Ссылка «Маршрут»">
              <Input
                value={about.yandexMap.openUrl}
                onChange={(e) =>
                  setAbout({ yandexMap: { ...about.yandexMap, openUrl: e.target.value } })
                }
              />
            </Field>
          </div>
        </div>
        <SaveBar onSave={save} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
