import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, ArrowRight } from 'lucide-react';
import { Reveal } from '../ui';
import YandexMapBlock from '../ui/YandexMapBlock';
import SafeImage from '../ui/SafeImage';
import { useCms } from '../../context/CmsContext';
import { getPublishedWorks } from '../../data/worksContent';
import { SocialLinksRow } from '../ui/SocialLinks';
import WorksCarousel, { WorksCarouselHeader } from './WorksCarousel';

import { getActiveSocialContacts } from '../../utils/socialContacts';

export default function HomeAboutSection({ company }) {
  const { cmsData } = useCms();
  const about = cmsData.mainHome.about;
  const { works } = cmsData;
  const published = getPublishedWorks(works);
  const carouselWorks = works.home?.showCarousel
    ? published.slice(0, works.home.carouselLimit || published.length)
    : [];
  const phoneHref = `tel:${company.phone.replace(/[^\d+]/g, '')}`;
  const socialContacts = getActiveSocialContacts(company.contacts);

  return (
    <section id="about" className="w-full min-w-0 pt-10 sm:pt-14 md:pt-16 border-t border-[var(--border-subtle)]">
      <Reveal className="mb-8 md:mb-10 max-w-2xl">
        {about.eyebrow && (
          <span className="text-[#84CC16] text-[10px] font-mono uppercase tracking-widest block mb-3">
            {about.eyebrow}
          </span>
        )}
        <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] font-medium text-[var(--text-primary)] tracking-tight mb-3">
          {about.title}
        </h2>
        <p className="text-[14px] sm:text-[15px] text-[var(--text-secondary)] leading-relaxed">
          {about.subtitle}
        </p>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 mb-10 md:mb-12 min-w-0">
        <div className="flex flex-col gap-5 min-w-0 order-2 lg:order-1">
          <Reveal delay={50}>
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#84CC16]/10 border border-[#84CC16]/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#84CC16]" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[16px] font-medium text-[var(--text-primary)] mb-1">Адрес сервиса</h3>
                  <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">{company.address}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 pt-4 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                  <Clock className="w-4 h-4 text-[#84CC16] shrink-0" />
                  <span>{company.schedule}</span>
                </div>
                <a
                  href={phoneHref}
                  className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--text-primary)] hover:text-[#84CC16] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#84CC16]" />
                  {company.phone}
                </a>
              </div>

              {socialContacts.length > 0 ? (
                <div className="pt-4 mt-4 border-t border-[var(--border-subtle)]">
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-4 backdrop-blur-sm">
                    <SocialLinksRow
                      contacts={socialContacts}
                      variant="pill"
                      label="Мы в"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </Reveal>

          <Reveal delay={100}>
            <figure className="relative overflow-hidden rounded-[20px] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] aspect-[4/3] sm:aspect-[16/10]">
              <SafeImage
                src={about.servicePhoto.src}
                alt={about.servicePhoto.alt}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'var(--hero-gradient)' }}
              />
              <figcaption className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#84CC16] block mb-1">
                  Фото сервиса
                </span>
                <p className="text-[14px] font-medium text-[var(--text-primary)]">{company.descriptor}</p>
              </figcaption>
            </figure>
          </Reveal>
        </div>

        <Reveal delay={80} className="min-w-0 order-1 lg:order-2 w-full">
          <YandexMapBlock map={about.yandexMap} />
        </Reveal>
      </div>

      {works.home?.showCarousel && carouselWorks.length > 0 ? (
        <div className="min-w-0">
          <WorksCarouselHeader
            section={works.homeSection ?? works.page}
            showAllLink={published.length > carouselWorks.length}
          />
          <Reveal delay={120}>
            <WorksCarousel works={carouselWorks} />
          </Reveal>
          {published.length > carouselWorks.length ? (
            <Reveal delay={160} className="mt-5 text-center sm:text-left">
              <Link
                to="/nashi-raboty"
                className="inline-flex items-center gap-2 text-[13px] font-mono text-[#84CC16] hover:underline"
              >
                Смотреть все работы ({published.length})
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
