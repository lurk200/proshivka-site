import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSiteDraft } from '../hooks/useSiteDraft';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';
import {
  PageHeader,
  AdminCard,
  AdminTabs,
  Field,
  Input,
  Textarea,
  ArrayLinesInput,
  SaveBar,
  PreviewLink,
} from '../components/ui';

const TABS = [
  { id: 'hero', label: 'Hero' },
  { id: 'ways', label: 'Способы' },
  { id: 'steps', label: 'Шаги' },
  { id: 'before', label: 'Перед отправкой' },
  { id: 'faq', label: 'FAQ' },
  { id: 'sections', label: 'Заголовки и CTA' },
];

function patchSection(setDraft, draft, key, patch) {
  setDraft({ ...draft, [key]: { ...draft[key], ...patch } });
}

export default function SendRepairEditorPage() {
  const { draft, setDraft, save, reset, saved, isDirty } = useSiteDraft('sendRepair');
  useUnsavedGuard(isDirty);
  const [tab, setTab] = useState('hero');

  const setHero = (patch) => patchSection(setDraft, draft, 'hero', patch);
  const setOnsite = (patch) => patchSection(setDraft, draft, 'onsite', patch);
  const setCity = (patch) => patchSection(setDraft, draft, 'cityDelivery', patch);
  const setRegions = (patch) => setDraft({ ...draft, regions: { ...draft.regions, ...patch } });
  const setBefore = (patch) => patchSection(setDraft, draft, 'beforeSend', patch);
  const setRegionsSection = (patch) => patchSection(setDraft, draft, 'regionsSection', patch);
  const setContactsSection = (patch) => patchSection(setDraft, draft, 'contactsSection', patch);
  const setFaqSection = (patch) => patchSection(setDraft, draft, 'faqSection', patch);
  const setBottomCta = (patch) => patchSection(setDraft, draft, 'bottomCta', patch);

  const updateStep = (idx, patch) => {
    const steps = [...draft.regions.steps];
    steps[idx] = { ...steps[idx], ...patch };
    setRegions({ steps });
  };

  const addStep = () => {
    setRegions({
      steps: [...draft.regions.steps, { title: 'Новый шаг', text: '' }],
    });
  };

  const removeStep = (idx) => {
    setRegions({ steps: draft.regions.steps.filter((_, i) => i !== idx) });
  };

  const updateFaq = (idx, patch) => {
    const faq = [...draft.faq];
    faq[idx] = { ...faq[idx], ...patch };
    setDraft({ ...draft, faq });
  };

  const addFaq = () => {
    setDraft({
      ...draft,
      faq: [...draft.faq, { question: 'Новый вопрос', answer: '' }],
    });
  };

  const removeFaq = (idx) => {
    setDraft({ ...draft, faq: draft.faq.filter((_, i) => i !== idx) });
  };

  return (
    <>
      <PageHeader
        title="Отправить в ремонт"
        description="Тексты страницы /otpravit-v-remont. Адрес, карта и мессенджеры — в разделе «Компания» и «О нас и карта». Meta title/description — в SEO."
        actions={<PreviewLink href="/otpravit-v-remont" />}
      />

      <AdminTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'hero' ? (
        <AdminCard>
          <div className="space-y-4">
            <Field label="Бейдж над заголовком">
              <Input value={draft.hero.eyebrow} onChange={(e) => setHero({ eyebrow: e.target.value })} />
            </Field>
            <Field label="Заголовок H1">
              <Input value={draft.hero.title} onChange={(e) => setHero({ title: e.target.value })} />
            </Field>
            <Field label="Подзаголовок">
              <Textarea
                rows={4}
                value={draft.hero.subtitle}
                onChange={(e) => setHero({ subtitle: e.target.value })}
              />
            </Field>
          </div>
        </AdminCard>
      ) : null}

      {tab === 'ways' ? (
        <div className="space-y-6">
          <AdminCard>
            <p className="text-[13px] font-medium text-white mb-4">Приехать в сервис</p>
            <div className="space-y-4">
              <Field label="Заголовок карточки">
                <Input value={draft.onsite.title} onChange={(e) => setOnsite({ title: e.target.value })} />
              </Field>
              <Field label="Описание">
                <Textarea
                  rows={3}
                  value={draft.onsite.description}
                  onChange={(e) => setOnsite({ description: e.target.value })}
                />
              </Field>
            </div>
          </AdminCard>

          <AdminCard>
            <p className="text-[13px] font-medium text-white mb-4">Доставка по Ставрополю</p>
            <div className="space-y-4">
              <Field label="Бейдж на карточке">
                <Input
                  value={draft.cityDelivery.badge}
                  onChange={(e) => setCity({ badge: e.target.value })}
                />
              </Field>
              <Field label="Заголовок">
                <Input
                  value={draft.cityDelivery.title}
                  onChange={(e) => setCity({ title: e.target.value })}
                />
              </Field>
              <Field label="Описание">
                <Textarea
                  rows={3}
                  value={draft.cityDelivery.description}
                  onChange={(e) => setCity({ description: e.target.value })}
                />
              </Field>
              <Field label="Пункты списка" hint="Каждый пункт с новой строки">
                <ArrayLinesInput
                  value={draft.cityDelivery.highlights}
                  onChange={(highlights) => setCity({ highlights })}
                />
              </Field>
            </div>
          </AdminCard>

          <AdminCard>
            <p className="text-[13px] font-medium text-white mb-4">Отправка из регионов (карточка)</p>
            <div className="space-y-4">
              <Field label="Заголовок">
                <Input
                  value={draft.regions.title}
                  onChange={(e) => setRegions({ title: e.target.value })}
                />
              </Field>
              <Field label="Описание">
                <Textarea
                  rows={3}
                  value={draft.regions.description}
                  onChange={(e) => setRegions({ description: e.target.value })}
                />
              </Field>
              <Field label="Ссылка «Яндекс Доставка»">
                <Input
                  value={draft.regions.yandexDeliveryUrl}
                  onChange={(e) => setRegions({ yandexDeliveryUrl: e.target.value })}
                  placeholder="https://dostavka.yandex.ru/"
                />
              </Field>
            </div>
          </AdminCard>
        </div>
      ) : null}

      {tab === 'steps' ? (
        <div className="space-y-4">
          <AdminCard>
            <div className="space-y-4">
              <Field label="Примечание про Почту России">
                <Textarea
                  rows={2}
                  value={draft.regions.postNote}
                  onChange={(e) => setRegions({ postNote: e.target.value })}
                />
              </Field>
            </div>
          </AdminCard>

          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#6b7280]">Шаги</p>
            <button
              type="button"
              onClick={addStep}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#84CC16]/30 px-3 py-1.5 text-[12px] font-medium text-[#84CC16] hover:bg-[#84CC16]/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить шаг
            </button>
          </div>

          {draft.regions.steps.map((step, idx) => (
            <AdminCard key={`step-${idx}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <span className="font-mono text-[12px] text-[#6b7280]">Шаг {idx + 1}</span>
                {draft.regions.steps.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="inline-flex items-center gap-1 text-[12px] text-red-300 hover:text-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Удалить
                  </button>
                ) : null}
              </div>
              <div className="space-y-4">
                <Field label="Заголовок">
                  <Input value={step.title} onChange={(e) => updateStep(idx, { title: e.target.value })} />
                </Field>
                <Field label="Текст">
                  <Textarea
                    rows={3}
                    value={step.text}
                    onChange={(e) => updateStep(idx, { text: e.target.value })}
                  />
                </Field>
              </div>
            </AdminCard>
          ))}
        </div>
      ) : null}

      {tab === 'before' ? (
        <AdminCard>
          <div className="space-y-4">
            <Field label="Заголовок блока">
              <Input
                value={draft.beforeSend.title}
                onChange={(e) => setBefore({ title: e.target.value })}
              />
            </Field>
            <Field label="Чеклист" hint="Каждый пункт с новой строки">
              <ArrayLinesInput
                value={draft.beforeSend.items}
                onChange={(items) => setBefore({ items })}
                rows={6}
              />
            </Field>
          </div>
        </AdminCard>
      ) : null}

      {tab === 'faq' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#6b7280]">Вопросы</p>
            <button
              type="button"
              onClick={addFaq}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#84CC16]/30 px-3 py-1.5 text-[12px] font-medium text-[#84CC16] hover:bg-[#84CC16]/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить вопрос
            </button>
          </div>

          {draft.faq.map((item, idx) => (
            <AdminCard key={`faq-${idx}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <span className="font-mono text-[12px] text-[#6b7280]">#{idx + 1}</span>
                {draft.faq.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeFaq(idx)}
                    className="inline-flex items-center gap-1 text-[12px] text-red-300 hover:text-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Удалить
                  </button>
                ) : null}
              </div>
              <div className="space-y-4">
                <Field label="Вопрос">
                  <Input
                    value={item.question}
                    onChange={(e) => updateFaq(idx, { question: e.target.value })}
                  />
                </Field>
                <Field label="Ответ">
                  <Textarea
                    rows={3}
                    value={item.answer}
                    onChange={(e) => updateFaq(idx, { answer: e.target.value })}
                  />
                </Field>
              </div>
            </AdminCard>
          ))}
        </div>
      ) : null}

      {tab === 'sections' ? (
        <div className="space-y-6">
          <AdminCard>
            <p className="text-[13px] font-medium text-white mb-4">Блок «Как отправить»</p>
            <div className="space-y-4">
              <Field label="Подпись (eyebrow)">
                <Input
                  value={draft.regionsSection?.eyebrow ?? ''}
                  onChange={(e) => setRegionsSection({ eyebrow: e.target.value })}
                />
              </Field>
              <Field label="Заголовок">
                <Input
                  value={draft.regionsSection?.title ?? ''}
                  onChange={(e) => setRegionsSection({ title: e.target.value })}
                />
              </Field>
            </div>
          </AdminCard>

          <AdminCard>
            <p className="text-[13px] font-medium text-white mb-4">Блок контактов</p>
            <div className="space-y-4">
              <Field label="Подпись (eyebrow)">
                <Input
                  value={draft.contactsSection?.eyebrow ?? ''}
                  onChange={(e) => setContactsSection({ eyebrow: e.target.value })}
                />
              </Field>
              <Field label="Заголовок">
                <Input
                  value={draft.contactsSection?.title ?? ''}
                  onChange={(e) => setContactsSection({ title: e.target.value })}
                />
              </Field>
            </div>
          </AdminCard>

          <AdminCard>
            <p className="text-[13px] font-medium text-white mb-4">FAQ и нижний CTA</p>
            <div className="space-y-4">
              <Field label="Заголовок FAQ">
                <Input
                  value={draft.faqSection?.title ?? ''}
                  onChange={(e) => setFaqSection({ title: e.target.value })}
                />
              </Field>
              <Field label="CTA — заголовок">
                <Input
                  value={draft.bottomCta?.title ?? ''}
                  onChange={(e) => setBottomCta({ title: e.target.value })}
                />
              </Field>
              <Field label="CTA — текст">
                <Textarea
                  rows={3}
                  value={draft.bottomCta?.subtitle ?? ''}
                  onChange={(e) => setBottomCta({ subtitle: e.target.value })}
                />
              </Field>
            </div>
          </AdminCard>
        </div>
      ) : null}

      <AdminCard className="mt-6">
        <SaveBar onSave={save} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
