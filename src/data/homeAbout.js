import { buildYandexWidgetUrl, PROSHIVKA_MAP } from '../utils/yandexMap';

/** Секция «О нас» на главной странице. */
export const HOME_ABOUT = {
  eyebrow: '',
  title: 'О нас',
  subtitle:
    'Лаборатория восстановления устройств: диагностика, ремонт и прозрачные условия работы. Приезжайте в сервис или свяжитесь заранее — подскажем по срокам.',
  servicePhoto: {
    src: '/images/placeholder.svg',
    alt: 'Рабочая зона сервиса ПРОШИВКА',
  },
  /** Виджет Яндекс.Карт — сервис ПРОШИВКА, Ставрополь (45.019395, 41.916583) */
  yandexMap: {
    embedUrl: buildYandexWidgetUrl(PROSHIVKA_MAP),
    openUrl: PROSHIVKA_MAP.orgUrl,
    orgUrl: PROSHIVKA_MAP.orgUrl,
    label: 'Открыть в Яндекс Картах',
    routeLabel: 'Построить маршрут',
  },
};

/** Карусель «Наши работы» — краткие баннеры кейсов */
export const HOME_WORKS = [
  {
    id: 'work-1',
    title: 'Восстановление прошивки',
    summary: 'Samsung Galaxy S22 не включался после ночного обновления. Восстановили загрузчик, все фото клиента на месте.',
    category: 'Программный сбой',
    model: 'Samsung Galaxy S22',
    status: 'УСПЕШНО',
    image: '/images/placeholder.svg',
  },
  {
    id: 'work-2',
    title: 'Снятие блокировок',
    summary: 'Xiaomi Redmi Note 11 — забыт Mi-аккаунт после сброса. Удалили привязки, устройство снова в работе.',
    category: 'Блокировка',
    model: 'Xiaomi Redmi Note 11',
    status: 'РАЗБЛОКИРОВАНО',
    image: '/images/placeholder.svg',
  },
  {
    id: 'work-3',
    title: 'Спасение данных',
    summary: 'iPhone 12 после залития. Извлекли рабочий архив 64 GB до окончательного ремонта платы.',
    category: 'Спасение данных',
    model: 'iPhone 12',
    status: 'ДАННЫЕ ИЗВЛЕЧЕНЫ',
    image: '/images/placeholder.svg',
  },
  {
    id: 'work-4',
    title: 'Переклейка стекла',
    summary: 'Сохранили родную OLED-матрицу, заменили только верхнее стекло — дисплей как новый.',
    category: 'Аппаратный ремонт',
    model: 'iPhone 14 Pro',
    status: 'ГОТОВО',
    image: '/images/placeholder.svg',
  },
  {
    id: 'work-5',
    title: 'Восстановление после влаги',
    summary: 'Ультразвуковая очистка и ревизия платы — устранили коррозию, телефон включился.',
    category: 'Залитие',
    model: 'Huawei P30',
    status: 'ВОССТАНОВЛЕНО',
    image: '/images/placeholder.svg',
  },
];
