import React from 'react';

const DEFAULT_TAGLINE = 'Ремонт смартфонов и электроники';

/** Текстовый wordmark в стиле бренда: «ПРО» — лайм, «ШИВКА» — основной текст. */
export default function BrandWordmark({
  name = 'ПРОШИВКА',
  tagline = DEFAULT_TAGLINE,
  compact = false,
  className = '',
}) {
  const accent = name.slice(0, 3);
  const rest = name.slice(3);

  return (
    <div
      className={`inline-flex flex-col rounded-lg border border-[#84CC16]/35 bg-[var(--bg-surface)]/40 px-2.5 py-1.5 sm:px-3 sm:py-2 ${className}`}
    >
      <span
        className={`font-semibold uppercase tracking-tight leading-none ${
          compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
        }`}
      >
        <span className="text-[#84CC16]">{accent}</span>
        <span className="text-[var(--text-primary)]">{rest}</span>
      </span>
      {!compact && tagline ? (
        <span className="mt-1 hidden text-[8px] font-medium uppercase leading-tight tracking-[0.12em] text-[var(--text-muted)] min-[420px]:block sm:text-[9px]">
          {tagline}
        </span>
      ) : null}
      {!compact ? (
        <span
          className="mt-1 hidden h-px w-full bg-gradient-to-r from-[#84CC16]/60 via-[#84CC16]/20 to-transparent min-[420px]:block"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
