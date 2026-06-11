import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, Star, ExternalLink } from 'lucide-react';
import { useCms } from '../../context/CmsContext';

const currentYear = new Date().getFullYear();

export default function Footer() {
  const { cmsData } = useCms();
  const { company, mainHome, legal, siteNavigation } = cmsData;
  const phoneHref = `tel:${company.phone.replace(/\D/g, '')}`;

  return (
    <footer className="relative z-10 mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
      <div
        className="pointer-events-none absolute inset-0 bg-diagnostic-grid opacity-30"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 lg:gap-10">
          {/* Бренд */}
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1">
            <Link
              to="/"
              className="inline-block text-lg font-medium text-[var(--text-primary)] tracking-tight hover:text-[#84CC16] transition-colors"
            >
              {company.name}
            </Link>
            <p className="mt-2 text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-xs">
              {company.descriptor}
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-mono text-[var(--text-muted)]">
              <Star className="w-3.5 h-3.5 text-[#84CC16] fill-[#84CC16]" />
              Рейтинг {company.rating}
            </p>
          </div>

          {/* Услуги */}
          <div>
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#84CC16] mb-4">
              Услуги
            </h3>
            <ul className="space-y-2.5">
              {mainHome.banners.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#84CC16] mb-4">
              Контакты
            </h3>
            <ul className="space-y-3 text-[13px] text-[var(--text-secondary)]">
              <li className="flex gap-2.5">
                <MapPin className="w-4 h-4 text-[#84CC16] shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="leading-relaxed">{company.address}</span>
              </li>
              <li className="flex gap-2.5">
                <Clock className="w-4 h-4 text-[#84CC16] shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>{company.schedule}</span>
              </li>
              <li>
                <a
                  href={phoneHref}
                  className="inline-flex items-center gap-2 font-medium text-[var(--text-primary)] hover:text-[#84CC16] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#84CC16]" strokeWidth={1.5} />
                  {company.phone}
                </a>
              </li>
            </ul>
          </div>

          {/* Навигация */}
          <div>
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#84CC16] mb-4">
              На сайте
            </h3>
            <ul className="space-y-2.5 text-[13px]">
              {siteNavigation.footerLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={mainHome.about.yandexMap.orgUrl ?? mainHome.about.yandexMap.openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Яндекс Карты
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
            <a
              href={phoneHref}
              className="mt-5 inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-[#84CC16] px-5 py-2.5 text-[13px] font-medium text-[#0a0a0a] hover:bg-[#9ae022] transition-colors"
            >
              Позвонить
            </a>
          </div>

          {/* Правовые документы */}
          <div>
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#84CC16] mb-4">
              Правовые документы
            </h3>
            <ul className="space-y-2.5">
              {legal.map((doc) => (
                <li key={doc.id}>
                  <Link
                    to={doc.path}
                    className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors leading-snug"
                  >
                    {doc.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[12px] text-[var(--text-muted)]">
          <p>
            © {currentYear} {company.name}. Все права защищены.
          </p>
          <p className="font-mono text-[11px]">{company.footerTagline}</p>
        </div>
      </div>
    </footer>
  );
}
