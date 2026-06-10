/** Секция «О нас» на главной странице. */
export const HOME_ABOUT = {
  title: 'О нас',
  subtitle:
    'Лаборатория восстановления устройств: диагностика, ремонт и прозрачные условия работы. Приезжайте в сервис или свяжитесь заранее — подскажем по срокам.',
  servicePhoto: {
    src: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1200',
    alt: 'Рабочая зона сервиса ПРОШИВКА',
  },
  /** Виджет Яндекс.Карт — замените координаты на точные вашего сервиса */
  yandexMap: {
    embedUrl:
      'https://yandex.ru/map-widget/v1/?ll=37.617635%2C55.755814&z=16&l=map&pt=37.617635%2C55.755814%2Cpm2rdm',
    openUrl: 'https://yandex.ru/maps/?pt=37.617635,55.755814&z=16&l=map',
    label: 'Открыть в Яндекс Картах',
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
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa8?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'work-2',
    title: 'Снятие блокировок',
    summary: 'Xiaomi Redmi Note 11 — забыт Mi-аккаунт после сброса. Удалили привязки, устройство снова в работе.',
    category: 'Блокировка',
    model: 'Xiaomi Redmi Note 11',
    status: 'РАЗБЛОКИРОВАНО',
    image: 'https://images.unsplash.com/photo-1598327105666-5b5ca6e2b2b2?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'work-3',
    title: 'Спасение данных',
    summary: 'iPhone 12 после залития. Извлекли рабочий архив 64 GB до окончательного ремонта платы.',
    category: 'Спасение данных',
    model: 'iPhone 12',
    status: 'ДАННЫЕ ИЗВЛЕЧЕНЫ',
    image: 'https://images.unsplash.com/photo-1556656793-08538906a9f0?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'work-4',
    title: 'Переклейка стекла',
    summary: 'Сохранили родную OLED-матрицу, заменили только верхнее стекло — дисплей как новый.',
    category: 'Аппаратный ремонт',
    model: 'iPhone 14 Pro',
    status: 'ГОТОВО',
    image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'work-5',
    title: 'Восстановление после влаги',
    summary: 'Ультразвуковая очистка и ревизия платы — устранили коррозию, телефон включился.',
    category: 'Залитие',
    model: 'Huawei P30',
    status: 'ВОССТАНОВЛЕНО',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=1200',
  },
];
