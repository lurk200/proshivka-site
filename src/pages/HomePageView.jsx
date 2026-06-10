import React from 'react';
import { Helmet } from 'react-helmet-async';
import PageTransition from '../components/layout/PageTransition';
import HeroSection from '../components/sections/HeroSection';
import ServicesSection from '../components/sections/ServicesSection';
import CasesSection from '../components/sections/CasesSection';
import AboutSection from '../components/sections/AboutSection';
import ReviewsSection from '../components/sections/ReviewsSection';
import CTASection from '../components/sections/CTASection';

/** Общий шаблон главной страницы (основной сайт и «Программный ремонт»). */
export default function HomePageView({ page }) {
  return (
    <PageTransition>
      <Helmet>
        <title>{page.meta?.title ?? 'ПРОШИВКА'}</title>
      </Helmet>
      <HeroSection data={page.hero} showSoftwareRepairCta />
      <ServicesSection data={page.services} section={page.sections?.services} />
      <CasesSection data={page.portfolio} section={page.sections?.portfolio} />
      <AboutSection data={page.principles} section={page.sections?.principles} />
      <ReviewsSection
        data={page.reviews}
        companyRating={page.meta?.rating ?? '5.0'}
        section={page.sections?.reviews}
      />
      <CTASection data={page.cta} />
    </PageTransition>
  );
}
