import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react';
import { useSiteDraft } from '../hooks/useSiteDraft';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';
import { createEmptyWork, duplicateWork } from '../../src/data/worksContent';
import {
  PageHeader,
  AdminCard,
  Field,
  Input,
  Textarea,
  SaveBar,
  PreviewLink,
  AdminTabs,
  CollapsibleCard,
} from '../components/ui';

function moveItem(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function WorksPage() {
  const { draft, setDraft, save, reset, saved, isDirty } = useSiteDraft('works');
  useUnsavedGuard(isDirty);
  const [tab, setTab] = useState('works');
  const [openId, setOpenId] = useState(null);

  const updateItem = (idx, patch) => {
    const items = [...draft.items];
    items[idx] = { ...items[idx], ...patch };
    setDraft({ ...draft, items });
  };

  const addWork = () => {
    const item = createEmptyWork();
    setDraft({ ...draft, items: [item, ...draft.items] });
    setOpenId(item.id);
    setTab('works');
  };

  const removeWork = (idx) => {
    if (!window.confirm('Удалить эту работу?')) return;
    setDraft({ ...draft, items: draft.items.filter((_, i) => i !== idx) });
  };

  const duplicateAt = (idx) => {
    const copy = duplicateWork(draft.items[idx]);
    const items = [...draft.items];
    items.splice(idx + 1, 0, copy);
    setDraft({ ...draft, items });
    setOpenId(copy.id);
  };

  const publishedCount = draft.items.filter((w) => w.published !== false).length;

  const tabs = [
    { id: 'works', label: `Работы (${draft.items.length})` },
    { id: 'page', label: 'Страница /nashi-raboty' },
    { id: 'home', label: 'Блок на главной' },
  ];

  return (
    <>
      <PageHeader
        title="Наши работы"
        description="Управляйте кейсами: публикуйте на отдельной странице и в карусели на главной. Черновики не видны посетителям."
        actions={<PreviewLink href="/nashi-raboty" />}
      />

      <AdminTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'page' ? (
        <AdminCard className="mb-6">
          <p className="text-[13px] font-medium text-white mb-4">Страница и SEO</p>
          <div className="space-y-4">
            <Field label="SEO title">
              <Input
                value={draft.seo.title}
                onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, title: e.target.value } })}
              />
            </Field>
            <Field label="SEO description">
              <Textarea
                rows={2}
                value={draft.seo.description}
                onChange={(e) =>
                  setDraft({ ...draft, seo: { ...draft.seo, description: e.target.value } })
                }
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
              <Field label="Подпись (eyebrow)">
                <Input
                  value={draft.page.eyebrow}
                  onChange={(e) =>
                    setDraft({ ...draft, page: { ...draft.page, eyebrow: e.target.value } })
                  }
                />
              </Field>
              <Field label="Заголовок H1">
                <Input
                  value={draft.page.title}
                  onChange={(e) =>
                    setDraft({ ...draft, page: { ...draft.page, title: e.target.value } })
                  }
                />
              </Field>
            </div>
            <Field label="Описание под заголовком">
              <Textarea
                rows={3}
                value={draft.page.subtitle}
                onChange={(e) =>
                  setDraft({ ...draft, page: { ...draft.page, subtitle: e.target.value } })
                }
              />
            </Field>
          </div>
        </AdminCard>
      ) : null}

      {tab === 'home' ? (
        <AdminCard className="mb-6">
          <p className="text-[13px] font-medium text-white mb-1">Карусель на главной</p>
          <p className="text-[12px] text-[#6b7280] mb-4">
            Блок в секции «О нас». Заголовки можно задать отдельно от полной страницы.
          </p>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.home.showCarousel !== false}
                onChange={(e) =>
                  setDraft({ ...draft, home: { ...draft.home, showCarousel: e.target.checked } })
                }
                className="w-4 h-4 rounded accent-[#84CC16]"
              />
              <span className="text-[13px] text-[#e5e7eb]">Показывать карусель на главной</span>
            </label>
            <Field label="Сколько слайдов показывать" hint="Из последних опубликованных работ">
              <Input
                type="number"
                min={1}
                max={20}
                value={draft.home.carouselLimit}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    home: { ...draft.home, carouselLimit: Number(e.target.value) || 5 },
                  })
                }
              />
            </Field>
            <div className="border-t border-white/[0.06] pt-4 space-y-4">
              <p className="text-[12px] font-mono uppercase tracking-widest text-[#84CC16]">
                Заголовки блока
              </p>
              <Field label="Подпись">
                <Input
                  value={draft.homeSection?.eyebrow ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      homeSection: { ...draft.homeSection, eyebrow: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Заголовок">
                <Input
                  value={draft.homeSection?.title ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      homeSection: { ...draft.homeSection, title: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Описание">
                <Textarea
                  rows={2}
                  value={draft.homeSection?.subtitle ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      homeSection: { ...draft.homeSection, subtitle: e.target.value },
                    })
                  }
                />
              </Field>
            </div>
          </div>
        </AdminCard>
      ) : null}

      {tab === 'works' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-[13px] text-[#9ca3af]">
              Всего: {draft.items.length} · Опубликовано: {publishedCount}
            </p>
            <button
              type="button"
              onClick={addWork}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#84CC16] text-[#0c0d10] text-[13px] font-semibold hover:bg-[#9be02a] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить работу
            </button>
          </div>

          <div className="space-y-3">
            {draft.items.map((work, idx) => {
              const isOpen = openId === work.id;
              return (
                <CollapsibleCard
                  key={work.id}
                  title={work.title || 'Без названия'}
                  subtitle={`${work.category || '—'} · ${work.model || '—'} · ${work.published !== false ? 'опубликовано' : 'черновик'}`}
                  open={isOpen}
                  onToggle={() => setOpenId(isOpen ? null : work.id)}
                  actions={
                    <>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => setDraft({ ...draft, items: moveItem(draft.items, idx, idx - 1) })}
                        className="p-2 rounded-lg text-[#9ca3af] hover:text-white disabled:opacity-30"
                        aria-label="Выше"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === draft.items.length - 1}
                        onClick={() => setDraft({ ...draft, items: moveItem(draft.items, idx, idx + 1) })}
                        className="p-2 rounded-lg text-[#9ca3af] hover:text-white disabled:opacity-30"
                        aria-label="Ниже"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateAt(idx)}
                        className="p-2 rounded-lg text-[#9ca3af] hover:text-[#84CC16]"
                        aria-label="Дублировать"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeWork(idx)}
                        className="p-2 rounded-lg text-[#9ca3af] hover:text-red-400"
                        aria-label="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  }
                >
                  <div className="space-y-4 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={work.published !== false}
                          onChange={(e) => updateItem(idx, { published: e.target.checked })}
                          className="w-4 h-4 rounded accent-[#84CC16]"
                        />
                        <span className="text-[13px] text-[#e5e7eb]">
                          {work.published !== false ? 'Опубликовано' : 'Черновик (скрыто)'}
                        </span>
                      </label>
                      <a
                        href={`/nashi-raboty/${work.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-[#84CC16] hover:underline"
                      >
                        Предпросмотр →
                      </a>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Категория">
                        <Input
                          value={work.category}
                          onChange={(e) => updateItem(idx, { category: e.target.value })}
                        />
                      </Field>
                      <Field label="Модель устройства">
                        <Input
                          value={work.model}
                          onChange={(e) => updateItem(idx, { model: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Field label="Заголовок кейса">
                      <Input
                        value={work.title}
                        onChange={(e) => updateItem(idx, { title: e.target.value })}
                      />
                    </Field>
                    <Field label="Краткое описание (карточка)">
                      <Textarea
                        rows={2}
                        value={work.summary}
                        onChange={(e) => updateItem(idx, { summary: e.target.value })}
                      />
                    </Field>
                    <Field label="Подробное описание (страница кейса)" hint="Необязательно">
                      <Textarea
                        rows={4}
                        value={work.details ?? ''}
                        onChange={(e) => updateItem(idx, { details: e.target.value })}
                      />
                    </Field>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Статус">
                        <Input
                          value={work.status}
                          onChange={(e) => updateItem(idx, { status: e.target.value })}
                        />
                      </Field>
                      <Field label="Дата">
                        <Input
                          type="date"
                          value={work.createdAt}
                          onChange={(e) => updateItem(idx, { createdAt: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Field label="URL изображения">
                      <Input
                        value={work.image}
                        onChange={(e) => updateItem(idx, { image: e.target.value })}
                      />
                    </Field>
                    {work.image ? (
                      <img
                        src={work.image}
                        alt=""
                        className="w-full max-w-sm rounded-lg border border-white/10 object-cover aspect-video"
                      />
                    ) : null}
                  </div>
                </CollapsibleCard>
              );
            })}
          </div>
        </>
      ) : null}

      <AdminCard className="mt-6">
        <SaveBar onSave={save} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
