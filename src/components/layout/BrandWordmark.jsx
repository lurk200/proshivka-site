import React from 'react';

const DEFAULT_TAGLINE = 'Ремонт смартфонов и электроники';

/** Текстовый wordmark в стиле бренда: «ПРО» — лайм, «ШИВКА» — основной текст. */
export default function BrandWordmark({
  name = 'ПРОШИВКА',
  tagline = DEFAULT_TAGLINE,
  className = '',
}) {
  const accent = name.slice(0, 3);
  const rest = name.slice(3);

  return (
    <div
      className={`inline-flex max-w-[8.5rem] flex-col rounded-lg border border-[#84CC16]/35 bg-[var(--bg-surface)]/40 px-2 py-1 sm:max-w-none sm:px-3 sm:py-2 ${className}`}
    >
      <span className="truncate text-base font-semibold uppercase leading-none tracking-tight sm:text-lg lg:text-xl">
        <span className="text-[#84CC16]">{accent}</span>
        <span className="text-[var(--text-primary)]">{rest}</span>
      </span>
      {tagline ? (
        <span className="mt-1 hidden text-[8px] font-medium uppercase leading-tight tracking-[0.12em] text-[var(--text-muted)] sm:block sm:text-[9px]">
          {tagline}
        </span>
      ) : null}
      <span
        className="mt-1 hidden h-px w-full bg-gradient-to-r from-[#84CC16]/60 via-[#84CC16]/20 to-transparent sm:block"
        aria-hidden
      />
    </div>
  );
}
