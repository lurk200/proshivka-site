import React, { useState } from 'react';
import { useCms } from '../../src/context/CmsContext';
import { SEO_PAGE_LIST } from '../../src/data/seoContent';
import { useSiteDraft } from '../hooks/useSiteDraft';
import {
  PageHeader,
  AdminCard,
  AdminTabs,
  Field,
  Input,
  Textarea,
  SaveBar,
  PreviewLink,
} from '../components/ui';

const SERVICE_SYNC_KEYS = new Set([
  'glassReplacement',
  'batteryReplacement',
  'waterDamage',
  'modularRepair',
]);

function CharHint({ value, min, max, label }) {
  const len = value?.length ?? 0;
  const ok = len >= min && len <= max;
  return (
    <span className={`text-[12px] ${ok ? 'text-[#6b7280]' : 'text-amber-400/90'}`}>
      {label}: {len} симв. {max ? `(рекомендуется ${min}–${max})` : null}
    </span>
  );
}

function GooglePreview({ title, description, url }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] p-4">
      <p className="text-[11px] font-mono uppercase tracking-widest text-[#6b7280] mb-3">
        Превью в Google
      </p>
      <p className="text-[18px] text-[#8ab4f8] leading-snug truncate">{title || 'Заголовок страницы'}</p>
      <p className="text-[13px] text-[#84CC16] mt-0.5 truncate">{url || 'https://ваш-сайт.ru/страница'}</p>
      <p className="text-[13px] text-[#9aa0a6] mt-1 line-clamp-2">
        {description || 'Краткое описание страницы для поисковой выдачи.'}
      </p>
    </div>
  );
}

function GlobalTab({ draft, setDraft }) {
  const g = draft.global;
  const setGlobal = (patch) => setDraft({ ...draft, global: { ...g, ...patch } });

  return (
    <div className="space-y-6">
      <AdminCard>
        <p className="text-[12px] font-mono text-[#84CC16] mb-4">Основные настройки</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Название сайта">
            <Input value={g.siteName} onChange={(e) => setGlobal({ siteName: e.target.value })} />
          </Field>
          <Field label="Суффикс в title" hint="Добавляется к заголовкам страниц: «Заголовок | Суффикс»">
            <Input value={g.titleSuffix} onChange={(e) => setGlobal({ titleSuffix: e.target.value })} />
          </Field>
          <Field label="Адрес сайта (URL)" hint="https://example.ru — для canonical и Open Graph">
            <Input
              value={g.siteUrl}
              onChange={(e) => setGlobal({ siteUrl: e.target.value })}
              placeholder="https://"
            />
          </Field>
          <Field label="Локаль Open Graph">
            <Input value={g.locale} onChange={(e) => setGlobal({ locale: e.target.value })} />
          </Field>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="Описание по умолчанию">
            <Textarea
              rows={3}
              value={g.defaultDescription}
              onChange={(e) => setGlobal({ defaultDescription: e.target.value })}
            />
          </Field>
          <Field label="Ключевые слова по умолчанию">
            <Textarea
              rows={2}
              value={g.defaultKeywords}
              onChange={(e) => setGlobal({ defaultKeywords: e.target.value })}
            />
          </Field>
          <Field label="OG-изображение по умолчанию" hint="URL картинки 1200×630 px">
            <Input
              value={g.defaultOgImage}
              onChange={(e) => setGlobal({ defaultOgImage: e.target.value })}
              placeholder="https://…/og.jpg"
            />
          </Field>
          <Field label="Robots (по умолчанию)">
            <Input value={g.robots} onChange={(e) => setGlobal({ robots: e.target.value })} />
          </Field>
        </div>
      </AdminCard>

      <AdminCard>
        <p className="text-[12px] font-mono text-[#84CC16] mb-4">Верификация в поисковиках</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Google Search Console" hint="Содержимое meta google-site-verification">
            <Input
              value={g.googleSiteVerification}
              onChange={(e) => setGlobal({ googleSiteVerification: e.target.value })}
            />
          </Field>
          <Field label="Яндекс.Вебмастер" hint="meta yandex-verification">
            <Input
              value={g.yandexVerification}
              onChange={(e) => setGlobal({ yandexVerification: e.target.value })}
            />
          </Field>
          <Field label="Bing Webmaster">
            <Input value={g.bingVerification} onChange={(e) => setGlobal({ bingVerification: e.target.value })} />
          </Field>
        </div>
      </AdminCard>

      <AdminCard>
        <p className="text-[12px] font-mono text-[#84CC16] mb-4">Микроразметка (JSON-LD)</p>
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.jsonLd.enabled}
            onChange={(e) =>
              setDraft({ ...draft, jsonLd: { ...draft.jsonLd, enabled: e.target.checked } })
            }
            className="rounded border-white/20"
          />
          <span className="text-[14px] text-[#e5e7eb]">Включить LocalBusiness на главной</span>
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Название организации">
            <Input
              value={draft.jsonLd.businessName}
              onChange={(e) =>
                setDraft({ ...draft, jsonLd: { ...draft.jsonLd, businessName: e.target.value } })
              }
            />
          </Field>
          <Field label="Телефон">
            <Input
              value={draft.jsonLd.telephone}
              onChange={(e) =>
                setDraft({ ...draft, jsonLd: { ...draft.jsonLd, telephone: e.target.value } })
              }
            />
          </Field>
          <Field label="Адрес">
            <Input
              value={draft.jsonLd.address}
              onChange={(e) =>
                setDraft({ ...draft, jsonLd: { ...draft.jsonLd, address: e.target.value } })
              }
            />
          </Field>
          <Field label="Ценовой диапазон" hint="Например: ₽₽">
            <Input
              value={draft.jsonLd.priceRange}
              onChange={(e) =>
                setDraft({ ...draft, jsonLd: { ...draft.jsonLd, priceRange: e.target.value } })
              }
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Описание для схемы">
            <Textarea
              rows={2}
              value={draft.jsonLd.description}
              onChange={(e) =>
                setDraft({ ...draft, jsonLd: { ...draft.jsonLd, description: e.target.value } })
              }
            />
          </Field>
        </div>
      </AdminCard>
    </div>
  );
}

