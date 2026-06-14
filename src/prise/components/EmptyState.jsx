import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function EmptyState({ title, description }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 px-6 py-10 text-center">
      <h3 className="text-[17px] font-medium tracking-[-0.02em] text-[var(--text-primary)] mb-2">
        {title ?? 'Нет в наличии'}
      </h3>
      <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed tracking-[-0.01em] mb-5">
        {description ??
          'По этой модели сейчас нет подходящей запчасти в Ставрополе. Свяжитесь с нами — уточним срок и стоимость.'}
      </p>
      <Link
        to="/otpravit-v-remont"
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-medium)] text-[14px] font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
      >
        Отправить в ремонт
        <ArrowRight className="w-4 h-4 shrink-0" />
      </Link>
    </div>
  );
}
