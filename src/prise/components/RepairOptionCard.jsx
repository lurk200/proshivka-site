import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { qualityBadgeClass } from '../partQualityStyles';

function formatRub(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RepairOptionCard({ option, compact = true }) {
  if (compact) {
    return (
      <div className="flex h-full min-h-[132px] flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-3 transition-colors hover:border-[var(--border-medium)] hover:bg-[var(--bg-elevated)]">
        <div className="mb-2 flex items-start justify-between gap-2">
          <span
            className={`inline-flex max-w-[85%] items-center rounded-lg border px-2 py-0.5 text-[10px] font-medium leading-tight ${qualityBadgeClass(option.qualityLabel)}`}
          >
            {option.qualityLabel}
          </span>
          {option.inStock ? (
            <CheckCircle2
              className="h-3.5 w-3.5 shrink-0 text-[#84CC16]"
              strokeWidth={2.5}
              aria-label="В наличии"
            />
          ) : null}
        </div>

        {option.variant ? (
          <p className="mb-auto text-[11px] leading-snug text-[var(--text-muted)] line-clamp-2 min-h-[2.5em]">
            {option.variant}
          </p>
        ) : (
          <span className="mb-auto min-h-[2.5em]" aria-hidden />
        )}

        <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]/80">
          <p className="text-[18px] font-medium tracking-[-0.03em] text-[var(--text-primary)] tabular-nums leading-none">
            {formatRub(option.totalPrice)}
          </p>
          <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
            <Clock className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            {option.repairTime}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 p-4 sm:p-5 transition-colors hover:border-[var(--border-medium)]">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <span
          className={`inline-flex items-center rounded-xl border px-2.5 py-1 text-[11px] font-medium tracking-wide ${qualityBadgeClass(option.qualityLabel)}`}
        >
          {option.qualityLabel}
        </span>
        {option.inStock ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#84CC16]">
            <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
            В наличии
          </span>
        ) : null}
      </div>

      {option.variant ? (
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2">
          {option.variant}
        </p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-[22px] font-medium tracking-[-0.03em] text-[var(--text-primary)] tabular-nums">
          {formatRub(option.totalPrice)}
        </p>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
          <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
          {option.repairTime}
        </span>
      </div>
    </div>
  );
}
