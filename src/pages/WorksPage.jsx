import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import { Reveal } from '../components/ui';
import WorkCard from '../components/sections/WorkCard';
import { useCms } from '../context/CmsContext';
import { getPublishedWorks, getWorkCategories } from '../data/worksContent';

function CategoryFilter({ categories, active, onChange, total }) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`px-3.5 py-1.5 rounded-full text-[12px] font-mono uppercase tracking-wide border transition-colors ${
          active === 'all'
            ? 'bg-[#84CC16]/15 border-[#84CC16]/30 text-[#84CC16]'
            : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'
        }`}
      >
        Все ({total})
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className={`px-3.5 py-1.5 rounded-full text-[12px] font-mono border transition-colors ${
            active === cat
              ? 'bg-[#84CC16]/15 border-[#84CC16]/30 text-[#84CC16]'
              : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

export default function WorksPage() {
  const { cmsData } = useCms();
  const { works, company } = cmsData;
  const published = getPublishedWorks(works);
  const categories = useMemo(() => getWorkCategories(works), [works]);
  const [filter, setFilter] = useState('all');
  const phoneHref = `tel:${company.phone.replace(/\D/g, '')}`;

  const filtered =
    filter === 'all' ? published : published.filter((w) => w.category === filter);

  return (
    <PageTransition>
      <div className="relative w-full min-w-0 overflow-x-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-diagnostic-grid"
          style={{ opacity: 'var(--grid-opacity)' }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-48 w-full max-w-2xl -translate-x-1/2 rounded-full blur-[80px]"
          style={{ background: 'var(--glow-accent)' }}
        />

        <div className="relative z-10 mx-auto w-full max-w-[90rem] px-4 pb-14 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:px-8">
          <Reveal className="mb-8 md:mb-10 max-w-2xl">
            <span className="text-[#84CC16] text-[10px] font-mono uppercase tracking-widest block mb-3">
              {works.page.eyebrow}
            </span>
            <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-medium text-[var(--text-primary)] tracking-tight mb-3">
              {works.page.title}
            </h1>
            <p className="text-[14px] sm:text-[15px] text-[var(--text-secondary)] leading-relaxed">
              {works.page.subtitle}
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-[12px] font-mono text-[var(--text-muted)]">
              <span>Кейсов: {published.length}</span>
              {categories.length > 0 ? <span>Направлений: {categories.length}</span> : null}
            </div>
          </Reveal>

          {published.length > 0 ? (
            <>
              {categories.length > 1 ? (
                <Reveal delay={40}>
                  <CategoryFilter
                    categories={categories}
                    active={filter}
                    onChange={setFilter}
                    total={published.length}
                  />
                </Reveal>
              ) : null}

              {filtered.length > 0 ? (
                <ul className="m-0 grid list-none grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 p-0">
                  {filtered.map((work, index) => (
                    <li key={work.id}>
                      <Reveal delay={index * 40}>
                        <Link to={`/nashi-raboty/${work.id}`} className="block h-full">
                          <WorkCard work={work} className="h-full cursor-pointer" />
                        </Link>
                      </Reveal>
                    </li>
                  ))}
                </ul>
              ) : (
                <Reveal>
                  <p className="text-[15px] text-[var(--text-secondary)] rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
                    В этой категории пока нет работ.{' '}
                    <button
                      type="button"
                      onClick={() => setFilter('all')}
                      className="text-[#84CC16] hover:underline"
                    >
                      Показать все
                    </button>
                  </p>
                </Reveal>
              )}
            </>
          ) : (
            <Reveal>
              <p className="text-[15px] text-[var(--text-secondary)] rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
                Пока нет опубликованных работ. Загляните позже — мы добавим новые кейсы.
              </p>
            </Reveal>
          )}

          <Reveal delay={80} className="mt-12 md:mt-16">
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[var(--shadow-soft)]">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#84CC16] mb-2">
                  Связаться с лабораторией
                </p>
                <p className="text-[15px] text-[var(--text-primary)] font-medium max-w-md">
                  Похожая проблема? Привозите устройство или напишите — проконсультируем бесплатно.
                </p>
              </div>
              <a
                href={phoneHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#84CC16] px-6 py-3 text-[14px] font-medium text-[#0a0a0a] hover:bg-[#9ae022] transition-colors shrink-0"
              >
                <Phone className="w-4 h-4" />
                {company.phone}
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </PageTransition>
  );
}
