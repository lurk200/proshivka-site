import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, Phone, X } from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import ThemeToggle from '../ui/ThemeToggle';
import { SocialIconButton } from '../ui/SocialLinks';

const CLOSE_DELAY_MS = 220;

const linkBase =
  'text-[13px] font-medium transition-colors duration-200 whitespace-nowrap';
const linkIdle = 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]';
const linkActive = 'text-[#84CC16]';

function isPathActive(pathname, path) {
  if (path === '/#about') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

function useServiceItems() {
  const { cmsData } = useCms();
  const { softwareNav, serviceNav } = cmsData.siteNavigation;
  return [softwareNav, ...serviceNav];
}

function useHeaderLinks() {
  const { cmsData } = useCms();
  return cmsData.siteNavigation.headerLinks ?? [];
}

function ServiceDropdownItem({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[var(--bg-elevated)] transition-colors"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] group-hover:border-[#84CC16]/30 group-hover:bg-[#84CC16]/10 transition-colors">
        {Icon ? (
          <Icon
            className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-[#84CC16] transition-colors"
            strokeWidth={1.5}
          />
        ) : null}
      </span>
      <span className="text-[13px] text-[var(--text-primary)] group-hover:text-[#84CC16] transition-colors leading-snug">
        {item.title}
      </span>
    </Link>
  );
}

function ServicesDropdown({ open, onClose }) {
  const serviceItems = useServiceItems();

  if (!open) return null;

  return (
    <div
      className="absolute left-1/2 top-full z-50 w-[min(100vw-2rem,20rem)] -translate-x-1/2 pt-2"
      role="menu"
    >
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <p className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
          Направления
        </p>
        <div className="space-y-0.5">
          {serviceItems.map((item) => (
            <ServiceDropdownItem key={item.path} item={item} onNavigate={onClose} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeaderNavDesktop() {
  const serviceItems = useServiceItems();
  const headerLinks = useHeaderLinks();
  const location = useLocation();
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef(null);
  const closeTimerRef = useRef(null);

  const servicesActive = serviceItems.some((item) => isPathActive(location.pathname, item.path));

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openServices = () => {
    clearCloseTimer();
    setServicesOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setServicesOpen(false), CLOSE_DELAY_MS);
  };

  const closeServices = () => {
    clearCloseTimer();
    setServicesOpen(false);
  };

  useEffect(() => {
    closeServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target)) {
        closeServices();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      clearCloseTimer();
    };
  }, []);

  return (
    <nav className="flex items-center gap-1 xl:gap-2" aria-label="Основное меню">
      <div
        ref={servicesRef}
        className="relative"
        onMouseEnter={openServices}
        onMouseLeave={scheduleClose}
      >
        <button
          type="button"
          onClick={() => (servicesOpen ? closeServices() : openServices())}
          aria-expanded={servicesOpen}
          aria-haspopup="true"
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 ${linkBase} ${
            servicesActive || servicesOpen ? linkActive : linkIdle
          } hover:bg-[var(--bg-surface)]/60`}
        >
          Услуги
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`}
            strokeWidth={1.75}
          />
        </button>
        <ServicesDropdown open={servicesOpen} onClose={closeServices} />
      </div>

      {headerLinks.map(({ label, to }) => {
        const active = isPathActive(location.pathname, to);
        return (
          <Link
            key={to}
            to={to}
            className={`rounded-xl px-3 py-2 ${linkBase} ${active ? linkActive : linkIdle} hover:bg-[var(--bg-surface)]/60`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function HeaderNavMobile({ phone, phoneHref, contacts = [] }) {
  const serviceItems = useServiceItems();
  const headerLinks = useHeaderLinks();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  const servicesActive = serviceItems.some((item) => isPathActive(location.pathname, item.path));

  const closeAll = () => {
    setMenuOpen(false);
    setMobileServicesOpen(false);
  };

  useEffect(() => {
    closeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <button
        type="button"
        className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 text-[var(--text-primary)] hover:border-[#84CC16]/30 hover:text-[#84CC16] transition-colors"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
      </button>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-[var(--bg-base)]/70 backdrop-blur-sm lg:hidden"
            aria-label="Закрыть меню"
            onClick={closeAll}
          />
          <nav
            className="fixed left-0 right-0 top-14 z-50 max-h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] overflow-y-auto border-b border-[var(--border-subtle)] backdrop-blur-xl px-4 py-4 sm:top-[4.5rem] lg:hidden"
            aria-label="Мобильное меню"
            style={{ background: 'var(--glass-bg)' }}
          >
            <div className="mx-auto max-w-7xl space-y-1">
              {phoneHref ? (
                <a
                  href={phoneHref}
                  onClick={closeAll}
                  className="mb-2 flex items-center gap-3 rounded-xl border border-[#84CC16]/25 bg-[#84CC16]/5 px-3 py-3 text-[var(--text-primary)] hover:bg-[#84CC16]/10"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#84CC16]/15 text-[#84CC16]">
                    <Phone className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] text-[var(--text-muted)]">Позвонить</span>
                    <span className="block text-[14px] font-medium tabular-nums">{phone}</span>
                  </span>
                </a>
              ) : null}

              {contacts.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-2 px-1">
                  {contacts.map((contact) => (
                    <SocialIconButton key={contact.type} contact={contact} />
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setMobileServicesOpen((open) => !open)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left ${linkBase} ${
                  servicesActive || mobileServicesOpen ? linkActive : 'text-[var(--text-primary)]'
                } hover:bg-[var(--bg-surface)]/80`}
              >
                <span>Услуги</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${mobileServicesOpen ? 'rotate-180' : ''}`}
                  strokeWidth={1.75}
                />
              </button>

              {mobileServicesOpen ? (
                <div className="ml-1 space-y-0.5 border-l border-[var(--border-subtle)] pl-3 pb-2">
                  {serviceItems.map((item) => (
                    <ServiceDropdownItem key={item.path} item={item} onNavigate={closeAll} />
                  ))}
                </div>
              ) : null}

              {headerLinks.map(({ label, to }) => {
                const active = isPathActive(location.pathname, to);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={closeAll}
                    className={`block rounded-xl px-3 py-3 ${linkBase} ${
                      active ? linkActive : 'text-[var(--text-primary)]'
                    } hover:bg-[var(--bg-surface)]/80`}
                  >
                    {label}
                  </Link>
                );
              })}

              <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 px-3 py-2.5 sm:hidden">
                <span className="text-[13px] font-medium text-[var(--text-secondary)]">Тема оформления</span>
                <ThemeToggle />
              </div>
            </div>
          </nav>
        </>
      ) : null}
    </>
  );
}
