import React from 'react';
import { Reveal, Section } from '../ui';

export default function AboutSection({ data, section }) {
  const meta = section ?? {};
  return (
    <Section id="about" bg="surface" className="border-y border-[var(--border-subtle)]">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative z-10">
        <Reveal as="header" className="mb-16 md:mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="max-w-2xl"><span className="text-[#84CC16] text-[10px] font-mono uppercase tracking-widest block mb-3">{meta.eyebrow}</span><h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-medium text-[var(--text-primary)] mb-4 tracking-[-0.01em]">{meta.title}</h2><p className="text-[var(--text-secondary)] text-[15px] leading-relaxed">{meta.subtitle}</p></div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12" role="list">
          {data.map((p, idx) => (
            <Reveal key={p.id} delay={idx * 100} role="listitem">
              <article className="flex flex-col h-full border-l border-[var(--border-medium)] pl-6 lg:pl-8 py-2 hover:border-[var(--border-accent-hover)] transition-colors duration-700 ease-premium">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-6"><p.icon className="w-4 h-4 text-[#84CC16]" strokeWidth={1.5} aria-hidden="true" /></div>
                <h3 className="text-[17px] font-medium text-[var(--text-primary)] mb-3 tracking-tight">{p.title}</h3>
                <p className="text-[var(--text-secondary)] text-[14px] leading-relaxed font-normal max-w-[40ch]">{p.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}