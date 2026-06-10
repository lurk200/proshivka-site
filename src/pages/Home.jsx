import React from 'react';
import PageTransition from '../components/layout/PageTransition';
import HomeServiceBanners from '../components/sections/HomeServiceBanners';
import HomeAboutSection from '../components/sections/HomeAboutSection';
import { useCms } from '../context/CmsContext';

export default function Home() {
  const { cmsData } = useCms();

  return (
    <PageTransition>
      <div className="relative w-full min-w-0 overflow-x-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-diagnostic-grid"
          style={{ opacity: 'var(--grid-opacity)' }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-full max-w-3xl -translate-x-1/2 rounded-full blur-[100px] sm:h-80"
          style={{ background: 'var(--glow-accent)' }}
        />

        <div className="relative z-10 mx-auto w-full min-w-0 max-w-[90rem] px-4 pb-10 pt-24 sm:px-6 sm:pb-14 sm:pt-28 lg:px-8">
          <section className="py-4 sm:py-6 lg:py-8">
            <HomeServiceBanners />
          </section>

          <HomeAboutSection company={cmsData.company} />
        </div>
      </div>
    </PageTransition>
  );
}
