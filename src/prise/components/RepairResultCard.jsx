import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock } from 'lucide-react';

function formatRub(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RepairResultCard({ data }) {
  if (!data) return null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 px-6 py-8 sm:px-8 sm:py-10 shadow-[var(--shadow-card)] backdrop-blur-xl"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2 className="text-[22px] sm:text-[26px] font-medium tracking-[-0.03em] text-[var(--text-primary)] leading-tight">
          {data.model}
        </h2>
        {data.inStock ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#84CC16]/10 px-3 py-1.5 text-[12px] font-medium text-[#84CC16]">
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
            В наличии
          </span>
        ) : null}
      </div>

      <div className="space-y-1 mb-8">
        <p className="text-[15px] text-[var(--text-secondary)] tracking-[-0.01em]">
          {data.repairType}
        </p>
        <p className="text-[clamp(2rem,6vw,2.5rem)] font-medium tracking-[-0.04em] text-[var(--text-primary)] tabular-nums">
          {formatRub(data.totalPrice)}
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-elevated)]/80 px-4 py-3.5 border border-[var(--border-subtle)]">
        <Clock className="h-4 w-4 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} />
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] mb-0.5">
            Ремонт займёт
          </p>
          <p className="text-[14px] font-medium text-[var(--text-primary)] tracking-[-0.01em]">
            {data.repairTime}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
