import React from 'react';
import { SocialIcon } from '../icons/SocialIcons';

const BUTTON_BASE =
  'group/social relative inline-flex items-center justify-center shrink-0 ' +
  'h-10 rounded-xl border border-[var(--border-subtle)] ' +
  'bg-[var(--bg-surface)]/80 backdrop-blur-sm ' +
  'text-[var(--text-secondary)] ' +
  'shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ' +
  'transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'hover:bg-[var(--bg-elevated)] hover:border-[var(--border-medium)] hover:text-[var(--text-primary)] ' +
  'hover:shadow-[var(--shadow-soft)] ' +
  'active:scale-[0.98] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84CC16]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]';

const ICON_SLOT =
  'flex h-5 w-5 shrink-0 items-center justify-center text-current transition-colors duration-200 ' +
  'group-hover/social:text-[#84CC16]';

/** Только иконка — шапка, компактные ряды */
export function SocialIconButton({ contact, className = '' }) {
  if (!contact?.url?.trim()) return null;

  return (
    <a
      href={contact.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={contact.label}
      title={contact.label}
      className={`${BUTTON_BASE} w-10 ${className}`}
    >
      <span className={ICON_SLOT}>
        <SocialIcon type={contact.type} />
      </span>
    </a>
  );
}

/** Иконка + подпись — блок «О нас» */
export function SocialLinkPill({ contact, className = '' }) {
  if (!contact?.url?.trim()) return null;

  return (
    <a
      href={contact.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={contact.label}
      title={contact.label}
      className={`${BUTTON_BASE} gap-2.5 px-3.5 min-w-0 ${className}`}
    >
      <span className={ICON_SLOT}>
        <SocialIcon type={contact.type} />
      </span>
      <span className="text-[13px] font-medium tracking-[-0.01em] text-[var(--text-primary)] transition-colors duration-200 group-hover/social:text-[var(--text-primary)]">
        {contact.label}
      </span>
    </a>
  );
}

export function SocialLinksRow({
  contacts = [],
  variant = 'icon',
  className = '',
  label,
}) {
  const active = contacts.filter((c) => c.url?.trim() && c.type !== 'viber');
  if (active.length === 0) return null;

  const Item = variant === 'pill' ? SocialLinkPill : SocialIconButton;

  return (
    <div className={className}>
      {label ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3">
          {label}
        </p>
      ) : null}
      <div className={`flex flex-wrap items-center ${variant === 'pill' ? 'gap-2' : 'gap-1.5'}`}>
        {active.map((contact) => (
          <Item key={contact.type} contact={contact} />
        ))}
      </div>
    </div>
  );
}
