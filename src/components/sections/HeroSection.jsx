import React from 'react';
import { Smartphone } from 'lucide-react';
import { Reveal, Button, TelemetryWidget } from '../ui';
import SafeImage from '../ui/SafeImage';
import ServiceNavGrid from './ServiceNavGrid';

export default function HeroSection({ data, showSoftwareRepairCta = false }) {
  const heroImage = data.imageUrl ?? '/images/placeholder.svg';
  return (
    <section id="hero" className="pt-32 pb-24 md:pt-[12rem] md:pb-32 overflow-hidden relative border-b border-[var(--border-subtle)] flex min-h-[90vh] items-center transition-colors duration-700">
      <div className="absolute inset-0 bg-diagnostic-grid z-0 pointer-events-none transition-opacity duration-700" style={{ opacity: 'var(--grid-opacity)' }}></div>
      <div className="absolute top-1/4 left-1/4 w-[800px] h-[600px] blur-[120px] rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-0 will-change-transform transition-colors duration-700" style={{ background: 'var(--glow-accent)' }}></div>

      <div className="container mx-auto px-6 lg:px-8 max-w-7xl grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center relative z-10">
        <div className="relative">
          <Reveal as="header">
            <h1 className="text-[clamp(2.5rem,5vw+1rem,4.5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)] mb-6 transition-all duration-700" style={{ textShadow: 'var(--text-shadow)' }}>
              {data.title}
            </h1>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-[clamp(1rem,1.5vw+0.5rem,1.125rem)] text-[var(--text-secondary)] mb-10 leading-relaxed max-w-[48ch] font-normal transition-colors duration-700">
              {data.subtitle}
            </p>
          </Reveal>
          <Reveal delay={150}>
            <TelemetryWidget data={data.telemetry} />
          </Reveal>
          <Reveal delay={200}>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button variant="primary" href="#contact">
                {data.primaryButton ?? 'Узнать стоимость восстановления'}
              </Button>
              <Button variant="secondary" href="#contact">
                {data.secondaryButton ?? 'Задать вопрос инженеру'}
              </Button>
            </div>
          </Reveal>

          <Reveal delay={250}>
            <ServiceNavGrid includeSoftwareRepair={showSoftwareRepairCta} />
          </Reveal>
        </div>
        <Reveal delay={300} className="relative w-full aspect-[4/3] lg:aspect-[4/5] max-h-[640px] flex items-center justify-center lg:justify-end group perspective-1000 z-10">
          <figure className="relative w-full h-full rounded-[24px] overflow-hidden border border-[var(--border-subtle)] shadow-[var(--shadow-card)] transform-gpu transition-transform duration-[1200ms] ease-premium">
            <div className="absolute inset-0 bg-diagnostic-grid mix-blend-overlay z-10 pointer-events-none transition-opacity duration-700" style={{ opacity: 'var(--grid-opacity)' }}></div>
            <SafeImage src={heroImage} alt="Диагностика" loading="eager" className="w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-[1500ms] ease-premium will-change-transform" style={{ opacity: 'var(--hero-img-opacity)', mixBlendMode: 'var(--hero-img-blend)' }} />
            <div className="absolute inset-0 pointer-events-none transition-colors duration-700" style={{ background: 'var(--hero-gradient)' }}></div>
            <figcaption className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
              <div className="w-32 h-32 rounded-full border border-[#84CC16]/20 flex items-center justify-center relative">
                <div className="absolute inset-0 border border-[#84CC16]/40 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                <Smartphone className="w-10 h-10 text-[#84CC16] opacity-80" strokeWidth={1} />
              </div>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
