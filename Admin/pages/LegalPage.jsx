import React, { useState } from 'react';
import { useSiteDraft } from '../hooks/useSiteDraft';
import { PageHeader, AdminCard, Field, Input, Textarea, ArrayLinesInput, SaveBar } from '../components/ui';

export default function LegalPage() {
  const { draft, setDraft, save, reset, saved } = useSiteDraft('legal');
  const [activeIdx, setActiveIdx] = useState(0);
  const doc = draft[activeIdx];

  const updateDoc = (patch) => {
    const next = [...draft];
    next[activeIdx] = { ...next[activeIdx], ...patch };
    setDraft(next);
  };

  const updateSection = (sIdx, patch) => {
    const sections = [...doc.sections];
    sections[sIdx] = { ...sections[sIdx], ...patch };
    updateDoc({ sections });
  };

  return (
    <>
      <PageHeader title="Правовые документы" description="Тексты страниц /legal/* и ссылки в футере." />

      <div className="flex flex-wrap gap-2 mb-6">
        {draft.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setActiveIdx(i)}
            className={`px-4 py-2 rounded-xl text-[13px] font-medium border transition-colors ${
              i === activeIdx
                ? 'bg-[#84CC16]/15 border-[#84CC16]/30 text-[#84CC16]'
                : 'border-white/[0.08] text-[#9ca3af] hover:text-white'
            }`}
          >
            {d.title}
          </button>
        ))}
      </div>

      <AdminCard className="mb-6">
        <div className="space-y-4">
          <Field label="Заголовок">
            <Input value={doc.title} onChange={(e) => updateDoc({ title: e.target.value })} />
          </Field>
          <Field label="Meta description">
            <Input
              value={doc.metaDescription}
              onChange={(e) => updateDoc({ metaDescription: e.target.value })}
            />
          </Field>
          <Field label="Дата обновления">
            <Input value={doc.updatedAt} onChange={(e) => updateDoc({ updatedAt: e.target.value })} />
          </Field>
        </div>
      </AdminCard>

      <div className="space-y-6">
        {doc.sections.map((section, sIdx) => (
          <AdminCard key={`${doc.id}-${section.heading}`}>
            <Field label="Заголовок раздела">
              <Input
                value={section.heading}
                onChange={(e) => updateSection(sIdx, { heading: e.target.value })}
              />
            </Field>
            <Field label="Абзацы" hint="Каждый абзац с новой строки">
              <Textarea
                rows={5}
                value={(section.paragraphs ?? []).join('\n\n')}
                onChange={(e) =>
                  updateSection(sIdx, {
                    paragraphs: e.target.value.split('\n\n').map((p) => p.trim()).filter(Boolean),
                  })
                }
              />
            </Field>
            {section.list ? (
              <Field label="Список" hint="Каждый пункт с новой строки">
                <ArrayLinesInput
                  value={section.list}
                  onChange={(list) => updateSection(sIdx, { list })}
                />
              </Field>
            ) : null}
          </AdminCard>
        ))}
      </div>

      <AdminCard className="mt-6">
        <SaveBar onSave={save} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
