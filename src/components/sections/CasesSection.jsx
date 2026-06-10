import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Reveal, Card, Tag, MetaBadge, Section } from '../ui';

const CaseCard = ({ caseData }) => (
  <Card interactive className="p-8 h-full flex flex-col">
    <div className="flex justify-between items-start mb-6"><Tag active>{caseData.category}</Tag><span className="text-[10px] font-mono text-[var(--text-muted)] tracking-widest uppercase">ID: {caseData.id.split('-')[1]}</span></div>
    <div className="mb-2"><span className="text-[#84CC16] text-[12px] font-mono mb-1 block terminal-cursor">Проблема: {caseData.problem}</span><h3 className="text-[20px] font-medium text-[var(--text-primary)] tracking-tight">{caseData.title}</h3></div>
    <p className="text-[var(--text-secondary)] text-[14px] leading-relaxed mb-8 flex-1 font-normal">{caseData.desc}</p>
    <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-6 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] -mx-8 -mb-8 p-8 mt-auto">
      <MetaBadge label="Устройство" value={caseData.model} />
      <MetaBadge label="Файлы клиента" value={caseData.dataSaved} />
      <MetaBadge label="Статус системы" value={<span className="text-[#84CC16] flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />{caseData.status}</span>} />
    </div>
  </Card>
);

export default function CasesSection({ data, section }) {
  const meta = section ?? {};
  return (
    <Section id="cases">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <Reveal as="header"><div className="mb-16 md:mb-20"><span className="text-[#84CC16] text-[10px] font-mono uppercase tracking-widest block mb-3">{meta.eyebrow}</span><h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-medium text-[var(--text-primary)] mb-4 tracking-[-0.01em]">{meta.title}</h2><p className="text-[var(--text-secondary)] text-[clamp(0.9rem,1.5vw,1rem)] font-normal max-w-[60ch]">{meta.subtitle}</p></div></Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" role="list">
          {data.map((caseData, idx) => (<Reveal key={caseData.id} delay={idx * 100} role="listitem"><CaseCard caseData={caseData} /></Reveal>))}
        </div>
      </div>
    </Section>
  );
}