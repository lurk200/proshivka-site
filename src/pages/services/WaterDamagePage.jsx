import React from 'react';
import { Droplets } from 'lucide-react';
import ServicePageTemplate from '../../ServicePageTemplate';
import { useCms } from '../../context/CmsContext';

export default function WaterDamagePage() {
  const { cmsData } = useCms();
  const page = cmsData.servicePages.waterDamage;
  const template = cmsData.serviceTemplate;

  return (
    <ServicePageTemplate
      seoTitle={page.seoTitle}
      seoDesc={page.seoDesc}
      icon={Droplets}
      title={page.title}
      description={page.description}
      advantages={page.advantages}
      risks={page.risks}
      process={template.process}
      faq={template.faq}
      bottomCta={template.bottomCta}
      telegramUrl={cmsData.company.contacts?.find((c) => c.type === 'telegram')?.url}
    />
  );
}
