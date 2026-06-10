import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Reveal } from '../ui';

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
};

export default function WorksCarousel({ works }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const total = works.length;

  if (total === 0) return null;

  const current = works[index];

  const go = useCallback(
    (step) => {
      setDirection(step);
      setIndex((prev) => (prev + step + total) % total);
    },
    [total],
  );

  return (
    <div className="w-full min-w-0">
      <div className="relative overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]">
        <div className="relative aspect-[16/10] sm:aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.article
              key={current.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img
                src={current.image}
                alt={current.title}
                className="banner-card-img absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 z-[1] bg-diagnostic-grid mix-blend-overlay pointer-events-none banner-card-grid" />
              <div
                className="absolute inset-0 z-[2] pointer-events-none"
                style={{ background: 'var(--hero-gradient)' }}
              />
              <div className="absolute inset-0 z-[3] bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/70 to-transparent pointer-events-none" />

              <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 sm:p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex px-2.5 py-1 rounded-full bg-[#84CC16]/15 border border-[#84CC16]/25 text-[10px] font-mono uppercase tracking-wider text-[#84CC16]">
                    {current.category}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">{current.model}</span>
                </div>
                <h3 className="text-[18px] sm:text-xl md:text-2xl font-medium text-[var(--text-primary)] mb-2 tracking-tight">
                  {current.title}
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[var(--text-secondary)] leading-relaxed max-w-2xl line-clamp-2 sm:line-clamp-none">
                  {current.summary}
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-mono text-[#84CC16]">
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                  {current.status}
                </p>
              </div>
            </motion.article>
          </AnimatePresence>

          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Предыдущая работа"
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 w-10 h-10 rounded-full bg-[var(--glass-bg)] border border-[var(--border-medium)] backdrop-blur-md flex items-center justify-center text-[var(--text-primary)] hover:border-[#84CC16]/40 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Следующая работа"
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 w-10 h-10 rounded-full bg-[var(--glass-bg)] border border-[var(--border-medium)] backdrop-blur-md flex items-center justify-center text-[var(--text-primary)] hover:border-[#84CC16]/40 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <div className="flex gap-1.5">
            {works.map((w, i) => (
              <button
                key={w.id}
                type="button"
                aria-label={`Слайд ${i + 1}`}
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-[#84CC16]' : 'w-1.5 bg-[var(--border-medium)] hover:bg-[var(--text-muted)]'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)] tabular-nums">
            {index + 1} / {total}
          </span>
        </div>
      </div>
    </div>
  );
}

export function WorksCarouselHeader({ section, showAllLink = false }) {
  return (
    <Reveal className="mb-5 md:mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <span className="text-[#84CC16] text-[10px] font-mono uppercase tracking-widest block mb-2">
          {section?.eyebrow ?? 'Портфолио'}
        </span>
        <h3 className="text-[clamp(1.25rem,3vw,1.75rem)] font-medium text-[var(--text-primary)] tracking-tight">
          {section?.title ?? 'Наши работы'}
        </h3>
        <p className="text-[var(--text-secondary)] text-[13px] sm:text-[14px] mt-2 max-w-xl">
          {section?.subtitle ??
            'Краткие отчёты о реальных восстановлениях — листайте, чтобы увидеть типовые кейсы.'}
        </p>
      </div>
      {showAllLink ? (
        <Link to="/nashi-raboty" className="text-[12px] font-mono text-[#84CC16] hover:underline shrink-0">
          Все работы →
        </Link>
      ) : null}
    </Reveal>
  );
}
