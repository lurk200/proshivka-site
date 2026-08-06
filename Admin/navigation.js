import {
  BarChart2,
  Bell,
  Building2,
  Calculator,
  ClipboardList,
  FileText,
  Globe,
  Image,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Navigation,
  QrCode,
  Scale,
  Send,
  Sparkles,
  Star,
} from 'lucide-react';

// Единый словарь для меню, строки навигации и поиска.
// Новые разделы добавляются только здесь, чтобы названия не расходились.
export const ADMIN_NAVIGATION = [
  {
    id: 'overview',
    items: [
      { path: '/admin', label: 'Обзор', description: 'Ключевые показатели, быстрые действия и последние изменения.', icon: LayoutDashboard, end: true },
      { path: '/admin/analytics', label: 'Аналитика', description: 'Посещаемость сайта, источники трафика и конверсии.', icon: BarChart2 },
    ],
  },
  {
    id: 'clients',
    title: 'Заказы и клиенты',
    items: [
      { path: '/admin/orders', label: 'Заказы', description: 'Заявки, статусы, печать, гарантия и массовые действия.', icon: ClipboardList },
      { path: '/admin/reviews', label: 'Отзывы', description: 'Отзывы клиентов: публикация, скрытие и обработка проблемных отзывов.', icon: Star },
    ],
  },
  {
    id: 'pricing',
    title: 'Цены и услуги',
    items: [
      { path: '/admin/repair-price', label: 'Прайс и услуги', description: 'Услуги, наценки, поставщики, склад и калькулятор стоимости.', icon: Calculator, aliases: ['калькулятор цен'] },
    ],
  },
  {
    id: 'content',
    title: 'Сайт и контент',
    defaultOpen: true,
    items: [
      { path: '/admin/main', label: 'Главная страница', description: 'Блоки, баннеры и тексты главной страницы.', icon: Image },
      { path: '/admin/software-repair', label: 'Программный ремонт', description: 'Секции, услуги, кейсы и CTA страницы программного ремонта.', icon: Sparkles },
      { path: '/admin/service-pages', label: 'Аппаратные услуги', description: 'Контент страниц аппаратного ремонта.', icon: FileText },
      { path: '/admin/service-template', label: 'Шаблон страниц услуг', description: 'Общий шаблон и структура страниц услуг.', icon: LayoutTemplate },
      { path: '/admin/works', label: 'Наши работы', description: 'Портфолио выполненных ремонтов.', icon: Layers },
      { path: '/admin/send-repair', label: 'Отправить в ремонт', description: 'Форма отправки устройства в ремонт.', icon: Send },
    ],
  },
  {
    id: 'marketing',
    title: 'SEO и навигация',
    items: [
      { path: '/admin/seo', label: 'SEO и продвижение', description: 'Метатеги, заголовки и описания страниц сайта.', icon: Globe, aliases: ['мета-теги'] },
      { path: '/admin/navigation', label: 'Навигация сайта', description: 'Меню в шапке, карточки услуг и ссылки в подвале.', icon: Navigation, aliases: ['меню и футер', 'меню и навигация'] },
    ],
  },
  {
    id: 'documents',
    title: 'Документы',
    items: [
      { path: '/admin/legal', label: 'Правовые документы', description: 'Политики, оферты и другие юридические документы.', icon: Scale },
      { path: '/admin/settings/documents', label: 'Шаблоны и QR-коды', description: 'Ссылки для отзывов и QR-коды для печати документов.', icon: QrCode, aliases: ['шаблоны печати', 'настройки документов'] },
    ],
  },
  {
    id: 'settings',
    title: 'Настройки',
    items: [
      { path: '/admin/settings/company', label: 'Компания и контакты', description: 'Реквизиты, контакты и данные компании.', icon: Building2, aliases: ['компания'] },
      { path: '/admin/settings/notifications', label: 'Уведомления', description: 'Шаблоны, каналы и журнал уведомлений клиентам.', icon: Bell },
    ],
  },
];

const BASE_ITEMS = ADMIN_NAVIGATION.flatMap(group => group.items);

export const ADMIN_SEARCH_ITEMS = [
  ...BASE_ITEMS,
  { path: '/admin/main?tab=banners', label: 'Баннеры главной', description: 'Баннеры услуг на главной странице.', group: 'Главная страница', route: '/admin/main' },
  { path: '/admin/main?tab=about', label: 'О нас и карта', description: 'Блок «О нас» и карта на главной странице.', group: 'Главная страница', route: '/admin/main' },
  { path: '/admin/software-repair?tab=hero', label: 'Первый экран — программный ремонт', description: 'Заголовок и подзаголовок страницы.', group: 'Программный ремонт', route: '/admin/software-repair' },
  { path: '/admin/software-repair?tab=sections', label: 'Секции — программный ремонт', description: 'Заголовки разделов страницы.', group: 'Программный ремонт', route: '/admin/software-repair' },
  { path: '/admin/software-repair?tab=services', label: 'Услуги — программный ремонт', description: 'Карточки услуг программного ремонта.', group: 'Программный ремонт', route: '/admin/software-repair' },
  { path: '/admin/software-repair?tab=cases', label: 'Кейсы — программный ремонт', description: 'Примеры выполненных работ.', group: 'Программный ремонт', route: '/admin/software-repair' },
  { path: '/admin/software-repair?tab=principles', label: 'О лаборатории', description: 'Принципы работы и описание лаборатории.', group: 'Программный ремонт', route: '/admin/software-repair' },
  { path: '/admin/software-repair?tab=cta', label: 'Призыв к действию — программный ремонт', description: 'Блок внизу страницы программного ремонта.', group: 'Программный ремонт', route: '/admin/software-repair' },
].map(item => ({ ...item, group: item.group ?? ADMIN_NAVIGATION.find(group => group.items.includes(item))?.title ?? 'Основное', route: item.route ?? item.path }));

export const SEARCH_GROUP_ORDER = ['Основное', 'Заказы и клиенты', 'Цены и услуги', 'Сайт и контент', 'Главная страница', 'Программный ремонт', 'SEO и навигация', 'Документы', 'Настройки'];

export function getAdminRouteLabel(pathname, search = '') {
  const tab = new URLSearchParams(search).get('tab');
  if (tab) {
    const tabItem = ADMIN_SEARCH_ITEMS.find(item => item.path === `${pathname}?tab=${tab}`);
    if (tabItem) return tabItem.label;
  }
  return BASE_ITEMS.find(item => item.path === pathname)?.label ?? 'Админ-панель';
}

export function isWideAdminRoute(pathname) {
  return ['/admin/orders', '/admin/repair-price', '/admin/analytics'].includes(pathname);
}
