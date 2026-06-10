import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Terminal,
  Activity,
  Clock,
  CheckCircle2,
  Unlock,
  FileCode2,
  Database,
  ShieldCheck,
  Search,
  Phone,
  MessageCircle,
  Smartphone,
} from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import FaqAccordion from '../components/sections/FaqAccordion';
import { Reveal } from '../components/ui';
import { useCms } from '../context/CmsContext';

const SYMPTOM_ICONS = [Terminal, Unlock, FileCode2, Database, ShieldCheck, Activity];

function buildSymptoms(tags = []) {
  const defaults = [
    { title: 'Зависание на логотипе', desc: 'Устройство не проходит загрузку или уходит в бесконечную перезагрузку (bootloop).' },
    { title: 'Разблокировка аккаунтов', desc: 'Сброс FRP, Mi-аккаунта, графического ключа без потери данных, где это возможно.' },
    { title: 'Сбой после обновления', desc: '«Кирпич» после OTA или неудачной самостоятельной прошивки — восстанавливаем загрузчик и систему.' },
    { title: 'Спасение данных', desc: 'Извлечение фото и документов с не включающихся или залитых устройств.' },
    { title: 'Снятие паролей', desc: 'Официальные методы снятия блокировок экрана и привязок к аккаунтам.' },
  ];

  return (tags.length ? tags : defaults.map((d) => d.title)).map((tag, idx) => ({
    icon: SYMPTOM_ICONS[idx % SYMPTOM_ICONS.length],
    title: typeof tag === 'string' ? tag : defaults[idx]?.title ?? 'Симптом',
    desc: defaults[idx]?.desc ?? 'Диагностика и восстановление в лаборатории ПРОШИВКА.',
  }));
}

