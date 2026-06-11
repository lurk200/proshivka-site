import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Phone } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import { Reveal } from '../components/ui';
import SafeImage from '../components/ui/SafeImage';
import { useCms } from '../context/CmsContext';
import { findWorkById } from '../data/worksContent';

export default function WorkDetailPage() {
  const { workId } = useParams();
  const { cmsData } = useCms();
  const { works, company } = cmsData;
  const work = findWorkById(works, workId);
  const phoneHref = `tel:${company.phone.replace(/[^\d+]/g, '')}`;

  if (!work || work.published === false) {
    return <Navigate to="/nashi-raboty" replace />;
  }

  const detailParagraphs = (work.details || '')
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <PageTransition>
      <Helmet>
        <title>
          {work.title} | {works.seo.title} | {company.name}
        </title>
        <meta name="description" content={work.summary} />
      </Helmet>

      <div className="relative w-full min-w-0 overflow-x-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-diagnostic-grid"
          style={{ opacity: 'var(--grid-opacity)' }}
        />

        <div className="relative z-10 mx-auto w-full max-w-[90rem] px-4 pb-14 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:px-8">
          <Reveal className="mb-6">
            <Link
              to="/nashi-raboty"
              className="inline-flex items-center gap-2 text-[13px] font-mono text-[#84CC16] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Все работы
            </Link>
          </Reveal>

          <article className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <Reveal>
              <div className="relative overflow-hidden rounded-[20px] border border-[var(--border-subtle)] aspect-[16/10] lg:aspect-[4/3] shadow-[var(--shadow-card)]">
                <SafeImage
                  src={work.image}
                  alt={work.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'var(--hero-gradient)' }}
                />
                <span className="absolute left-4 top-4 z-10 inline-flex px-2.5 py-1 rounded-full bg-[#84CC16]/15 border border-[#84CC16]/25 text-[10px] font-mono uppercase tracking-wider text-[#84CC16]">
                  {work.category}
                </span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <div>
                <p className="text-[11px] font-mono text-[var(--text-muted)] mb-2">{work.model}</p>
                <h1 className="text-[clamp(1.5rem,4vw,2.25rem)] font-medium text-[var(--text-primary)] tracking-tight mb-4">
                  {work.title}
                </h1>
                <p className="inline-flex items-center gap-1.5 text-[13px] font-mono text-[#84CC16] mb-6">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                  {work.status}
                </p>
                <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-6">
                  {work.summary}
                </p>
                {detailParagraphs.length > 0 ? (
                  <div className="space-y-4 border-t border-[var(--border-subtle)] pt-6">
                    {detailParagraphs.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 40)}
                        className="text-[14px] text-[var(--text-secondary)] leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : null}
                <p className="mt-6 text-[12px] font-mono text-[var(--text-muted)]">
                  {work.createdAt}
                </p>
              </div>
            </Reveal>
          </article>

          <Reveal delay={120} className="mt-12">
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#84CC16] mb-2">
                  Нужна помощь?
                </p>
                <p className="text-[15px] text-[var(--text-primary)] font-medium">
                  Опишите проблему — подскажем по срокам и стоимости
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
