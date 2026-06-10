import {
  Terminal,
  ShieldCheck,
  Search,
  Unlock,
  FileCode2,
  Database,
  Layers,
  PowerOff,
  Smartphone,
  Wrench,
  Clock,
  GlassWater,
  BatteryCharging,
  Droplets,
} from 'lucide-react';

export const ICON_MAP = {
  Terminal,
  ShieldCheck,
  Search,
  Unlock,
  FileCode2,
  Database,
  Layers,
  PowerOff,
  Smartphone,
  Wrench,
  Clock,
  GlassWater,
  BatteryCharging,
  Droplets,
};

const DEFAULT_ICON = Terminal;

function resolveIconItem(item) {
  if (!item || typeof item !== 'object') return item;
  if (!item.icon || typeof item.icon === 'string') {
    const Icon = ICON_MAP[item.icon] ?? DEFAULT_ICON;
    return { ...item, icon: Icon };
  }
  return item;
}

export function resolvePageContent(page) {
  if (!page) return page;
  const resolveList = (list) => (Array.isArray(list) ? list.map(resolveIconItem) : list);

  return {
    ...page,
    services: page.services
      ? {
          featured: resolveList(page.services.featured),
          standard: resolveList(page.services.standard),
        }
      : page.services,
    principles: resolveList(page.principles),
  };
}

export function resolveServiceTemplate(template) {
  if (!template) return template;
  return {
    ...template,
    process: Array.isArray(template.process)
      ? template.process.map(resolveIconItem)
      : template.process,
  };
}

export function resolveNavCards(nav) {
  if (!nav) return nav;
  return {
    ...nav,
    serviceNav: Array.isArray(nav.serviceNav) ? nav.serviceNav.map(resolveIconItem) : nav.serviceNav,
    softwareNav: resolveIconItem(nav.softwareNav),
  };
}

/** @deprecated */
export const resolveCmsIcons = resolvePageContent;
