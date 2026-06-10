import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Reveal, Card, Section } from '../ui';

const ServiceCardSoftware = ({ service }) => (
  <Card interactive className="p-8 md:p-10 h-full flex flex-col group glow-accent bg-[var(--bg-base)] border-[var(--border-subtle)]">
    <div className="absolute inset-0 bg-gradient-to-b from-[#84CC16]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    <div className="relative z-10 flex flex-col h-full">
      <div className="w-12 h-12 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--border-medium)] flex items-center justify-center mb-8 shadow-[inset_0_1px_0_rgba(132,204,22,0.1)] group-hover:bg-[#84CC16]/10 group-hover:border-[var(--border-accent-hover)] transition-colors duration-500 ease-premium">
         <service.icon className="w-5 h-5 text-[#84CC16]" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h3 className="text-[20px] md:text-[22px] font-medium text-[var(--text-primary)] mb-3 tracking-tight">{service.title}</h3>
      <p className="text-[var(--text-secondary)] text-[15px] leading-relaxed max-w-[40ch] font-normal mb-6 flex-1">{service.desc}</p>
      <div className="flex items-center text-[#84CC16] text-[13px] font-mono tracking-wide mt-auto opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-premium">
        Подробнее о процедуре <ArrowRight className="w-4 h-4 ml-2" />
      </div>
    </div>
  </Card>
);

export default function ServicesSection({ data, section }) {
  const meta = section ?? {};
  return (
    <Section id="services" bg="surface" className="border-b border-[var(--border-subtle)]">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative z-10">
        <Reveal as="header"><div className="mb-16 md:mb-20 max-w-[65ch]"><span className="text-[#84CC16] text-[10px] font-mono uppercase tracking-widest block mb-3">{meta.eyebrow}</span><h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-medium text-[var(--text-primary)] mb-4 tracking-[-0.01em]">{meta.title}</h2><p className="text-[var(--text-secondary)] text-[clamp(0.9rem,1.5vw,1rem)] leading-relaxed font-normal">{meta.subtitle}</p></div></Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16" role="list">{data.featured.map((service, idx) => (<Reveal key={service.id} delay={idx * 100} role="listitem"><ServiceCardSoftware service={service} /></Reveal>))}</div>
      </div>
    </Section>
  );
}