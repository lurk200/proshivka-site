import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { usePageDraft } from '../hooks/usePageCms';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';
import { PageHeader, AdminCard, Field, Input, Textarea, SaveBar } from '../components/ui';

export default function SymptomsPage() {
  const { draft, setDraft, save, reset, saved, isDirty } = usePageDraft((p) => ({
    section: p.sections?.symptoms ?? { eyebrow: '', title: '' },
    items: Array.isArray(p.symptoms) ? p.symptoms : [],
  }));
  useUnsavedGuard(isDirty);

  const section = draft.section ?? { eyebrow: '', title: '' };
  const items = draft.items ?? [];

  const setSection = (patch) => setDraft({ ...draft, section: { ...section, ...patch } });

  const updateItem = (idx, patch) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    setDraft({ ...draft, items: next });
  };

  const addItem = () => {
    setDraft({
      ...draft,
      items: [
        ...items,
        {
          id: `sym-${Date.now()}`,
          icon: 'Terminal',
          title: 'Новый сбой',
          desc: '',
        },
      ],
    });
  };

  const removeItem = (idx) => {
    setDraft({ ...draft, items: items.filter((_, i) => i !== idx) });
  };

  const handleSave = () =>
    save((page) => ({
      ...page,
      sections: {
        ...page.sections,
        symptoms: section,
      },
      symptoms: items,
    }));

  return (
    <>
      <PageHeader
        title="Типовые программные сбои"
        description="Блок «Когда обращаться» на /programmnyj-remont — заголовки и карточки."
      />

      <AdminCard className="mb-6">
        <p className="text-[12px] font-mono text-[#84CC16] mb-4">Заголовок секции</p>
        <div className="space-y-4">
          <Field label="Подпись (eyebrow)">
            <Input
              value={section.eyebrow ?? ''}
              onChange={(e) => setSection({ eyebrow: e.target.value })}
            />
          </Field>
          <Field label="Заголовок">
            <Input
              value={section.title ?? ''}
              onChange={(e) => setSection({ title: e.target.value })}
            />
          </Field>
        </div>
      </AdminCard>

      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-[#9ca3af]">Карточки ({items.length})</p>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#84CC16] bg-[#84CC16]/10 border border-[#84CC16]/20 hover:bg-[#84CC16]/15 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Добавить
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <AdminCard key={item.id || idx}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <p className="text-[12px] font-mono text-[#84CC16]">Карточка {idx + 1}</p>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="p-1.5 rounded-lg text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Удалить"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Заголовок">
                <Input
                  value={item.title ?? ''}
                  onChange={(e) => updateItem(idx, { title: e.target.value })}
                />
              </Field>
              <Field label="Описание">
                <Textarea
                  value={item.desc ?? ''}
                  onChange={(e) => updateItem(idx, { desc: e.target.value })}
                  rows={3}
                />
              </Field>
            </div>
          </AdminCard>
        ))}
      </div>

      <AdminCard className="mt-6">
        <SaveBar onSave={handleSave} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