function PageSeoTab({ pageId, draft, setDraft, siteUrl }) {
  const page = draft.pages[pageId] ?? {};
  const meta = SEO_PAGE_LIST.find((p) => p.id === pageId);
  const previewUrl = siteUrl
    ? `${siteUrl.replace(/\/$/, '')}${meta?.path ?? ''}`
    : meta?.path ?? '/';

  const setPage = (patch) =>
    setDraft({
      ...draft,
      pages: {
        ...draft.pages,
        [pageId]: { ...page, ...patch },
      },
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <PreviewLink href={meta?.path ?? '/'} label="Открыть страницу" />
      </div>

      <GooglePreview title={page.title} description={page.description} url={previewUrl} />

      <AdminCard>
        <div className="space-y-4">
          <Field label="Title (заголовок вкладки)">
            <Input value={page.title ?? ''} onChange={(e) => setPage({ title: e.target.value })} />
            <CharHint value={page.title} min={30} max={60} label="Title" />
          </Field>
          <Field label="Meta description">
            <Textarea
              rows={3}
              value={page.description ?? ''}
              onChange={(e) => setPage({ description: e.target.value })}
            />
            <CharHint value={page.description} min={120} max={160} label="Description" />
          </Field>
          <Field label="Keywords" hint="Через запятую">
            <Textarea
              rows={2}
              value={page.keywords ?? ''}
              onChange={(e) => setPage({ keywords: e.target.value })}
            />
          </Field>
          <Field label="Canonical URL" hint="Оставьте пустым — соберётся из адреса сайта + путь">
            <Input
              value={page.canonical ?? ''}
              onChange={(e) => setPage({ canonical: e.target.value })}
              placeholder={previewUrl}
            />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!page.noindex}
              onChange={(e) => setPage({ noindex: e.target.checked })}
              className="rounded border-white/20"
            />
            <span className="text-[14px] text-[#e5e7eb]">Скрыть от индексации (noindex)</span>
          </label>
        </div>
      </AdminCard>

      <AdminCard>
        <p className="text-[12px] font-mono text-[#84CC16] mb-4">Open Graph (соцсети и мессенджеры)</p>
        <div className="space-y-4">
          <Field label="OG title">
            <Input value={page.ogTitle ?? ''} onChange={(e) => setPage({ ogTitle: e.target.value })} />
          </Field>
          <Field label="OG description">
            <Textarea
              rows={2}
              value={page.ogDescription ?? ''}
              onChange={(e) => setPage({ ogDescription: e.target.value })}
            />
          </Field>
          <Field label="OG image (URL)">
            <Input
              value={page.ogImage ?? ''}
              onChange={(e) => setPage({ ogImage: e.target.value })}
              placeholder="https://…"
            />
          </Field>
        </div>
      </AdminCard>
    </div>
  );
}

