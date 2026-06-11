import { CMS_SITE } from './cmsContent';
import { createDefaultPageContent, createDefaultSoftwareRepairContent, PAGE_KEYS } from './pageContent';
import { createDefaultMainHome } from './mainHomeContent';
import { createDefaultLegal } from './legalContent';
import { createDefaultServicePages, createDefaultServiceTemplate } from './servicePagesContent';
import { createDefaultSiteNavigation } from './siteNavigationContent';
import { createDefaultWorks, normalizeWorkItem } from './worksContent';
import { createDefaultSiteSeo } from './seoContent';
import { createDefaultSendRepair } from './sendRepairContent';
import {
  createDefaultRepairPriceSettings,
  mergeRepairPriceSettings,
} from './repairPriceSettings';
import { resolveNavCards, resolvePageContent, resolveServiceTemplate } from './iconMap';

const STORAGE_KEY = 'proshivka-cms-content';
export const CMS_UPDATED_EVENT = 'proshivka-cms-updated';

function isLegacyFlatContent(data) {
  return data && typeof data.hero === 'object' && !data.home;
}

function mergeCompany(company) {
  const base = CMS_SITE.company;
  const merged = { ...base, ...company };
  if (!merged.brandTagline) merged.brandTagline = base.brandTagline ?? 'Ремонт смартфонов и электроники';
  const defaultContacts = base.contacts ?? [];
  const saved = merged.contacts;

  if (!Array.isArray(saved) || saved.length === 0) {
    merged.contacts = structuredClone(defaultContacts);
    return merged;
  }

  merged.contacts = defaultContacts.map((def) => {
    const found =
      saved.find((c) => c.type === def.type) ||
      (def.type === 'max' ? saved.find((c) => c.type === 'viber') : null);
    if (!found) return { ...def };
    return { ...def, ...found, type: def.type, label: def.label };
  });

  return merged;
}

import { resolveYandexMapConfig } from '../utils/yandexMap';

function normalizeYandexMap(savedMap, baseMap) {
  const merged = { ...baseMap, ...savedMap };
  const resolved = resolveYandexMapConfig(merged);

  return {
    ...merged,
    embedUrl: resolved.embedUrl,
    orgUrl: resolved.orgUrl,
    openUrl: resolved.routeUrl,
    routeLabel: resolved.routeLabel,
    label: merged.label ?? resolved.fallbackLabel,
  };
}

function mergeMainHome(saved) {
  const base = createDefaultMainHome();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    seo: { ...base.seo, ...saved.seo },
    bannersSection: {
      ...base.bannersSection,
      ...saved.bannersSection,
      gradient: {
        ...base.bannersSection.gradient,
        ...saved.bannersSection?.gradient,
      },
    },
    about: {
      ...base.about,
      ...saved.about,
      servicePhoto: { ...base.about.servicePhoto, ...saved.about?.servicePhoto },
      yandexMap: normalizeYandexMap(saved.about?.yandexMap, base.about.yandexMap),
    },
    banners: saved.banners?.length ? saved.banners : base.banners,
  };
}

function mergeWorks(saved, legacyMainHome) {
  const base = createDefaultWorks();
  const source = saved ?? {};
  let items = source.items;

  if (!items?.length && legacyMainHome?.works?.length) {
    items = legacyMainHome.works;
  }

  const normalizedItems = (items?.length ? items : base.items).map((item) => normalizeWorkItem(item));

  const pageFromLegacy = legacyMainHome?.worksSection;

  const page = {
    ...base.page,
    ...pageFromLegacy,
    ...source.page,
    eyebrow: source.page?.eyebrow ?? pageFromLegacy?.eyebrow ?? base.page.eyebrow,
    title: source.page?.title ?? pageFromLegacy?.title ?? base.page.title,
    subtitle: source.page?.subtitle ?? pageFromLegacy?.subtitle ?? base.page.subtitle,
  };

  const homeSectionSource = source.homeSection ?? pageFromLegacy;
  const homeSection = {
    ...base.homeSection,
    ...homeSectionSource,
    eyebrow: source.homeSection?.eyebrow ?? homeSectionSource?.eyebrow ?? page.eyebrow,
    title: source.homeSection?.title ?? homeSectionSource?.title ?? page.title,
    subtitle: source.homeSection?.subtitle ?? homeSectionSource?.subtitle ?? page.subtitle,
  };

  return {
    ...base,
    ...source,
    seo: { ...base.seo, ...source.seo },
    page,
    homeSection,
    home: { ...base.home, ...source.home },
    items: normalizedItems,
  };
}

function mergeLegal(saved) {
  const base = createDefaultLegal();
  if (!Array.isArray(saved) || saved.length === 0) return base;
  return base.map((def) => {
    const found = saved.find((d) => d.id === def.id);
    return found ? { ...def, ...found, path: def.path } : { ...def };
  });
}

