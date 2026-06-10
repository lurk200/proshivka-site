import React, { useState } from 'react';
import { useSiteDraft } from '../hooks/useSiteDraft';
import { SERVICE_PAGE_KEYS, SERVICE_PAGE_LABELS } from '../../src/data/servicePagesContent';
import { PageHeader, AdminCard, Field, Input, ArrayLinesInput, SaveBar } from '../components/ui';

export default function ServicePagesPage() {
  const { draft, setDraft, save, reset, saved } = useSiteDraft('servicePages');
  const [activeKey, setActiveKey] = useState(SERVICE_PAGE_KEYS[0]);
  const page = draft[activeKey];

  const setPage = (patch) => setDraft({ ...draft, [activeKey]: { ...page, ...patch } });

  const isTemplateStyle = activeKey === 'waterDamage';

  return (
    <>
      <PageHeader
        title="Страницы услуг"
        description="SEO и тексты для /services/*. Страница «Стекло» — hero и meta; остальной контент в коде."
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {SERVICE_PAGE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveKey(key)}
            className={`px-4 py-2 rounded-xl text-[13px] font-medium border transition-colors ${
              key === activeKey
                ? 'bg-[#84CC16]/15 border-[#84CC16]/30 text-[#84CC16]'
                : 'border-white/[0.08] text-[#9ca3af] hover:text-white'
            }`}
          >
            {SERVICE_PAGE_LABELS[key]}
          </button>
        ))}
      </div>

      <AdminCard>
        <div className="space-y-4">
          <Field label="SEO title">
            <Input value={page.seoTitle ?? ''} onChange={(e) => setPage({ seoTitle: e.target.value })} />
          </Field>
          <Field label="SEO description">
            <Input value={page.seoDesc ?? ''} onChange={(e) => setPage({ seoDesc: e.target.value })} />
          </Field>

          {isTemplateStyle ? (
            <>
              <Field label="Заголовок H1">
                <Input value={page.title} onChange={(e) => setPage({ title: e.target.value })} />
              </Field>
              <Field label="Описание">
                <Input value={page.description} onChange={(e) => setPage({ description: e.target.value })} />
              </Field>
              <Field label="Преимущества">
                <ArrayLinesInput
                  value={page.advantages}
                  onChange={(advantages) => setPage({ advantages })}
                />
              </Field>
              <Field label="Риски">
                <ArrayLinesInput value={page.risks} onChange={(risks) => setPage({ risks })} />
              </Field>
            </>
          ) : (
            <>
              {page.heroBadge !== undefined ? (
                <Field label="Бейдж hero">
                  <Input value={page.heroBadge} onChange={(e) => setPage({ heroBadge: e.target.value })} />
                </Field>
              ) : null}
              <Field label="Заголовок">
                <Input
                  value={page.heroTitle ?? ''}
                  onChange={(e) => setPage({ heroTitle: e.target.value })}
                />
              </Field>
              {page.heroTitleAccent !== undefined ? (
                <Field label="Акцент в заголовке (вторая строка)">
                  <Input
                    value={page.heroTitleAccent}
                    onChange={(e) => setPage({ heroTitleAccent: e.target.value })}
                  />
                </Field>
              ) : null}
              <Field label="Описание hero">
                <Input
                  value={page.heroDescription ?? ''}
                  onChange={(e) => setPage({ heroDescription: e.target.value })}
                />
              </Field>
            </>
          )}
        </div>
        <SaveBar onSave={save} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
