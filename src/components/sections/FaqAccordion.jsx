import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Reveal } from '../ui';

function FAQItem({ question, answer, isOpen, onClick }) {
  return (
    <div className="border-b border-[var(--border-subtle)] last:border-0">
      <button
        type="button"
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
      >
        <span className="text-[17px] font-medium text-[var(--text-primary)] group-hover:text-[#84CC16] transition-colors pr-8">
          {question}
        </span>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-all duration-300 shrink-0 ${
            isOpen ? 'bg-[#84CC16]/10 border-[#84CC16]/20' : 'group-hover:border-[var(--border-medium)]'
          }`}
        >
          <ChevronDown
            className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-300 ${
              isOpen ? 'rotate-180 text-[#84CC16]' : ''
            }`}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-[var(--text-secondary)] text-[15px] leading-relaxed">{answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function FaqAccordion({ items = [], title = 'Частые вопросы', className = '' }) {
  const [openIndex, setOpenIndex] = useState(0);

  if (!items.length) return null;

  return (
    <section className={`py-20 lg:py-28 bg-[var(--bg-base)] transition-colors duration-700 ${className}`}>
      <div className="container mx-auto px-6 lg:px-8 max-w-3xl">
        <Reveal className="text-center mb-16">
          <HelpCircle className="w-8 h-8 text-[#84CC16] mx-auto mb-6 opacity-80" strokeWidth={1.5} />
          <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] tracking-tight">{title}</h2>
        </Reveal>
        <Reveal delay={80}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[24px] p-6 md:p-10 shadow-[var(--shadow-card)]">
            {items.map((item, idx) => (
              <FAQItem
                key={item.question}
                question={item.question}
                answer={item.answer}
                isOpen={openIndex === idx}
                onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
