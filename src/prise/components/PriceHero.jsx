import React from 'react';
import { Reveal } from '../../components/ui';

export default function PriceHero() {
  return (
    <section className="relative pb-10 pt-[calc(3.75rem+env(safe-area-inset-top,0px))] sm:pb-12 sm:pt-[calc(5.5rem+env(safe-area-inset-top,0px))] md:pt-36">
      <div
        className="pointer-events-none absolute inset-0 bg-diagnostic-grid opacity-[var(--grid-opacity)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-full max-w-xl -translate-x-1/2 rounded-full blur-[100px]"
        style={{ background: 'var(--glow-accent)' }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-lg px-4 text-center sm:px-6">
        <Reveal immediate>
          <h1
            className="text-[clamp(1.75rem,5vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)] mb-3"
            style={{ textShadow: 'var(--text-shadow)' }}
          >
            Узнайте стоимость ремонта
          </h1>
        </Reveal>
        <Reveal delay={80} immediate>
          <p className="text-[15px] sm:text-[17px] text-[var(--text-secondary)] leading-relaxed tracking-[-0.01em]">
            Актуальная цена и наличие в Ставрополе
          </p>
        </Reveal>
      </div>
    </section>
  );
}
