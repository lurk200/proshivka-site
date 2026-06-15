import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Reveal } from '../ui';
import SafeImage from '../ui/SafeImage';
import { useCms } from '../../context/CmsContext';

const cardBaseClass =
  'group relative flex w-full min-w-0 flex-col overflow-hidden rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] transition-[transform,box-shadow,border-color] duration-500 ease-premium hover:border-[var(--border-accent-hover)] hover:shadow-[var(--shadow-card)] active:scale-[0.98] md:hover:-translate-y-1 focus-ring sm:rounded-[18px] md:rounded-[20px]';

function clampPercent(value, fallback = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, n));
}

function resolveBannerGradientVars(gradient = {}) {
  const bottom = clampPercent(gradient.bottomFade, 100) / 100;
  const hero = clampPercent(gradient.heroOverlay, 100) / 100;
  const image = clampPercent(gradient.imageOpacity, 100) / 100;

  return {
    '--banner-via': `${Math.round(75 * bottom)}%`,
    '--banner-via-md': `${Math.round(55 * bottom)}%`,
    '--banner-hero-overlay': String(hero),
    '--banner-image-factor': String(image),
  };
}

function ShortBannerCard({ banner, index, cardEyebrow }) {
  return (
    <li className="home-banner-item min-w-0 list-none snap-start">
      <Reveal delay={index * 40} immediate className="block h-full w-full min-w-0">
        <Link to={banner.path} className={`${cardBaseClass} aspect-[3/4] h-full w-full sm:aspect-[4/5] md:aspect-[9/16]`}>
          <SafeImage
            src={banner.image}
            alt={banner.title}
            loading={index < 4 ? 'eager' : 'lazy'}
            decoding="async"
            className="banner-card-img absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-premium group-hover:scale-[1.05]"
          />

          <div className="absolute inset-0 z-[1] bg-diagnostic-grid mix-blend-overlay pointer-events-none banner-card-grid" />
          <div
            className="absolute inset-0 z-[2] pointer-events-none"
            style={{
              background: 'var(--hero-gradient)',
              opacity: 'var(--banner-hero-overlay, 1)',
            }}
          />
          <div className="banner-card-fade absolute inset-0 z-[3] pointer-events-none" />

          <div className="relative z-10 flex h-full min-h-0 flex-col justify-end p-3 sm:p-4 md:p-5">
            {cardEyebrow && (
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-[#84CC16] md:text-[10px]">
                {cardEyebrow}
              </span>
            )}
            <h2 className="mb-1.5 text-[13px] font-medium leading-snug tracking-tight text-[var(--text-primary)] sm:text-[14px] md:text-[16px] lg:text-[17px]">
              {banner.title}
            </h2>
            <p className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-[var(--text-secondary)] sm:text-[12px] md:mb-3 md:text-[13px]">
              {banner.description}
            </p>

            <ul className="mb-2 space-y-1.5 md:mb-3 md:space-y-2">
              {banner.advantages.map((item, advIdx) => (
                <li
                  key={item}
                  className={`items-start gap-1.5 text-[10px] leading-snug text-[var(--text-primary)] sm:text-[11px] md:gap-2 md:text-[12px] lg:text-[13px] ${
                    advIdx >= 2 ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#84CC16] md:h-3.5 md:w-3.5" strokeWidth={2} />
                  <span className="min-w-0 break-words">{item}</span>
                </li>
              ))}
            </ul>

            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-[#84CC16] md:text-[11px]">
              Подробнее
              <ArrowRight className="h-3 w-3 md:h-3.5 md:w-3.5" strokeWidth={2} />
            </span>
          </div>
        </Link>
      </Reveal>
    </li>
  );
}

export default function HomeServiceBanners() {
  const { cmsData } = useCms();
  const { bannersSection, banners } = cmsData.mainHome;
  const gradVars = resolveBannerGradientVars(bannersSection.gradient);

  return (
    <section className="home-banners w-full min-w-0" style={gradVars}>
      <Reveal immediate className="mx-auto mb-4 max-w-2xl px-1 text-center sm:mb-8 md:mb-10">
        <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-[#84CC16]">
          {bannersSection.eyebrow}
        </span>
        <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] sm:text-[15px]">
          {bannersSection.subtitle}
        </p>
      </Reveal>

      <div className="home-banners-scroll -mx-4 px-4 md:mx-0 md:px-0">
        <ul
          className="home-banners-grid m-0 flex list-none gap-3 p-0 pb-1 sm:gap-4 md:grid md:grid-cols-3 md:gap-4 lg:gap-5 xl:grid-cols-5"
          aria-label="Услуги сервисного центра"
        >
          {banners.map((banner, index) => (
            <ShortBannerCard
              key={banner.id}
              banner={banner}
              index={index}
              cardEyebrow={bannersSection.cardEyebrow}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