function PromotionTab({ draft }) {
  const tips = draft.promotion?.tips ?? [];
  return (
    <AdminCard>
      <p className="text-[12px] font-mono text-[#84CC16] mb-4">Как продвигать сайт</p>
      <ul className="space-y-3">
        {tips.map((tip, i) => (
          <li key={i} className="flex gap-3 text-[14px] text-[#9ca3af] leading-relaxed">
            <span className="text-[#84CC16] font-mono shrink-0">{String(i + 1).padStart(2, '0')}</span>
            {tip}
          </li>
        ))}
      </ul>
      <p className="text-[12px] text-[#6b7280] mt-6">
        После публикации: добавьте сайт в{' '}
        <a
          href="https://webmaster.yandex.ru"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#84CC16] hover:underline"
        >
          Яндекс.Вебмастер
        </a>
        ,{' '}
        <a
          href="https://search.google.com/search-console"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#84CC16] hover:underline"
        >
          Google Search Console
        </a>{' '}
        и отправьте sitemap, когда он будет на сервере.
      </p>
    </AdminCard>
  );
}

export default function SeoPage() {
  const { updateContent } = useCms();
  const { draft, setDraft, reset } = useSiteDraft('siteSeo');
  const [tab, setTab] = useState('global');
  const [pageId, setPageId] = useState('home');
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateContent((prev) => {
      const siteSeo = structuredClone(draft);
      const next = { ...prev, siteSeo };

      const home = siteSeo.pages?.home;
      if (home) {
        next.mainHome = {
          ...prev.mainHome,
          seo: { ...prev.mainHome?.seo, description: home.description },
        };
      }

      const worksPage = siteSeo.pages?.works;
      if (worksPage) {
        next.works = {
          ...prev.works,
          seo: {
            ...prev.works?.seo,
            title: worksPage.title,
            description: worksPage.description,
          },
        };
      }

      for (const key of SERVICE_SYNC_KEYS) {
        const p = siteSeo.pages?.[key];
        if (!p || !next.servicePages?.[key]) continue;
        next.servicePages = {
          ...next.servicePages,
          [key]: {
            ...next.servicePages[key],
            seoTitle: p.title,
            seoDesc: p.description,
          },
        };
      }

      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const mainTabs = [
    { id: 'global', label: 'Общие' },
    { id: 'pages', label: 'Страницы' },
    { id: 'promotion', label: 'Продвижение' },
  ];

  return (
    <>
      <PageHeader
        title="SEO и продвижение"
        description="Заголовки, описания, Open Graph и верификация для поисковиков. Изменения применяются ко всему сайту."
        actions={<PreviewLink href="/" label="Главная" />}
      />

      <AdminTabs tabs={mainTabs} active={tab} onChange={setTab} />

      {tab === 'global' ? <GlobalTab draft={draft} setDraft={setDraft} /> : null}

      {tab === 'pages' ? (
        <>
          <AdminTabs
            tabs={SEO_PAGE_LIST.map((p) => ({ id: p.id, label: p.label }))}
            active={pageId}
            onChange={setPageId}
          />
          <PageSeoTab
            pageId={pageId}
            draft={draft}
            setDraft={setDraft}
            siteUrl={draft.global?.siteUrl}
          />
        </>
      ) : null}

      {tab === 'promotion' ? <PromotionTab draft={draft} /> : null}

      <AdminCard className="mt-6">
        <SaveBar onSave={save} onReset={reset} saved={saved} />
      </AdminCard>
    </>
  );
}
