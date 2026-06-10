import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Reveal, Button, Section } from '../ui';

const DEFAULT_CTA = {
  title: 'Телефон не подает признаков жизни?',
  subtitle:
    'Не пытайтесь прошивать или восстанавливать устройство самостоятельно, если на нем есть важные данные. Напишите нам — мы подскажем, можно ли спасти файлы и само устройство.',
  buttonLabel: 'Запросить диагностику',
};

export default function CTASection({ data }) {
  const cta = { ...DEFAULT_CTA, ...data };

  return (
    <Section id="cta" bg="surface" className="overflow-hidden border-t border-[var(--border-subtle)]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] blur-[100px] rounded-full pointer-events-none transform-gpu z-0 transition-colors duration-700" style={{ background: 'var(--glow-accent)' }}></div>
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative z-10">
        <Reveal>
          <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
            <AlertTriangle className="w-10 h-10 text-[#84CC16] mb-6 opacity-80" strokeWidth={1.5} />
            <h2 className="text-[clamp(2rem,4vw,2.5rem)] font-medium text-[var(--text-primary)] mb-6 tracking-tight">{cta.title}</h2>
            <p className="text-[15px] md:text-[16px] text-[var(--text-secondary)] mb-12 max-w-[55ch] leading-relaxed font-normal">{cta.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto px-10" href="#contact">{cta.buttonLabel}</Button>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}