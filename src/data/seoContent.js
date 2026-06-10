import { createDefaultServicePages } from './servicePagesContent';
import { createDefaultWorks } from './worksContent';

export const SEO_PAGE_LIST = [
  { id: 'home', label: 'Главная', path: '/' },
  { id: 'softwareRepair', label: 'Программный ремонт', path: '/programmnyj-remont' },
  { id: 'works', label: 'Наши работы', path: '/nashi-raboty' },
  { id: 'glassReplacement', label: 'Замена стекла', path: '/services/glass-replacement' },
  { id: 'batteryReplacement', label: 'Замена аккумуляторов', path: '/services/battery-replacement' },
  { id: 'waterDamage', label: 'После влаги', path: '/services/water-damage' },
  { id: 'modularRepair', label: 'Модульный ремонт', path: '/services/modular-repair' },
  { id: 'repairPrice', label: 'Узнать стоимость', path: '/prise' },
  { id: 'sendRepair', label: 'Отправить в ремонт', path: '/otpravit-v-remont' },
  { id: 'orderStatus', label: 'Статус заказа', path: '/status-zakaza' },
];

function createPageSeoEntry({ title, description, keywords = '', path }) {
  return {
    title,
    description,
    keywords,
    path,
    ogTitle: title,
    ogDescription: description,
    ogImage: '',
    noindex: false,
    canonical: '',
  };
}

export function createDefaultSiteSeo() {
  const services = createDefaultServicePages();
  const works = createDefaultWorks();

  const pages = {
    home: createPageSeoEntry({
      title: 'ПРОШИВКА — Ремонт и прошивка смартфонов в Москве',
      description:
        'Лаборатория восстановления устройств: программный ремонт, прошивка, разблокировка, замена стекла и аккумуляторов. Диагностика и гарантия.',
      keywords:
        'прошивка телефона, ремонт смартфонов, восстановление данных, разблокировка, замена стекла, замена аккумулятора, сервис москва',
      path: '/',
    }),
    softwareRepair: createPageSeoEntry({
      title: 'Программный ремонт и прошивка | ПРОШИВКА',
      description:
        'Восстановление прошивки, снятие блокировок, спасение данных. Работаем со сложными программными сбоями iPhone, Samsung, Xiaomi.',
      keywords:
        'программный ремонт, прошивка android, прошивка iphone, frp, mi account, восстановление после обновления',
      path: '/programmnyj-remont',
    }),
    works: createPageSeoEntry({
      title: works.seo.title,
      description: works.seo.description,
      keywords: 'наши работы, кейсы ремонта, примеры восстановления, портфолио сервиса',
      path: '/nashi-raboty',
    }),
    glassReplacement: createPageSeoEntry({
      title: services.glassReplacement.seoTitle,
      description: services.glassReplacement.seoDesc,
      keywords: 'замена стекла, переклейка дисплея, oled, ремонт экрана',
      path: '/services/glass-replacement',
    }),
    batteryReplacement: createPageSeoEntry({
      title: services.batteryReplacement.seoTitle,
      description: services.batteryReplacement.seoDesc,
      keywords: 'замена аккумулятора, батарея iphone, батарея samsung, емкость акб',
      path: '/services/battery-replacement',
    }),
    waterDamage: createPageSeoEntry({
      title: services.waterDamage.seoTitle,
      description: services.waterDamage.seoDesc,
      keywords: 'ремонт после воды, залитие телефона, коррозия платы, ультразвук',
      path: '/services/water-damage',
    }),
    modularRepair: createPageSeoEntry({
      title: services.modularRepair.seoTitle,
      description: services.modularRepair.seoDesc,
      keywords: 'модульный ремонт, замена дисплея, замена камеры, ремонт разъема',
      path: '/services/modular-repair',
    }),
    repairPrice: createPageSeoEntry({
      title: 'Узнать стоимость ремонта | ПРОШИВКА',
      description:
        'Цена замены дисплея и аккумулятора iPhone, Samsung, Xiaomi в Ставрополе. Оригинал или копия, OLED, JCID — калькулятор и справочник простым языком.',
      keywords:
        'стоимость ремонта телефона, замена экрана айфон оригинал или копия, цена замены дисплея, замена аккумулятора айфон, дисплей samsung amoled, батарея редми, запчасти ставрополь, ремонт iphone ставрополь',
      path: '/prise',
    }),
    sendRepair: createPageSeoEntry({
      title: 'Отправить в ремонт | ПРОШИВКА',
      description:
        'Приём устройств в Ставрополе: бесплатная доставка по городу, отправка из регионов Яндекс Доставкой и Почтой. Адрес, карта, мессенджеры.',
      keywords:
        'отправить телефон в ремонт, доставка ставрополь, яндекс доставка ремонт телефона, сервис ставрополь адрес',
      path: '/otpravit-v-remont',
    }),
    orderStatus: createPageSeoEntry({
      title: 'Статус заказа | ПРОШИВКА',
      description:
        'Проверьте статус ремонта по номеру заказа: этап работ, стоимость и комментарий мастера. Данные обновляются онлайн.',
      keywords:
        'статус ремонта телефона, отследить заказ сервис, готовность ремонта смартфона',
      path: '/status-zakaza',
    }),
  };

  return {
    global: {
      siteName: 'ПРОШИВКА',
      siteUrl: '',
      titleSuffix: 'ПРОШИВКА',
      defaultDescription: pages.home.description,
      defaultKeywords: pages.home.keywords,
      defaultOgImage: '',
      locale: 'ru_RU',
      twitterCard: 'summary_large_image',
      robots: 'index, follow',
      googleSiteVerification: '',
      yandexVerification: '',
      bingVerification: '',
    },
    promotion: {
      tips: [
        'Заполните уникальный title и description для каждой страницы (не дублируйте текст).',
        'Укажите полный адрес сайта (https://…) — для canonical и Open Graph.',
        'Добавьте коды верификации в Яндекс.Вебмастер и Google Search Console.',
        'Используйте ключевые слова естественно: город, услуги, бренды устройств.',
        'Загрузите og:image 1200×630 — превью при отправке ссылки в мессенджерах.',
      ],
    },
    jsonLd: {
      enabled: true,
      businessName: 'ПРОШИВКА',
      description:
        'Лаборатория восстановления смартфонов и планшетов: программный ремонт, прошивка, аппаратное восстановление.',
      telephone: '+7 (000) 000-00-00',
      address: 'г. Москва',
      priceRange: '₽₽',
    },
    pages,
  };
}

export function resolveSeoPageKey(pathname) {
  if (pathname === '/') return 'home';
  if (pathname === '/programmnyj-remont') return 'softwareRepair';
  if (pathname === '/nashi-raboty') return 'works';
  if (pathname.startsWith('/nashi-raboty/')) return 'works';
  if (pathname === '/services/glass-replacement') return 'glassReplacement';
  if (pathname === '/services/battery-replacement') return 'batteryReplacement';
  if (pathname === '/services/water-damage') return 'waterDamage';
  if (pathname === '/services/modular-repair') return 'modularRepair';
  if (pathname === '/prise') return 'repairPrice';
  if (pathname === '/otpravit-v-remont') return 'sendRepair';
  if (pathname === '/status-zakaza') return 'orderStatus';
  return null;
}