function mergeServicePages(saved) {
  const base = createDefaultServicePages();
  if (!saved) return base;
  const merged = { ...base };
  for (const key of Object.keys(base)) {
    merged[key] = { ...base[key], ...saved[key] };
  }
  return merged;
}

function mergeServiceTemplate(saved) {
  const base = createDefaultServiceTemplate();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    processSection: { ...base.processSection, ...saved.processSection },
    faqSection: { ...base.faqSection, ...saved.faqSection },
    bottomCta: { ...base.bottomCta, ...saved.bottomCta },
    process: saved.process?.length ? saved.process : base.process,
    faq: saved.faq?.length ? saved.faq : base.faq,
  };
}

function mergeRepairPrice(saved) {
  return mergeRepairPriceSettings(saved);
}

function mergeSendRepair(saved) {
  const base = createDefaultSendRepair();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    hero: { ...base.hero, ...saved.hero },
    cityDelivery: {
      ...base.cityDelivery,
      ...saved.cityDelivery,
      highlights: saved.cityDelivery?.highlights?.length
        ? saved.cityDelivery.highlights
        : base.cityDelivery.highlights,
    },
    regions: {
      ...base.regions,
      ...saved.regions,
      steps: saved.regions?.steps?.length ? saved.regions.steps : base.regions.steps,
    },
    beforeSend: {
      ...base.beforeSend,
      ...saved.beforeSend,
      items: saved.beforeSend?.items?.length ? saved.beforeSend.items : base.beforeSend.items,
    },
    onsite: { ...base.onsite, ...saved.onsite },
    regionsSection: { ...base.regionsSection, ...saved.regionsSection },
    contactsSection: { ...base.contactsSection, ...saved.contactsSection },
    faqSection: { ...base.faqSection, ...saved.faqSection },
    bottomCta: { ...base.bottomCta, ...saved.bottomCta },
    faq: saved.faq?.length ? saved.faq : base.faq,
  };
}

function mergeSiteNavigation(saved) {
  const base = createDefaultSiteNavigation();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    softwareNav: { ...base.softwareNav, ...saved.softwareNav },
    serviceNav: saved.serviceNav?.length ? saved.serviceNav : base.serviceNav,
    headerLinks: saved.headerLinks?.length ? saved.headerLinks : base.headerLinks,
    footerLinks: saved.footerLinks?.length ? saved.footerLinks : base.footerLinks,
  };
}

function mergePageContent(saved) {
  const base = createDefaultPageContent();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    meta: { ...base.meta, ...saved.meta },
    hero: { ...base.hero, ...saved.hero, telemetry: { ...base.hero.telemetry, ...saved.hero?.telemetry } },
    sections: {
      services: { ...base.sections.services, ...saved.sections?.services },
      portfolio: { ...base.sections.portfolio, ...saved.sections?.portfolio },
      principles: { ...base.sections.principles, ...saved.sections?.principles },
      reviews: { ...base.sections.reviews, ...saved.sections?.reviews },
    },
    services: {
      featured: saved.services?.featured?.length ? saved.services.featured : base.services.featured,
      standard: saved.services?.standard?.length ? saved.services.standard : base.services.standard,
    },
    portfolio: saved.portfolio?.length ? saved.portfolio : base.portfolio,
    principles: saved.principles?.length ? saved.principles : base.principles,
    reviews: saved.reviews?.length ? saved.reviews : base.reviews,
    cta: { ...base.cta, ...saved.cta },
  };
}

function mergePageSeoEntry(base, saved) {
  if (!saved) return base;
  return { ...base, ...saved };
}

function mergeSiteSeo(saved, ctx = {}) {
  const base = createDefaultSiteSeo();
  const merged = saved
    ? {
        global: { ...base.global, ...saved.global },
        promotion: {
          ...base.promotion,
          ...saved.promotion,
          tips: saved.promotion?.tips?.length ? saved.promotion.tips : base.promotion.tips,
        },
        jsonLd: { ...base.jsonLd, ...saved.jsonLd },
        pages: Object.fromEntries(
          Object.keys(base.pages).map((key) => [
            key,
            mergePageSeoEntry(base.pages[key], saved.pages?.[key]),
          ]),
        ),
      }
    : structuredClone(base);

  const { mainHome, works, servicePages, softwareRepair } = ctx;

  if (mainHome?.seo?.description) {
    merged.pages.home = {
      ...merged.pages.home,
      description: saved?.pages?.home?.description || mainHome.seo.description,
    };
  }

  if (works?.seo) {
    merged.pages.works = {
      ...merged.pages.works,
      title: saved?.pages?.works?.title || works.seo.title,
      description: saved?.pages?.works?.description || works.seo.description,
      ogTitle: saved?.pages?.works?.ogTitle || works.seo.title,
      ogDescription: saved?.pages?.works?.ogDescription || works.seo.description,
    };
  }

  if (softwareRepair) {
    merged.pages.softwareRepair = {
      ...merged.pages.softwareRepair,
      title:
        saved?.pages?.softwareRepair?.title ||
        softwareRepair.meta?.title ||
        merged.pages.softwareRepair.title,
      description:
        saved?.pages?.softwareRepair?.description ||
        softwareRepair.hero?.subtitle ||
        merged.pages.softwareRepair.description,
    };
  }

  const serviceKeys = [
    'glassReplacement',
    'batteryReplacement',
    'waterDamage',
    'modularRepair',
  ];
  for (const key of serviceKeys) {
    const svc = servicePages?.[key];
    if (!svc) continue;
    merged.pages[key] = {
      ...merged.pages[key],
      title: saved?.pages?.[key]?.title || svc.seoTitle || merged.pages[key].title,
      description: saved?.pages?.[key]?.description || svc.seoDesc || merged.pages[key].description,
      ogTitle: saved?.pages?.[key]?.ogTitle || svc.seoTitle || merged.pages[key].ogTitle,
      ogDescription:
        saved?.pages?.[key]?.ogDescription || svc.seoDesc || merged.pages[key].ogDescription,
    };
  }

  return merged;
}

