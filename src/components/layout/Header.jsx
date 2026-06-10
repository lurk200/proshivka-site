import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Phone } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import { HeaderNavDesktop, HeaderNavMobile } from './HeaderNav';
import BrandWordmark from './BrandWordmark';
import { useCms } from '../../context/CmsContext';
import { SocialIconButton } from '../ui/SocialLinks';

const iconBtnClass =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 text-[var(--text-primary)] transition-colors hover:border-[#84CC16]/30 hover:text-[#84CC16]';

export default function Header() {
  const { cmsData } = useCms();
  const { company } = cmsData;
  const phoneHref = `tel:${company.phone.replace(/\D/g, '')}`;
  const activeContacts = (company.contacts ?? []).filter(
    (c) => c.url?.trim() && c.type !== 'viber',
  );

  const contactRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (contactRef.current && !contactRef.current.contains(event.target)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const messengersCollapsed =
    'max-w-0 opacity-0 pointer-events-none ml-0 pr-0 ' +
    'md:group-hover/contact:max-w-[12rem] md:group-hover/contact:opacity-100 md:group-hover/contact:pointer-events-auto md:group-hover/contact:ml-1 md:group-hover/contact:pr-0.5 ' +
    'md:group-focus-within/contact:max-w-[12rem] md:group-focus-within/contact:opacity-100 md:group-focus-within/contact:pointer-events-auto md:group-focus-within/contact:ml-1 md:group-focus-within/contact:pr-0.5';

  const messengersExpanded = 'max-w-[12rem] opacity-100 pointer-events-auto ml-1 pr-0.5';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)] backdrop-blur-xl transition-colors duration-500 ease-premium pt-[env(safe-area-inset-top,0px)]"
      style={{ background: 'var(--glass-bg)' }}
    >
      <div className="container mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:h-[4.5rem] sm:gap-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="min-w-0 flex-1 overflow-hidden rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84CC16]/50 sm:flex-none"
          aria-label={`${company.name} — ${company.descriptor}`}
        >
          <BrandWordmark name={company.name} tagline={company.brandTagline} />
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center px-2 lg:flex">
          <HeaderNavDesktop />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <HeaderNavMobile phone={company.phone} phoneHref={phoneHref} contacts={activeContacts} />

          {/* Телефон: на телефоне только иконка */}
          <a
            href={phoneHref}
            className={`${iconBtnClass} md:hidden`}
            aria-label={`Позвонить: ${company.phone}`}
          >
            <Phone className="h-4 w-4 text-[#84CC16]" strokeWidth={1.5} />
          </a>

          {/* Телефон + мессенджеры: планшет и десктоп до lg */}
          {activeContacts.length > 0 ? (
            <div
              ref={contactRef}
              className="group/contact hidden items-center rounded-xl border border-transparent transition-colors duration-200 hover:border-[#84CC16]/30 hover:bg-[var(--bg-surface)]/60 focus-within:border-[#84CC16]/30 focus-within:bg-[var(--bg-surface)]/60 md:flex"
            >
              <a
                href={phoneHref}
                className="inline-flex min-w-0 items-center gap-2 px-2.5 py-1.5 text-[13px] font-medium text-[var(--text-primary)] transition-colors hover:text-[#84CC16]"
                aria-label={`Позвонить: ${company.phone}`}
              >
                <Phone className="h-4 w-4 shrink-0 text-[#84CC16]" strokeWidth={1.5} />
                <span className="hidden lg:inline">{company.phone}</span>
              </a>

              <button
                type="button"
                className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:text-[#84CC16] lg:hidden"
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? 'Скрыть мессенджеры' : 'Показать мессенджеры'}
                onClick={() => setMobileOpen((open) => !open)}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${mobileOpen ? 'rotate-180' : ''}`}
                  strokeWidth={1.75}
                />
              </button>

              <div
                className={`flex items-center gap-1 overflow-hidden transition-all duration-300 ease-out ${mobileOpen ? messengersExpanded : messengersCollapsed}`}
              >
                <span className="hidden h-4 w-px shrink-0 bg-[var(--border-medium)] lg:block" aria-hidden />
                {activeContacts.map((contact) => (
                  <SocialIconButton key={contact.type} contact={contact} />
                ))}
              </div>
            </div>
          ) : (
            <a
              href={phoneHref}
              className="hidden items-center gap-2 rounded-xl border border-transparent px-2.5 py-1.5 text-[13px] font-medium text-[var(--text-primary)] transition-colors hover:border-[#84CC16]/30 hover:text-[#84CC16] md:inline-flex"
              aria-label={`Позвонить: ${company.phone}`}
            >
              <Phone className="h-4 w-4 shrink-0 text-[#84CC16]" strokeWidth={1.5} />
              <span className="hidden lg:inline">{company.phone}</span>
            </a>
          )}

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
