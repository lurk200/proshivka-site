import React from 'react';
import { Reveal } from '../../components/ui';
import { REPAIR_ARTICLE } from '../data/brandRepairGuide';

function ExampleBox({ example }) {
  if (!example) return null;
  return (
    <aside className="my-5 rounded-2xl border border-[#84CC16]/20 bg-[#84CC16]/5 px-5 py-4">
      <p className="text-[11px] font-mono uppercase tracking-widest text-[#84CC16] mb-2">
        {example.label}
      </p>
      <p className="text-[14px] text-[var(--text-primary)] leading-relaxed">{example.text}</p>
    </aside>
  );
}

function ArticleBlock({ block }) {
  return (
    <div className="mb-8 last:mb-0">
      <h4 className="text-[17px] font-medium text-[var(--text-primary)] tracking-tight mb-3">
        {block.heading}
      </h4>
      {block.paragraphs.map((p) => (
        <p
          key={p.slice(0, 48)}
          className="text-[15px] text-[var(--text-secondary)] leading-[1.7] mb-4 last:mb-0"
        >
          {p}
        </p>
      ))}
      <ExampleBox example={block.example} />
    </div>
  );
}

function ArticleSection({ section, index }) {
  return (
    <Reveal delay={index * 40}>
      <article className="mb-12 last:mb-0">
        <h3 className="text-xl md:text-2xl font-medium text-[var(--text-primary)] tracking-tight mb-3 pb-3 border-b border-[var(--border-subtle)]">
          {section.title}
        </h3>
        <p className="text-[15px] text-[var(--text-secondary)] leading-[1.7] mb-8">
          {section.intro}
        </p>
        {section.blocks.map((block) => (
          <ArticleBlock key={block.heading} block={block} />
        ))}
      </article>
    </Reveal>
  );
}

export default function BrandRepairGuide() {
  const { title, intro, sections, faq } = REPAIR_ARTICLE;

  return (
    <section
      className="py-14 sm:py-20 bg-[var(--bg-base)] border-b border-[var(--border-subtle)]"
      aria-labelledby="repair-article-title"
    >
      <div className="container mx-auto px-6 lg:px-8 max-w-3xl">
        <header className="mb-10 md:mb-12">
          <Reveal>
            <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">
              Справка для клиентов
            </p>
            <h2
              id="repair-article-title"
              className="text-[clamp(1.5rem,4vw,2.25rem)] font-medium text-[var(--text-primary)] leading-[1.15] tracking-tight mb-5"
            >
              {title}
            </h2>
          </Reveal>
          {intro.map((paragraph, i) => (
            <Reveal key={paragraph.slice(0, 32)} delay={40 + i * 30}>
              <p className="text-[15px] md:text-[16px] text-[var(--text-secondary)] leading-[1.75] mb-4 last:mb-0">
                {paragraph}
              </p>
            </Reveal>
          ))}
        </header>

        <div className="repair-article-body">
          {sections.map((section, index) => (
            <ArticleSection key={section.id} section={section} index={index} />
          ))}
        </div>

        <Reveal delay={120}>
          <footer className="mt-14 pt-8 border-t border-[var(--border-subtle)]">
            <h3 className="text-lg font-medium text-[var(--text-primary)] tracking-tight mb-6">
              Коротко на частые вопросы
            </h3>
            <div className="space-y-6">
              {faq.map((item) => (
                <div key={item.q}>
                  <p className="text-[15px] font-medium text-[var(--text-primary)] mb-2">
                    {item.q}
                  </p>
                  <p className="text-[15px] text-[var(--text-secondary)] leading-[1.7]">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </footer>
        </Reveal>
      </div>
    </section>
  );
}
