import React from 'react';
import { motion } from 'framer-motion';
import RepairOptionCard from './RepairOptionCard';

export default function RepairResultsPanel({ data, intent }) {
  if (!data?.categories?.length) return null;

  const intentLabel = intent?.label ?? data.intent?.label;
  const multiCategory = data.categories.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full space-y-5"
    >
      <header className="px-0.5">
        <h2 className="text-[clamp(1.35rem,3.5vw,1.65rem)] font-medium tracking-[-0.03em] text-[var(--text-primary)]">
          {data.model}
        </h2>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">
          {intentLabel ? (
            <>
              <span className="text-[#84CC16]">{intentLabel}</span>
              <span className="mx-1.5 text-[var(--border-medium)]">·</span>
            </>
          ) : null}
          В наличии · Ставрополь
        </p>
      </header>

      <div
        className={
          multiCategory
            ? 'grid gap-4 lg:grid-cols-2 lg:items-start'
            : 'space-y-4'
        }
      >
        {data.categories.map((category, catIndex) => (
          <section
            key={category.repairType}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 p-3 sm:p-4 shadow-[var(--shadow-soft)] backdrop-blur-xl min-w-0"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
              <h3 className="text-[14px] font-medium tracking-[-0.02em] text-[var(--text-primary)]">
                {category.repairType}
              </h3>
              <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
                {category.options.length}{' '}
                {category.options.length === 1 ? 'вариант' : 'варианта'}
              </span>
            </div>

            <ul
              className="grid gap-2.5 sm:gap-3 grid-cols-[repeat(auto-fill,minmax(148px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(152px,1fr))]"
              role="list"
            >
              {category.options.map((option, optIndex) => (
                <motion.li
                  key={option.id}
                  className="min-w-0 list-none"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: catIndex * 0.04 + optIndex * 0.03,
                    duration: 0.28,
                  }}
                >
                  <RepairOptionCard option={option} compact />
                </motion.li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </motion.div>
  );
}