function mergeSoftwareRepairPage(saved) {
  const base = createDefaultSoftwareRepairContent();
  const merged = mergePageContent(saved ?? base);
  return {
    ...merged,
    meta: { ...base.meta, ...merged.meta, title: merged.meta?.title ?? base.meta.title },
    services: {
      featured: merged.services?.featured?.length ? merged.services.featured : base.services.featured,
      standard: [],
    },
  };
}

function normalizeSiteContent(raw) {
  const works = mergeWorks(raw.works, raw.mainHome);
  const mainHome = mergeMainHome(raw.mainHome);
  const servicePages = mergeServicePages(raw.servicePages);
  const softwareRepair = mergeSoftwareRepairPage(raw.softwareRepair);
  const siteSeo = mergeSiteSeo(raw.siteSeo, { mainHome, works, servicePages, softwareRepair });

  return {
    company: mergeCompany(raw.company),
    mainHome,
    siteSeo,
    works,
    legal: mergeLegal(raw.legal),
    servicePages,
    serviceTemplate: mergeServiceTemplate(raw.serviceTemplate),
    siteNavigation: mergeSiteNavigation(raw.siteNavigation),
    navigation: raw.navigation ?? CMS_SITE.navigation,
    home: mergePageContent(raw.home),
    softwareRepair,
    repairPrice: mergeRepairPrice(raw.repairPrice),
    sendRepair: mergeSendRepair(raw.sendRepair),
  };
}

export function migrateContent(raw) {
  if (!raw || typeof raw !== 'object') return structuredClone(CMS_SITE);

  if (raw.home && raw.softwareRepair) {
    return normalizeSiteContent(raw);
  }

  if (isLegacyFlatContent(raw)) {
    const { company, navigation, hero, services, portfolio, principles, reviews, cta, meta } = raw;
    const homePage = mergePageContent({
      meta: meta ?? {},
      hero: hero ?? {},
      services: services ?? {},
      portfolio: portfolio ?? [],
      principles: principles ?? [],
      reviews: reviews ?? [],
      cta: cta ?? {},
    });

    return normalizeSiteContent({
      company: company ?? CMS_SITE.company,
      navigation: navigation ?? CMS_SITE.navigation,
      home: homePage,
      softwareRepair: mergeSoftwareRepairPage(structuredClone(homePage)),
    });
  }

  return structuredClone(CMS_SITE);
}

export function loadCmsContent() {
  if (typeof window === 'undefined') return structuredClone(CMS_SITE);

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(CMS_SITE);
    return migrateContent(JSON.parse(raw));
  } catch {
    return structuredClone(CMS_SITE);
  }
}

export function saveCmsContent(content) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  window.dispatchEvent(new CustomEvent(CMS_UPDATED_EVENT));
}

export function resetCmsContent() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CMS_UPDATED_EVENT));
  return structuredClone(CMS_SITE);
}

export function buildCmsData(siteContent) {
  return {
    company: siteContent.company,
    navigation: siteContent.navigation,
    mainHome: siteContent.mainHome,
    siteSeo: siteContent.siteSeo ?? createDefaultSiteSeo(),
    works: siteContent.works,
    legal: siteContent.legal,
    servicePages: siteContent.servicePages,
    serviceTemplate: resolveServiceTemplate(siteContent.serviceTemplate),
    siteNavigation: resolveNavCards(siteContent.siteNavigation),
    home: resolvePageContent(siteContent.home),
    softwareRepair: resolvePageContent(siteContent.softwareRepair),
    repairPrice: mergeRepairPriceSettings(siteContent.repairPrice),
    sendRepair: mergeSendRepair(siteContent.sendRepair),
  };
}

export function getDefaultCmsContent() {
  return structuredClone(CMS_SITE);
}

export { PAGE_KEYS };
