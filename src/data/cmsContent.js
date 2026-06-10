import { createDefaultPageContent, createDefaultSoftwareRepairContent } from './pageContent';
import { createDefaultMainHome } from './mainHomeContent';
import { createDefaultLegal } from './legalContent';
import { createDefaultServicePages, createDefaultServiceTemplate } from './servicePagesContent';
import { createDefaultSiteNavigation } from './siteNavigationContent';
import { createDefaultWorks } from './worksContent';
import { createDefaultSiteSeo } from './seoContent';
import { createDefaultRepairPriceSettings } from './repairPriceSettings';
import { createDefaultSendRepair } from './sendRepairContent';

/** Полная структура CMS: общие данные + страницы сайта. */
export const CMS_SITE = {
  company: {
    name: 'ПРОШИВКА',
    brandTagline: 'Ремонт смартфонов и электроники',
    descriptor: 'Лаборатория восстановления устройств',
    phone: '+7 (000) 000-00-00',
    address: 'г. Москва, ул. Техническая, 10 (Вход со двора, 2 этаж)',
    schedule: '10:00 - 20:00 Ежедневно',
    rating: '5.0',
    footerTagline: 'Диагностика · Ремонт · Восстановление данных',
    contacts: [
      { type: 'telegram', label: 'Telegram', url: 'https://t.me/your_telegram' },
      { type: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/79000000000' },
      { type: 'vk', label: 'ВКонтакте', url: 'https://vk.com/your_page' },
      { type: 'max', label: 'MAX', url: 'https://max.ru/your_profile' },
    ],
  },
  mainHome: createDefaultMainHome(),
  siteSeo: createDefaultSiteSeo(),
  works: createDefaultWorks(),
  legal: createDefaultLegal(),
  servicePages: createDefaultServicePages(),
  serviceTemplate: createDefaultServiceTemplate(),
  siteNavigation: createDefaultSiteNavigation(),
  navigation: [
    { id: 'services', label: 'Услуги диагностики' },
    { id: 'cases', label: 'Примеры восстановлений' },
    { id: 'about', label: 'О лаборатории' },
    { id: 'reviews', label: 'Отзывы' },
  ],
  home: createDefaultPageContent(),
  softwareRepair: createDefaultSoftwareRepairContent(),
  repairPrice: createDefaultRepairPriceSettings(),
  sendRepair: createDefaultSendRepair(),
};

/** @deprecated Используйте CMS_SITE */
export const CMS_CONTENT = CMS_SITE;
