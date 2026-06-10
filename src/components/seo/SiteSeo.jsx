import React from 'react';
import { Helmet } from 'react-helmet-async';
import { usePageSeo } from '../../hooks/usePageSeo';

export default function SiteSeo({ overrides }) {
  const seo = usePageSeo(overrides);

  if (!seo.pageKey && !overrides) {
    return (
      <Helmet>
        <html lang="ru" />
        {seo.googleSiteVerification ? (
          <meta name="google-site-verification" content={seo.googleSiteVerification} />
        ) : null}
        {seo.yandexVerification ? (
          <meta name="yandex-verification" content={seo.yandexVerification} />
        ) : null}
        {seo.bingVerification ? <meta name="msvalidate.01" content={seo.bingVerification} /> : null}
      </Helmet>
    );
  }

  const jsonLd =
    seo.jsonLd?.enabled && seo.pageKey === 'home'
      ? {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: seo.jsonLd.businessName || seo.siteName,
          description: seo.jsonLd.description || seo.description,
          telephone: seo.jsonLd.telephone,
          address: seo.jsonLd.address,
          priceRange: seo.jsonLd.priceRange,
          url: seo.canonical || undefined,
        }
      : null;

  return (
    <Helmet>
      <html lang="ru" />
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {seo.keywords ? <meta name="keywords" content={seo.keywords} /> : null}
      <meta name="robots" content={seo.robots} />
      {seo.canonical ? <link rel="canonical" href={seo.canonical} /> : null}

      <meta property="og:type" content="website" />
      <meta property="og:locale" content={seo.locale} />
      <meta property="og:site_name" content={seo.siteName} />
      <meta property="og:title" content={seo.ogTitle} />
      <meta property="og:description" content={seo.ogDescription} />
      {seo.canonical ? <meta property="og:url" content={seo.canonical} /> : null}
      {seo.ogImage ? <meta property="og:image" content={seo.ogImage} /> : null}

      <meta name="twitter:card" content={seo.twitterCard} />
      <meta name="twitter:title" content={seo.ogTitle} />
      <meta name="twitter:description" content={seo.ogDescription} />
      {seo.ogImage ? <meta name="twitter:image" content={seo.ogImage} /> : null}

      {seo.googleSiteVerification ? (
        <meta name="google-site-verification" content={seo.googleSiteVerification} />
      ) : null}
      {seo.yandexVerification ? (
        <meta name="yandex-verification" content={seo.yandexVerification} />
      ) : null}
      {seo.bingVerification ? <meta name="msvalidate.01" content={seo.bingVerification} /> : null}

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
}
