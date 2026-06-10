import React, { useState } from 'react';
import { CheckCircle2, MonitorPlay, Battery, Shield, Layers } from 'lucide-react';
import { Reveal, Card } from '../../components/ui';
import {
  BATTERY_QUALITY_BLOCKS,
  DISPLAY_QUALITY_BLOCKS,
} from '../data/partQualityGuide';

const TABS = [
  { id: 'display', label: 'Дисплеи', icon: MonitorPlay },
  { id: 'battery', label: 'Аккумуляторы', icon: Battery },
];

const BLOCK_ICONS = [Shield, Layers];

function QualityBlockCard({ block, icon: Icon, delay }) {
  return (
    <Reveal delay={delay}>
      <Card className="p-6 md:p-8 h-full flex flex-col bg-[var(--bg-surface)] border-[var(--border-subtle)] shadow-[var(--shadow-soft)]">
        <Icon className="w-7 h-7 text-[#84CC16] mb-5" strokeWidth={1.5} />
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2 tracking-tight">
          {block.title}
        </h3>
        <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-5 flex-grow">
          {block.desc}
        </p>
        <ul className="space-y-2 pt-4 border-t border-[var(--border-subtle)]">
          {block.tags.map((tag) => (
            <li
              key={tag}
              className="flex items-start text-[13px] text-[var(--text-secondary)] leading-snug"
            >
              <CheckCircle2 className="w-4 h-4 text-[#84CC16] mr-2 flex-shrink-0 opacity-70 mt-0.5" />
              {tag}
            </li>
          ))}
        </ul>
      </Card>
    </Reveal>
  );
}

export default function PartQualityGuide() {
  const [tab, setTab] = useState('display');
  const blocks = tab === 'display' ? DISPLAY_QUALITY_BLOCKS : BATTERY_QUALITY_BLOCKS;

  return (
    <section
      id="part-quality-guide"
      className="scroll-mt-24 mt-12 sm:mt-14 py-12 sm:py-14 bg-[var(--bg-surface)] border-y border-[var(--border-subtle)]"
      aria-labelledby="part-quality-guide-title"
    >
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <Reveal className="mb-8">
          <span className="text-[10px] font-mono text-[#84CC16] uppercase tracking-widest block mb-2">
            Справочник
          </span>
          <h2
            id="part-quality-guide-title"
            className="text-xl font-medium text-[var(--text-primary)] tracking-tight"
          >
            Что означают варианты
          </h2>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)] leading-relaxed">
            Те же подписи, что в результатах поиска выше.
          </p>
        </Reveal>

        <Reveal delay={40} className="mb-6">
          <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3 text-center">
            Тип запчасти
          </p>
          <div className="flex gap-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium border transition-all duration-300 ${
                  tab === id
                    ? 'bg-[#84CC16]/10 border-[#84CC16]/30 text-[#84CC16]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-medium)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blocks.map((block, idx) => (
            <QualityBlockCard
              key={`${tab}-${block.title}`}
              block={block}
              icon={BLOCK_ICONS[idx] ?? Shield}
              delay={idx * 50}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
