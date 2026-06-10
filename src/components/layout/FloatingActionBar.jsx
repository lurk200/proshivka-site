import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, MessageCircle, Phone, Wrench } from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { SocialIcon } from '../icons/SocialIcons';
import { getAskMasterChannels, getTelHref } from '../../utils/contactActions';

function AskMasterPanel({ channels, phone, phoneHref, onClose }) {
  return (
    <div
      className="mb-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/98 p-2 shadow-[0_8px_28px_rgba(0,0,0,0.4)] backdrop-blur-xl"
      role="dialog"
      aria-label="Связаться с мастером"
    >
      <p className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
        Напишите или позвоните
      </p>

      {channels.length > 0 ? (
        <ul className="space-y-1">
          {channels.map((channel) => (
            <li key={channel.type}>
              <a
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[#84CC16]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                  <SocialIcon type={channel.type} className="h-4 w-4" />
                </span>
                {channel.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {phoneHref ? (
        <a
          href={phoneHref}
          onClick={onClose}
          className={`flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-[13px] font-medium transition-colors hover:bg-[#84CC16]/10 hover:text-[#84CC16] ${
            channels.length > 0 ? 'mt-1 border-t border-[var(--border-subtle)] pt-2' : ''
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#84CC16]/15 text-[#84CC16]">
            <Phone className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="flex flex-col min-w-0">
            <span className="text-[11px] text-[var(--text-muted)] font-normal">Позвонить</span>
            <span className="tabular-nums tracking-tight">{phone}</span>
          </span>
        </a>
      ) : null}
    </div>
  );
}

export default function FloatingActionBar() {
  const { cmsData } = useCms();
  const { company } = cmsData;
  const contacts = company.contacts ?? [];
  const wrapRef = useRef(null);
  const [askOpen, setAskOpen] = useState(false);

  const channels = getAskMasterChannels(contacts);
  const phoneHref = getTelHref(company.phone);
  const hasAsk = channels.length > 0 || phoneHref;

  useEffect(() => {
    if (!askOpen) return;

    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setAskOpen(false);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setAskOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [askOpen]);

  return (
    <div
      ref={wrapRef}
      className="fixed z-[60] flex flex-col items-end gap-2 pointer-events-none right-4 sm:right-5"
      style={{ bottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
      aria-label="Быстрые действия"
    >
      <div
        className="pointer-events-auto flex flex-col items-stretch gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--glass-bg)]/90 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-xl"
        style={{ maxWidth: 'min(calc(100vw - 2rem), 240px)' }}
      >
        {askOpen && hasAsk ? (
          <AskMasterPanel
            channels={channels}
            phone={company.phone}
            phoneHref={phoneHref}
            onClose={() => setAskOpen(false)}
          />
        ) : null}

        {hasAsk ? (
          <button
            type="button"
            onClick={() => setAskOpen((open) => !open)}
            aria-expanded={askOpen}
            aria-haspopup="dialog"
            className={`group flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold leading-tight tracking-[-0.01em] transition-all duration-300 active:scale-[0.97] ${
              askOpen
                ? 'border border-[#84CC16]/40 bg-[#84CC16]/10 text-[#84CC16]'
                : 'border border-[var(--border-medium)] bg-[var(--bg-surface)]/95 text-[var(--text-primary)] backdrop-blur-md hover:border-[#84CC16]/40 hover:text-[#84CC16]'
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-elevated)] transition-colors group-hover:bg-[#84CC16]/10">
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <span className="flex-1 pr-0.5">Спросить у мастера</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                askOpen ? 'rotate-180' : ''
              }`}
              strokeWidth={2}
            />
          </button>
        ) : null}

        <Link
          to="/otpravit-v-remont"
          className="group flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold leading-tight tracking-[-0.01em] transition-all duration-300 active:scale-[0.97] bg-[#84CC16] text-[#0A0A0C] shadow-[0_4px_20px_rgba(132,204,22,0.35)] hover:bg-[#9BE02A] hover:shadow-[0_6px_24px_rgba(132,204,22,0.45)]"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0A0A0C]/10 transition-colors group-hover:bg-[#0A0A0C]/15">
            <Wrench className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <span className="pr-0.5">Отправить в ремонт</span>
        </Link>
      </div>
    </div>
  );
}
