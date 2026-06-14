import React from 'react';
import { useSiteDraft } from '../hooks/useSiteDraft';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';
import { PageHeader, AdminCard, Field, Input, Textarea, SaveBar } from '../components/ui';

export default function ServiceTemplatePage() {
  const { draft, setDraft, save, reset, saved, isDirty } = useSiteDraft('serviceTemplate');
  useUnsavedGuard(isDirty);

  const updateProcess = (idx, patch) => {
    const process = [...draft.process];
    process[idx] = { ...process[idx], ...patch };
    setDraft({ ...draft, process });
  };

  const updateFaq = (idx, patch) => {
    const faq = [...draft.faq];
    faq[idx] = { ...faq[idx], ...patch };
    setDraft({ ...draft, faq });
  };

  return (
    <>
      <PageHeader
        title="Шаблон страницы услуги"
        description="Общие блоки: процесс, FAQ и нижний CTA (для страниц на ServicePageTemplate)."
      />

      <AdminCard className="mb-6">
        <p className="text-[13px] font-medium text-white mb-4">Нижний CTA</p>
        <div className="space-y-4">
          <Field label="Заголовок">
            <Input
              value={draft.bottomCta.title}
              onChange={(e) =>
                setDraft({ ...draft, bottomCta: { ...draft.bottomCta, title: e.target.value } })
              }
            />
          </Field>
          <Field label="Подзаголовок">
            <Textarea
              rows={3}
              value={draft.bottomCta.subtitle}
              onChange={(e) =>
                setDraft({ ...draft, bottomCta: { ...draft.bottomCta, subtitle: e.target.value } })
              }
            />
          </Field>
          <Field label="Кнопка Telegram">
            <Input
              value={draft.bottomCta.telegramLabel}
              onChange={(e) =>
                setDraft({ ...draft, bottomCta: { ...draft.bottomCta, telegramLabel: e.target.value } })
              }
            />
          </Field>
          <Field label="Кнопка заявки">
            <Input
              value={draft.bottomCta.siteLabel}
              onChange={(e) =>
                setDraft({ ...draft, bottomCta: { ...draft.bottomCta, siteLabel: e.target.value } })
              }
            />
          </Field>
        </div>
      </AdminCard>

      <div className="space-y-6 mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6b7280] px-1">Процесс работы</p>
        {draft.process.map((step, idx) => (
          <AdminCard key={step.title}>
            <div className="space-y-4">
              <Field label="Иконка (имя Lucide)">
                <Input value={step.icon} onChange={(e) => updateProcess(idx, { icon: e.target.value })} />
              </Field>
              <Field label="Заголовок">
                <Input value={step.title} onChange={(e) => updateProcess(idx, { title: e.target.value })} />
              </Field>
              <Field label="Описание">
                <Input value={step.desc} onChange={(e) => updateProcess(idx, { desc: e.target.value })} />
              </Field>
            </div>
          </AdminCard>
        ))}
      </div>

      <div className="space-y-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6b7280] px-1">FAQ</p>
        {draft.faq.map((item, idx) => (
          <AdminCard key={item.question}>
            <div className="space-y-4">
              <Field label="Вопрос">
                <Input value={item.question} onChange={(e) => updateFaq(idx, { question: e.target.value })} />
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

      <AdminCard className="mt-6">
        <SaveBar onSave={save} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
