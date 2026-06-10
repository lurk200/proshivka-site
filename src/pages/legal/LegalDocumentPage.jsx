import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import PageTransition from '../../components/layout/PageTransition';
import { Reveal } from '../../components/ui';
import { useCms } from '../../context/CmsContext';
import { getLegalDocument } from '../../data/legalContent';

export default function LegalDocumentPage() {
  const { docId } = useParams();
  const { cmsData } = useCms();
  const doc = getLegalDocument(docId, cmsData.legal);

  if (!doc) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageTransition>
      <Helmet>
        <title>
          {doc.title} | {cmsData.company.name}
        </title>
        <meta name="description" content={doc.metaDescription} />
      </Helmet>

      <div className="relative w-full min-w-0 overflow-x-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-diagnostic-grid"
          style={{ opacity: 'var(--grid-opacity)' }}
        />

        <article className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:px-8">
          <Reveal>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[13px] text-[var(--text-secondary)] hover:text-[#84CC16] transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              На главную
            </Link>

            <span className="text-[#84CC16] text-[10px] font-mono uppercase tracking-widest block mb-3">
              Правовые документы
            </span>
            <h1 className="text-[clamp(1.5rem,4vw,2rem)] font-medium text-[var(--text-primary)] tracking-tight mb-3">
              {doc.title}
            </h1>
            <p className="text-[12px] font-mono text-[var(--text-muted)] mb-10">
              Обновлено: {doc.updatedAt}
            </p>
          </Reveal>

          <div className="space-y-8">
            {doc.sections.map((section, index) => (
              <Reveal key={section.heading} delay={40 + index * 30}>
                <section className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-soft)]">
                  <h2 className="text-[15px] sm:text-[16px] font-medium text-[var(--text-primary)] mb-3">
                    {section.heading}
                  </h2>
                  {section.paragraphs?.map((text) => (
                    <p
                      key={text.slice(0, 40)}
                      className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-3 last:mb-0"
                    >
                      {text}
                    </p>
                  ))}
                  {section.list && (
                    <ul className="mt-2 space-y-2 list-disc pl-5 text-[14px] text-[var(--text-secondary)] leading-relaxed">
                      {section.list.map((item) => (
                        <li key={item.slice(0, 40)}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120} className="mt-10 pt-6 border-t border-[var(--border-subtle)]">
            <p className="text-[13px] text-[var(--text-muted)]">
              По вопросам, связанным с документом, свяжитесь с нами:{' '}
              <a
                href={`tel:${cmsData.company.phone.replace(/\D/g, '')}`}
                className="text-[#84CC16] hover:underline"
              >
                {cmsData.company.phone}
              </a>
            </p>
          </Reveal>
        </article>
      </div>
    </PageTransition>
  );
}
