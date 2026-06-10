import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useCms } from '../context/CmsContext';
import { resolveSeoPageKey } from '../data/seoContent';

function buildTitle(pageTitle, global) {
  const t = pageTitle?.trim();
  if (!t) return global.siteName;
  if (t.includes(global.siteName) || t.includes(global.titleSuffix)) return t;
  return `${t} | ${global.titleSuffix}`;
}

function buildCanonical(path, global, page) {
  const custom = page?.canonical?.trim();
  if (custom) return custom;
  const base = global.siteUrl?.trim().replace(/\/$/, '');
  if (!base) return '';
  const pagePath = page?.path || path;
  return `${base}${pagePath.startsWith('/') ? pagePath : `/${pagePath}`}`;
}

export function usePageSeo(pageKeyOrOverrides, overrides = {}) {
  const location = useLocation();
  const { cmsData } = useCms();
  const siteSeo = cmsData.siteSeo;

  return useMemo(() => {
    const global = siteSeo?.global ?? {};
    const isObjectArg =
      pageKeyOrOverrides &&
      typeof pageKeyOrOverrides === 'object' &&
      !Array.isArray(pageKeyOrOverrides);
    const pageKey = isObjectArg
      ? resolveSeoPageKey(location.pathname)
      : pageKeyOrOverrides ?? resolveSeoPageKey(location.pathname);
    const extra = isObjectArg ? pageKeyOrOverrides : overrides;

    const page = pageKey ? siteSeo?.pages?.[pageKey] ?? {} : {};
    const merged = pageKey ? { ...page, ...extra } : { ...extra };

    const title = buildTitle(merged.title, global);
    const description = merged.description?.trim() || global.defaultDescription || '';
    const keywords = merged.keywords?.trim() || global.defaultKeywords || '';
    const ogTitle = merged.ogTitle?.trim() || merged.title?.trim() || title;
    const ogDescription = merged.ogDescription?.trim() || description;
    const ogImage = merged.ogImage?.trim() || global.defaultOgImage?.trim() || '';
    const canonical = buildCanonical(location.pathname, global, merged);
    const robots = merged.noindex ? 'noindex, nofollow' : global.robots || 'index, follow';

    return {
      pageKey,
      title,
      description,
      keywords,
      ogTitle,
      ogDescription,
      ogImage,
      canonical,
      robots,
      locale: global.locale || 'ru_RU',
      twitterCard: global.twitterCard || 'summary_large_image',
      siteName: global.siteName,
      googleSiteVerification: global.googleSiteVerification,
      yandexVerification: global.yandexVerification,
      bingVerification: global.bingVerification,
      jsonLd: siteSeo?.jsonLd,
    };
  }, [cmsData.siteSeo, location.pathname, pageKeyOrOverrides, overrides]);
}
