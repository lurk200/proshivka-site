import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function WorkCard({ work, className = '' }) {
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] transition-all duration-300 hover:border-[var(--border-accent-hover)] hover:shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={work.image}
          alt={work.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'var(--hero-gradient)' }}
        />
        <span className="absolute left-3 top-3 z-10 inline-flex px-2.5 py-1 rounded-full bg-[#84CC16]/15 border border-[#84CC16]/25 text-[10px] font-mono uppercase tracking-wider text-[#84CC16]">
          {work.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[11px] font-mono text-[var(--text-muted)] mb-2">{work.model}</p>
        <h3 className="text-[16px] sm:text-[17px] font-medium text-[var(--text-primary)] tracking-tight mb-2">
          {work.title}
        </h3>
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed flex-1 line-clamp-3">
          {work.summary}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1.5 text-[12px] font-mono text-[#84CC16]">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
            {work.status}
          </p>
          <span className="text-[11px] font-mono text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
            Подробнее →
          </span>
        </div>
      </div>
    </article>
  );
}
