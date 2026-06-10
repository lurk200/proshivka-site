import React from 'react';

export default function EmptyState({ title, description }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 px-6 py-10 text-center">
      <h3 className="text-[17px] font-medium tracking-[-0.02em] text-[var(--text-primary)] mb-2">
        {title ?? 'Нет в наличии'}
      </h3>
      <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed tracking-[-0.01em]">
        {description ??
          'По этой модели сейчас нет подходящей запчасти в Ставрополе. Свяжитесь с нами — уточним срок и стоимость.'}
      </p>
    </div>
  );
}