export default function SoftwareRepairPage() {
  const { cmsData } = useCms();
  const page = cmsData.softwareRepair;
  const template = cmsData.serviceTemplate;
  const { company } = cmsData;
  const phoneHref = `tel:${company.phone.replace(/\D/g, '')}`;
  const telegramUrl = company.contacts?.find((c) => c.type === 'telegram')?.url;
  const symptoms = buildSymptoms(page.hero?.tags);
  const services = page.services?.featured ?? [];
  const cases = page.portfolio ?? [];
  const principles = page.principles ?? [];
  const process = template.process ?? [];
  const faq = template.faq ?? [];
  const cta = page.cta ?? {};
  const sections = page.sections ?? {};

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative pt-40 pb-24 md:pt-56 md:pb-32 overflow-hidden bg-[var(--bg-base)] transition-colors duration-700">
        <div
          className="absolute inset-0 bg-diagnostic-grid pointer-events-none mix-blend-overlay"
          style={{ opacity: 'var(--grid-opacity)' }}
        />
        <div
          className="absolute top-1/4 right-1/4 w-[900px] h-[700px] blur-[180px] rounded-full pointer-events-none opacity-60"
          style={{ background: 'var(--glow-accent)' }}
        />

        <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative z-10">
          <Reveal>
            <Link
              to="/"
              className="inline-flex items-center text-[13px] font-medium text-[var(--text-muted)] hover:text-[#84CC16] transition-colors group mb-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              НАЗАД НА ГЛАВНУЮ
            </Link>
          </Reveal>

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-center">
            <div>
              <Reveal delay={100}>
                <div className="inline-flex items-center gap-3 mb-8 px-4 py-2 rounded-full bg-[#84CC16]/10 border border-[#84CC16]/25 backdrop-blur-md">
                  <Terminal className="w-4 h-4 text-[#84CC16]" strokeWidth={1.75} />
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#84CC16]">
                    Программное восстановление
                  </span>
                </div>
              </Reveal>
              <Reveal delay={150}>
                <h1 className="text-[clamp(2.25rem,5vw,4rem)] font-medium text-[var(--text-primary)] leading-[1.05] tracking-tight mb-8">
                  {page.hero?.title}
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-[var(--text-secondary)] text-lg md:text-xl leading-relaxed max-w-2xl mb-12">
                  {page.hero?.subtitle}
                </p>
              </Reveal>
              <Reveal delay={250}>
                <div className="flex flex-wrap gap-8">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)] mb-2">
                      Статус
                    </span>
                    <span className="text-[var(--text-primary)] font-medium text-lg">
                      {page.hero?.telemetry?.status}
                    </span>
                  </div>
                  <div className="w-px h-10 bg-[var(--border-subtle)] self-center hidden sm:block" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)] mb-2">
                      Диагностика
                    </span>
                    <span className="text-[var(--text-primary)] font-medium text-lg">
                      {page.hero?.telemetry?.diagTime}
                    </span>
                  </div>
                  <div className="w-px h-10 bg-[var(--border-subtle)] self-center hidden sm:block" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)] mb-2">
                      Успех
                    </span>
                    <span className="text-[var(--text-primary)] font-medium text-lg">
                      {page.hero?.telemetry?.successRate}
                    </span>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal delay={300} className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
                <div className="absolute inset-8 rounded-[32px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 backdrop-blur-xl shadow-[var(--shadow-card)]" />
                <div className="relative z-10 flex flex-col items-center text-center p-10">
                  <div className="w-24 h-24 rounded-[24px] bg-[#84CC16]/10 border border-[#84CC16]/25 flex items-center justify-center mb-6">
                    <Smartphone className="w-11 h-11 text-[#84CC16]" strokeWidth={1.5} />
                  </div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#84CC16] mb-2">
                    Recovery mode
                  </p>
                  <p className="text-[14px] text-[var(--text-secondary)] max-w-[220px] leading-relaxed">
                    Низкоуровневая прошивка, разблокировка и извлечение данных
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Симптомы */}
      <section className="py-24 md:py-32 bg-[var(--bg-surface)] border-y border-[var(--border-subtle)]">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          <Reveal className="mb-16 text-center max-w-2xl mx-auto">
            <span className="text-[#84CC16] text-[11px] font-medium uppercase tracking-[0.12em] block mb-4">
              Когда обращаться
            </span>
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] tracking-tight">
              Типовые программные сбои
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {symptoms.map((item, idx) => (
              <Reveal key={item.title} delay={idx * 50}>
                <div className="h-full p-8 rounded-[24px] bg-[var(--bg-base)] border border-[var(--border-subtle)] shadow-[var(--shadow-soft)] hover:border-[var(--border-accent-hover)] hover:shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-6">
                    <item.icon className="w-6 h-6 text-[#84CC16]" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-[18px] font-medium text-[var(--text-primary)] mb-3 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Услуги — только программные */}
      <section id="services" className="py-24 md:py-32 bg-[var(--bg-base)]">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          <Reveal className="mb-14 max-w-2xl">
            <span className="text-[#84CC16] text-[11px] font-medium uppercase tracking-[0.12em] block mb-3">
              {sections.services?.eyebrow}
            </span>
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] tracking-tight mb-4">
              {sections.services?.title}
            </h2>
            <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
              {sections.services?.subtitle}
            </p>
          </Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <Reveal key={service.id} delay={idx * 60}>
                  <div className="group h-full p-8 md:p-10 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] hover:border-[var(--border-accent-hover)] hover:shadow-[var(--shadow-card)] transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-[#84CC16]/10 border border-[#84CC16]/20 flex items-center justify-center mb-6">
                      {Icon ? <Icon className="w-6 h-6 text-[#84CC16]" strokeWidth={1.75} /> : null}
                    </div>
                    <h3 className="text-[20px] font-medium text-[var(--text-primary)] mb-3 tracking-tight">
                      {service.title}
                    </h3>
                    <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">{service.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal delay={120} className="mt-10">
            <p className="text-[13px] text-[var(--text-muted)]">
              Аппаратный ремонт (стекло, аккумулятор, влага, модули) —{' '}
              <Link to="/" className="text-[#84CC16] hover:underline">
                на главной странице
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      {/* Кейсы */}
      {cases.length > 0 ? (
        <section id="cases" className="py-24 md:py-32 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)]">
          <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
            <Reveal className="mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="max-w-2xl">
                <span className="text-[#84CC16] text-[11px] font-medium uppercase tracking-[0.12em] block mb-3">
                  {sections.portfolio?.eyebrow}
                </span>
                <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] tracking-tight mb-3">
                  {sections.portfolio?.title}
                </h2>
                <p className="text-[15px] text-[var(--text-secondary)]">{sections.portfolio?.subtitle}</p>
              </div>
              <Link
                to="/nashi-raboty"
                className="inline-flex items-center gap-2 text-[13px] font-medium text-[#84CC16] hover:underline shrink-0"
              >
                Все работы
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {cases.map((item, idx) => (
                <Reveal key={item.id} delay={idx * 60}>
                  <article className="h-full flex flex-col p-6 sm:p-8 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-[var(--shadow-soft)] hover:border-[var(--border-accent-hover)] transition-all duration-300">
                    <span className="inline-flex self-start px-2.5 py-1 rounded-full bg-[#84CC16]/10 border border-[#84CC16]/20 text-[10px] font-medium uppercase tracking-wide text-[#84CC16] mb-4">
                      {item.category}
                    </span>
                    <p className="text-[12px] text-[var(--text-muted)] mb-1">{item.model}</p>
                    <h3 className="text-[18px] font-medium text-[var(--text-primary)] mb-3">{item.title}</h3>
                    <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed flex-1 mb-6">
                      {item.desc}
                    </p>
                    <p className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#84CC16] pt-4 border-t border-[var(--border-subtle)]">
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                      {item.status}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Принципы */}
      {principles.length > 0 ? (
        <section className="py-24 md:py-32 bg-[var(--bg-base)]">
          <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
            <Reveal className="mb-14 text-center max-w-2xl mx-auto">
              <span className="text-[#84CC16] text-[11px] font-medium uppercase tracking-[0.12em] block mb-3">
                {sections.principles?.eyebrow}
              </span>
              <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] tracking-tight mb-4">
                {sections.principles?.title}
              </h2>
              <p className="text-[15px] text-[var(--text-secondary)]">{sections.principles?.subtitle}</p>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {principles.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.id} delay={idx * 60}>
                    <div className="h-full p-8 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center sm:text-left">
                      <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-5 mx-auto sm:mx-0">
                        {Icon ? <Icon className="w-6 h-6 text-[#84CC16]" strokeWidth={1.75} /> : null}
                      </div>
                      <h3 className="text-[18px] font-medium text-[var(--text-primary)] mb-3">{item.title}</h3>
                      <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Процесс */}
      {process.length > 0 ? (
        <section className="py-24 md:py-32 bg-[var(--bg-surface)] border-y border-[var(--border-subtle)]">
          <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
            <Reveal className="mb-16">
              <span className="text-[#84CC16] text-[11px] font-medium uppercase tracking-[0.12em] block mb-3">
                {template.processSection?.eyebrow}
              </span>
              <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] tracking-tight">
                {template.processSection?.title}
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {process.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.title} delay={idx * 50}>
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-[20px] bg-[var(--bg-base)] border border-[var(--border-medium)] flex items-center justify-center mb-5 shadow-[var(--shadow-soft)] group-hover:border-[#84CC16]/30 transition-colors">
                        {Icon ? (
                          <Icon className="w-7 h-7 text-[var(--text-secondary)] group-hover:text-[#84CC16] transition-colors" strokeWidth={1.75} />
                        ) : null}
                        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[10px] font-medium text-[var(--text-muted)]">
                          {idx + 1}
                        </span>
                      </div>
                      <h4 className="text-[16px] font-medium text-[var(--text-primary)] mb-2">{step.title}</h4>
                      <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <FaqAccordion items={faq} title={template.faqSection?.title} />

      {/* CTA */}
      <section id="contact" className="py-24 md:py-32 relative overflow-hidden bg-[var(--bg-base)]">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-[120px] rounded-full pointer-events-none"
          style={{ background: 'var(--glow-accent)' }}
        />
        <div className="container mx-auto px-6 lg:px-8 max-w-4xl relative z-10 text-center">
          <Reveal>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-[#84CC16]/10 border border-[#84CC16]/20 mb-8">
              <Terminal className="w-8 h-8 text-[#84CC16]" strokeWidth={1.75} />
            </div>
            <h2 className="text-3xl md:text-5xl font-medium text-[var(--text-primary)] mb-6 tracking-tight">
              {cta.title}
            </h2>
            <p className="text-[var(--text-secondary)] text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              {cta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {telegramUrl ? (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-4 rounded-xl bg-[#84CC16] text-[#0A0A0C] font-semibold text-[15px] hover:bg-[#9BE02A] transition-all duration-300 shadow-[0_0_20px_rgba(132,204,22,0.25)]"
                >
                  <MessageCircle className="w-5 h-5" strokeWidth={1.75} />
                  {template.bottomCta?.telegramLabel ?? 'Написать в Telegram'}
                </a>
              ) : null}
              <a
                href={phoneHref}
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-4 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-medium)] hover:border-[#84CC16]/30 font-medium text-[15px] transition-all duration-300"
              >
                <Phone className="w-5 h-5 text-[#84CC16]" strokeWidth={1.75} />
                {company.phone}
              </a>
              <Link
                to="/#about"
                className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-4 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] font-medium text-[15px] transition-all duration-300"
              >
                {template.bottomCta?.siteLabel ?? 'Контакты на сайте'}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}
