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

// Кластеры — стартовый план для локального SEO. Перед выбором приоритетов
// сверяйте спрос в Wordstat по региону «Ставрополь».
export const STAVROPOL_SEO_QUERY_GROUPS = [
  {
    id: 'repair',
    label: 'Ремонт телефонов',
    pageId: 'home',
    queries: ['ремонт телефонов Ставрополь', 'ремонт смартфонов Ставрополь', 'сервисный центр телефонов Ставрополь'],
  },
  {
    id: 'iphone',
    label: 'iPhone и экран',
    pageId: 'glassReplacement',
    queries: ['ремонт iPhone Ставрополь', 'замена экрана iPhone Ставрополь', 'замена стекла телефона Ставрополь'],
  },
  {
    id: 'battery',
    label: 'Аккумуляторы и Android',
    pageId: 'batteryReplacement',
    queries: ['замена аккумулятора iPhone Ставрополь', 'ремонт Samsung Ставрополь', 'ремонт Xiaomi Ставрополь'],
  },
  {
    id: 'software',
    label: 'Прошивка и данные',
    pageId: 'softwareRepair',
    queries: ['прошивка телефона Ставрополь', 'разблокировка телефона Ставрополь', 'восстановление данных телефона Ставрополь'],
  },
];

export function createStavropolSeoPreset() {
  return {
    localSeo: {
      city: 'Ставрополь',
      region: 'Ставропольский край',
      queryGroups: structuredClone(STAVROPOL_SEO_QUERY_GROUPS),
    },
    jsonLd: { address: 'г. Ставрополь' },
    pages: {
      home: {
        title: 'Ремонт телефонов и прошивка смартфонов в Ставрополе | ПРОШИВКА',
        description: 'Ремонт телефонов, прошивка, разблокировка и восстановление данных в Ставрополе. Диагностика, ремонт iPhone, Samsung и Xiaomi, гарантия на работы.',
        keywords: 'ремонт телефонов Ставрополь, ремонт смартфонов Ставрополь, прошивка телефона Ставрополь, сервисный центр телефонов Ставрополь',
      },
      softwareRepair: {
        title: 'Прошивка и программный ремонт телефонов в Ставрополе | ПРОШИВКА',
        description: 'Прошивка смартфонов, снятие блокировок и восстановление данных в Ставрополе. Работаем с iPhone, Samsung, Xiaomi и другими устройствами.',
        keywords: 'прошивка телефона Ставрополь, программный ремонт Ставрополь, разблокировка телефона Ставрополь, восстановление данных Ставрополь',
      },
      glassReplacement: {
        title: 'Замена стекла и экрана телефона в Ставрополе | ПРОШИВКА',
        description: 'Замена стекла и экрана iPhone, Samsung и Xiaomi в Ставрополе. Сохраняем оригинальную матрицу, проводим диагностику и даём гарантию.',
        keywords: 'замена стекла Ставрополь, замена экрана телефона Ставрополь, ремонт дисплея Ставрополь, замена экрана iPhone Ставрополь',
      },
      batteryReplacement: {
        title: 'Замена аккумулятора телефона в Ставрополе | ПРОШИВКА',
        description: 'Замена аккумулятора iPhone, Samsung, Xiaomi и других смартфонов в Ставрополе. Проверяем состояние батареи и выполняем ремонт с гарантией.',
        keywords: 'замена аккумулятора Ставрополь, замена батареи iPhone Ставрополь, замена аккумулятора Samsung Ставрополь',
      },
      waterDamage: {
        title: 'Ремонт телефона после воды в Ставрополе | ПРОШИВКА',
        description: 'Диагностика и ремонт телефона после попадания воды в Ставрополе. Устраняем последствия залития, коррозию и помогаем сохранить данные.',
        keywords: 'ремонт телефона после воды Ставрополь, залили телефон Ставрополь, восстановление телефона после воды',
      },
      modularRepair: {
        title: 'Модульный ремонт телефонов в Ставрополе | ПРОШИВКА',
        description: 'Замена экранов, камер, разъёмов и других модулей смартфонов в Ставрополе. Диагностика, согласование стоимости и гарантия на ремонт.',
        keywords: 'модульный ремонт Ставрополь, ремонт смартфонов Ставрополь, замена разъёма телефона Ставрополь',
      },
    },
  };
}

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
  const stavropolPreset = createStavropolSeoPreset();

  const pages = {
    home: createPageSeoEntry({
      title: 'Ремонт телефонов и прошивка смартфонов в Ставрополе | ПРОШИВКА',
      description:
        'Ремонт телефонов, прошивка, разблокировка и восстановление данных в Ставрополе. Диагностика, ремонт iPhone, Samsung и Xiaomi, гарантия на работы.',
      keywords:
        'ремонт телефонов Ставрополь, ремонт смартфонов Ставрополь, прошивка телефона Ставрополь, сервисный центр телефонов Ставрополь',
      path: '/',
    }),
    softwareRepair: createPageSeoEntry({
      title: 'Прошивка и программный ремонт телефонов в Ставрополе | ПРОШИВКА',
      description:
        'Прошивка смартфонов, снятие блокировок и восстановление данных в Ставрополе. Работаем с iPhone, Samsung, Xiaomi и другими устройствами.',
      keywords:
        'прошивка телефона Ставрополь, программный ремонт Ставрополь, разблокировка телефона Ставрополь, восстановление данных Ставрополь',
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

  for (const [pageId, patch] of Object.entries(stavropolPreset.pages)) {
    pages[pageId] = {
      ...pages[pageId],
      ...patch,
      ogTitle: patch.title,
      ogDescription: patch.description,
    };
  }

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
    localSeo: stavropolPreset.localSeo,
    jsonLd: {
      enabled: true,
      businessName: 'ПРОШИВКА',
      description:
        'Лаборатория восстановления смартфонов и планшетов: программный ремонт, прошивка, аппаратное восстановление.',
      telephone: '+7 (000) 000-00-00',
      address: stavropolPreset.jsonLd.address,
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
