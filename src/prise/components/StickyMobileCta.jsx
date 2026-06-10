import React from 'react';
import { MessageCircle, Phone, Navigation } from 'lucide-react';
import { SocialIcon } from '../../components/icons/SocialIcons';

export default function StickyMobileCta({ phone, contacts = [], mapUrl }) {
  const telegram = contacts.find((c) => c.type === 'telegram');
  const whatsapp = contacts.find((c) => c.type === 'whatsapp');
  const telHref = phone ? `tel:${phone.replace(/\D/g, '').replace(/^8/, '7')}` : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--glass-bg)] px-3 py-3 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-center gap-2">
        {telegram?.url ? (
          <a
            href={telegram.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[13px] font-medium text-[var(--text-primary)] transition-all hover:border-[#84CC16]/30 active:scale-[0.98]"
          >
            <SocialIcon type="telegram" className="h-4 w-4" />
            Telegram
          </a>
        ) : null}
        {whatsapp?.url ? (
          <a
            href={whatsapp.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[13px] font-medium text-[var(--text-primary)] transition-all hover:border-[#84CC16]/30 active:scale-[0.98]"
          >
            <SocialIcon type="whatsapp" className="h-4 w-4" />
            WhatsApp
          </a>
        ) : null}
        {telHref ? (
          <a
            href={telHref}
            aria-label="Позвонить"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#84CC16] text-[#0A0A0C] shadow-[0_0_16px_rgba(132,204,22,0.25)] active:scale-[0.98]"
          >
            <Phone className="h-4 w-4" />
          </a>
        ) : null}
        {mapUrl ? (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Маршрут"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-medium)] bg-[var(--bg-elevated)] text-[var(--text-primary)] active:scale-[0.98]"
          >
            <Navigation className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

/** Десктопные CTA — полный ряд кнопок */
export function DesktopCta({ phone, contacts = [], mapUrl }) {
  const telegram = contacts.find((c) => c.type === 'telegram');
  const whatsapp = contacts.find((c) => c.type === 'whatsapp');
  const telHref = phone ? `tel:${phone.replace(/\D/g, '').replace(/^8/, '7')}` : null;

  const btn =
    'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[13px] font-medium transition-all duration-300 ease-premium active:scale-[0.98]';

  return (
    <div className="hidden flex-wrap items-center justify-center gap-3 md:flex">
      {telegram?.url ? (
        <a
          href={telegram.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} border border-[var(--border-medium)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[#84CC16]/30 hover:text-[#84CC16]`}
        >
          <MessageCircle className="h-4 w-4" />
          Telegram
        </a>
      ) : null}
      {whatsapp?.url ? (
        <a
          href={whatsapp.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} border border-[var(--border-medium)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[#84CC16]/30 hover:text-[#84CC16]`}
        >
          <SocialIcon type="whatsapp" className="h-4 w-4" />
          WhatsApp
        </a>
      ) : null}
      {telHref ? (
        <a
          href={telHref}
          className={`${btn} bg-[#84CC16] text-[#0A0A0C] shadow-[0_0_20px_rgba(132,204,22,0.2)] hover:bg-[#9BE02A]`}
        >
          <Phone className="h-4 w-4" />
          Позвонить
        </a>
      ) : null}
      {mapUrl ? (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]`}
        >
          <Navigation className="h-4 w-4" />
          Построить маршрут
        </a>
      ) : null}
    </div>
  );
}
