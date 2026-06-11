import React from 'react';
import { Link } from 'react-router-dom';

import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Clock,
  Phone,
  Navigation,
  ExternalLink,
  Truck,
  Package,
  Building2,
  Send,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import FaqAccordion from '../components/sections/FaqAccordion';
import { Reveal, Card } from '../components/ui';
import { SocialLinksRow } from '../components/ui/SocialLinks';
import { useCms } from '../context/CmsContext';
import { getActiveSocialContacts } from '../utils/socialContacts';
import { getAskMasterChannels, getTelHref, withWhatsappText } from '../utils/contactActions';
import YandexMapBlock from '../components/ui/YandexMapBlock';
import { trackCta } from '../hooks/useAnalytics';

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#84CC16]/10 border border-[#84CC16]/20">
        <Icon className="h-5 w-5 text-[#84CC16]" strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        {label ? (
          <p className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-1">
            {label}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export default function SendRepairPage() {
  const { cmsData } = useCms();
  const { company, sendRepair, mainHome } = cmsData;
  const about = mainHome.about;
  const map = about.yandexMap;
  const socialContacts = getActiveSocialContacts(company.contacts);
  const phoneHref = getTelHref(company.phone);
  const channels = getAskMasterChannels(company.contacts);

  const whatsappRepair = company.contacts?.find((c) => c.type === 'whatsapp');
  const whatsappHref = whatsappRepair?.url
    ? withWhatsappText(
        whatsappRepair.url,
        'Здравствуйте! Хочу отправить устройство в ремонт. Город: ',
      )
    : null;

  return (
    <PageTransition>
      <section className="relative overflow-hidden bg-[var(--bg-base)] pt-32 pb-16 md:pt-44 md:pb-20">
        <div
          className="pointer-events-none absolute inset-0 bg-diagnostic-grid mix-blend-overlay"
          style={{ opacity: 'var(--grid-opacity)' }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-full max-w-3xl -translate-x-1/2 rounded-full blur-[120px]"
          style={{ background: 'var(--glow-accent)' }}
        />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <Link
              to="/"
              className="group mb-10 inline-flex items-center text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:text-[#84CC16]"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              На главную
            </Link>
          </Reveal>

          <Reveal delay={80}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#84CC16]/25 bg-[#84CC16]/10 px-4 py-2">
              <Send className="h-4 w-4 text-[#84CC16]" strokeWidth={1.75} />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#84CC16]">
                {sendRepair.hero.eyebrow}
              </span>
            </div>
            <h1 className="max-w-3xl text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.08] tracking-[-0.03em] text-[var(--text-primary)]">
              {sendRepair.hero.title}
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)] sm:text-[17px]">
              {sendRepair.hero.subtitle}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Способы */}
      <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-base)] py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Reveal delay={0}>
              <Card className="h-full p-5 sm:p-6 border-[var(--border-subtle)]">
                <Building2 className="mb-4 h-8 w-8 text-[#84CC16]" strokeWidth={1.5} />
                <h2 className="text-[17px] font-medium text-[var(--text-primary)] mb-2">
                  {sendRepair.onsite.title}
                </h2>
                <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">
                  {sendRepair.onsite.description}
                </p>
                {map.openUrl ? (
                  <a
                    href={map.openUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackCta('map_route', 'send_repair_card')}
                    className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#84CC16] hover:underline"
                  >
                    Построить маршрут
                    <Navigation className="h-4 w-4" />
                  </a>
                ) : null}
              </Card>
            </Reveal>

            <Reveal delay={60}>
              <Card className="h-full p-5 sm:p-6 border-[#84CC16]/30 bg-[#84CC16]/[0.04] relative overflow-hidden">
                <span className="absolute right-4 top-4 rounded-full bg-[#84CC16] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0A0A0C]">
                  {sendRepair.cityDelivery.badge}
                </span>
                <Truck className="mb-4 h-8 w-8 text-[#84CC16]" strokeWidth={1.5} />
                <h2 className="text-[17px] font-medium text-[var(--text-primary)] mb-2 pr-20">
                  {sendRepair.cityDelivery.title}
                </h2>
                <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] mb-4">
                  {sendRepair.cityDelivery.description}
                </p>
                <ul className="space-y-2">
                  {sendRepair.cityDelivery.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#84CC16]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>

            <Reveal delay={120}>
              <Card className="h-full p-5 sm:p-6 border-[var(--border-subtle)]">
                <Package className="mb-4 h-8 w-8 text-[#84CC16]" strokeWidth={1.5} />
                <h2 className="text-[17px] font-medium text-[var(--text-primary)] mb-2">
                  {sendRepair.regions.title}
                </h2>
                <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] mb-4">
                  {sendRepair.regions.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sendRepair.regions.yandexDeliveryUrl ? (
                    <a
                      href={sendRepair.regions.yandexDeliveryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-medium)] bg-[var(--bg-elevated)] px-3 py-2 text-[12px] font-medium text-[var(--text-primary)] hover:border-[#84CC16]/40 hover:text-[#84CC16] transition-colors"
                    >
                      Яндекс Доставка
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Регионы — шаги */}
      <section className="border-t border-[var(--border-subtle)] py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-8 max-w-2xl">
            <span className="mb-3 block font-mono text-[10px] uppercase tracking-widest text-[#84CC16]">
              {sendRepair.regionsSection?.eyebrow ?? 'Из регионов'}
            </span>
            <h2 className="text-[clamp(1.35rem,3vw,1.75rem)] font-medium tracking-tight text-[var(--text-primary)]">
              {sendRepair.regionsSection?.title ?? 'Как отправить устройство'}
            </h2>
          </Reveal>

          <ol className="grid gap-4 sm:grid-cols-2">
            {sendRepair.regions.steps.map((step, idx) => (
              <Reveal key={step.title} delay={idx * 50}>
                <li className="list-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
                  <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-elevated)] font-mono text-[13px] text-[#84CC16]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">
                    {step.text}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>

          {sendRepair.regions.postNote ? (
            <Reveal delay={200} className="mt-6">
              <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-4 py-3 text-[13px] text-[var(--text-muted)]">
                {sendRepair.regions.postNote}
              </p>
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* Контакты + карта */}
      <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-8">
            <span className="mb-3 block font-mono text-[10px] uppercase tracking-widest text-[#84CC16]">
              {sendRepair.contactsSection?.eyebrow ?? 'Контакты'}
            </span>
            <h2 className="text-[clamp(1.35rem,3vw,1.75rem)] font-medium tracking-tight text-[var(--text-primary)]">
              {sendRepair.contactsSection?.title ?? 'Как с нами связаться'}
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            <Reveal delay={50}>
              <div className="flex flex-col gap-5">
                <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-soft)]">
                  <InfoRow icon={MapPin} label="Адрес">
                    <p className="text-[15px] leading-relaxed text-[var(--text-primary)]">
                      {company.address}
                    </p>
                  </InfoRow>

                  <div className="mt-5 space-y-4 border-t border-[var(--border-subtle)] pt-5">
                    <InfoRow icon={Clock} label="Режим работы">
                      <p className="text-[14px] text-[var(--text-secondary)]">{company.schedule}</p>
                    </InfoRow>
                    {phoneHref ? (
                      <InfoRow icon={Phone} label="Телефон">
                        <a
                          href={phoneHref}
                          onClick={() => trackCta('phone', 'send_repair')}
                          className="text-[15px] font-medium text-[var(--text-primary)] hover:text-[#84CC16] transition-colors tabular-nums"
                        >
                          {company.phone}
                        </a>
                      </InfoRow>
                    ) : null}
                  </div>

                  {socialContacts.length > 0 ? (
                    <div className="mt-5 border-t border-[var(--border-subtle)] pt-5">
                      <SocialLinksRow contacts={socialContacts} variant="pill" label="Мессенджеры" />
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-5">
                    {map.openUrl ? (
                      <a
                        href={map.openUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackCta('map_route', 'send_repair')}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#84CC16] px-4 py-2.5 text-[13px] font-semibold text-[#0A0A0C] shadow-[0_0_16px_rgba(132,204,22,0.25)] hover:bg-[#9BE02A] transition-colors"
                      >
                        <Navigation className="h-4 w-4" />
                        Построить маршрут
                      </a>
                    ) : null}
                    {whatsappHref ? (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackCta('whatsapp', 'send_repair')}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-medium)] bg-[var(--bg-elevated)] px-4 py-2.5 text-[13px] font-medium text-[var(--text-primary)] hover:border-[#84CC16]/40 hover:text-[#84CC16] transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Написать о отправке
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6">
                  <h3 className="mb-3 text-[15px] font-medium text-[var(--text-primary)]">
                    {sendRepair.beforeSend.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {sendRepair.beforeSend.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-[13px] leading-relaxed text-[var(--text-secondary)]"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#84CC16]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <YandexMapBlock map={about.yandexMap} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {sendRepair.faq?.length ? (
        <section className="border-t border-[var(--border-subtle)] py-12 md:py-16">
          <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mb-8 text-center">
              <h2 className="text-[clamp(1.25rem,3vw,1.5rem)] font-medium text-[var(--text-primary)]">
                {sendRepair.faqSection?.title ?? 'Частые вопросы'}
              </h2>
            </Reveal>
            <FaqAccordion items={sendRepair.faq} />
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="border-t border-[var(--border-subtle)] py-14 md:py-16">
        <div className="container mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <h2 className="text-[clamp(1.25rem,3vw,1.65rem)] font-medium text-[var(--text-primary)] mb-3">
              {sendRepair.bottomCta?.title ?? 'Готовы принять ваше устройство'}
            </h2>
            <p className="text-[15px] text-[var(--text-secondary)] mb-8">
              {sendRepair.bottomCta?.subtitle ??
                'Напишите модель и симптом — подскажем способ доставки и ориентир по срокам.'}
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              {channels.slice(0, 2).map((ch) => (
                <a
                  key={ch.type}
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCta(ch.type, 'send_repair_cta')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-surface)] px-5 py-3 text-[14px] font-medium text-[var(--text-primary)] hover:border-[#84CC16]/40 hover:text-[#84CC16] transition-colors"
                >
                  {ch.label}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ))}
              <Link
                to="/prise"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#84CC16] px-5 py-3 text-[14px] font-semibold text-[#0A0A0C] hover:bg-[#9BE02A] transition-colors"
              >
                Узнать стоимость
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}
