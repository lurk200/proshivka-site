/** Демо-контент витрины. Позже подключится админка + калькулятор цен. */

export const company = {
  name: 'ПРОШИВКА',
  tagline: 'Ремонт смартфонов и электроники',
  city: 'Ставрополь',
  address: 'ул. Пирогова, 5Ак4',
  schedule: '10:00–20:00 · ежедневно',
  phone: '+7 (988) 087-43-12',
  phoneHref: 'tel:+79880874312',
  rating: '5.0',
  reviewsCount: 128,
  telegram: 'https://t.me/',
  whatsapp: 'https://wa.me/79880874312',
}

/**
 * price.items — позиции прайса услуги.
 * Поля под будущий калькулятор: id, title, priceFrom, priceTo?, note?
 */
export const services = [
  {
    id: 'software',
    title: 'Прошивка',
    hint: 'Сбои, зависания, восстановление ПО',
    summary:
      'Восстанавливаем систему после сбоев, неудачных обновлений и программных блокировок. Сохраняем данные, когда это возможно.',
    timing: 'от 30 мин',
    guarantee: 'до 90 дней',
    points: [
      'Не включается / бесконечная перезагрузка',
      'Ошибки после обновления',
      'Восстановление прошивки',
      'Снятие программных блокировок',
    ],
    price: {
      note: 'Ориентир по ПО-работам. Модель и состояние влияют на срок и цену — уточним после диагностики.',
      items: [
        { id: 'sw-diag', title: 'Диагностика ПО', priceFrom: 0, priceLabel: 'бесплатно*', note: 'При согласии на ремонт' },
        { id: 'sw-flash', title: 'Прошивка / восстановление ПО', priceFrom: 1500, note: 'Android / типовые случаи' },
        { id: 'sw-boot', title: 'Ремонт загрузчика / soft-brick', priceFrom: 2000 },
        { id: 'sw-update', title: 'Восстановление после обновления', priceFrom: 1800 },
        { id: 'sw-data', title: 'Прошивка с попыткой сохранить данные', priceFrom: 2500, note: 'Не всегда возможно' },
      ],
    },
    tone: 'from-[#1e293b] to-[#0f172a]',
    image:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'glass',
    title: 'Стекло / дисплей',
    hint: 'Переклейка и замена модуля',
    summary:
      'Меняем разбитое стекло или весь модуль. Подбираем вариант под задачу: аккуратно и с проверкой сенсора после сборки.',
    timing: 'от 1 часа',
    guarantee: 'до 90 дней',
    points: [
      'Трещины и паутинка на стекле',
      'Не работает сенсор',
      'Пятна / полосы на экране',
      'Переклейка стекла с сохранением дисплея',
    ],
    price: {
      note: 'Цена сильно зависит от модели. Ниже — старт «от»; для вашей модели скажем точнее.',
      items: [
        { id: 'gl-diag', title: 'Диагностика дисплея', priceFrom: 0, priceLabel: 'бесплатно*', note: 'При согласии на ремонт' },
        { id: 'gl-glass', title: 'Переклейка стекла', priceFrom: 3500, note: 'Если матрица цела' },
        { id: 'gl-mod-a', title: 'Замена дисплейного модуля (бюджет / mid)', priceFrom: 4500 },
        { id: 'gl-mod-f', title: 'Замена дисплейного модуля (флагман)', priceFrom: 9000, note: 'iPhone / Galaxy S / Pixel и т.п.' },
        { id: 'gl-frame', title: 'Замена стекла + рамка / корпус (если нужно)', priceFrom: 5000 },
      ],
    },
    tone: 'from-[#0f766e] to-[#115e59]',
    image:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'battery',
    title: 'Аккумулятор',
    hint: 'Ёмкость, нагрев, быстрый разряд',
    summary:
      'Меняем изношенный АКБ, когда телефон быстро садится, греется или внезапно выключается. После замены — проверка зарядки.',
    timing: 'от 40 мин',
    guarantee: 'до 90 дней',
    points: [
      'Быстрый разряд',
      'Внезапные выключения',
      'Нагрев при зарядке',
      'Вздутие аккумулятора',
    ],
    price: {
      note: 'В стоимость обычно входит АКБ и работа. Точная цена — по модели.',
      items: [
        { id: 'bt-diag', title: 'Диагностика питания', priceFrom: 0, priceLabel: 'бесплатно*', note: 'При согласии на ремонт' },
        { id: 'bt-replace', title: 'Замена аккумулятора (типовые модели)', priceFrom: 2500 },
        { id: 'bt-flag', title: 'Замена аккумулятора (флагман)', priceFrom: 4500 },
        { id: 'bt-charge', title: 'Ремонт / замена разъёма зарядки', priceFrom: 2000 },
        { id: 'bt-ic', title: 'Ремонт цепи зарядки (контроллер)', priceFrom: 3500, note: 'После диагностики' },
      ],
    },
    tone: 'from-[#854d0e] to-[#713f12]',
    image:
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'water',
    title: 'После влаги',
    hint: 'Чистка, диагностика, спасение данных',
    summary:
      'После залития важна скорость. Делаем диагностику, промывку и сушку плат, пытаемся спасти устройство и данные.',
    timing: 'от 1 часа',
    guarantee: 'по результату диагностики',
    points: [
      'Попадание воды / напитка',
      'Не включается после влаги',
      'Коррозия контактов',
      'Спасение данных с залитого устройства',
    ],
    price: {
      note: 'После влаги смета часто уточняется по факту осмотра платы. Старт работ — ниже.',
      items: [
        { id: 'wt-diag', title: 'Срочная диагностика после влаги', priceFrom: 500, note: 'Зачитывается в ремонт' },
        { id: 'wt-clean', title: 'Чистка / промывка / сушка', priceFrom: 2500 },
        { id: 'wt-board', title: 'Восстановление после коррозии', priceFrom: 4000, note: 'Зависит от повреждений' },
        { id: 'wt-data', title: 'Спасение данных с залитого устройства', priceFrom: 3000 },
        { id: 'wt-full', title: 'Комплекс: чистка + ремонт узлов', priceFrom: 5500, priceTo: 15000 },
      ],
    },
    tone: 'from-[#1d4ed8] to-[#1e3a8a]',
    image:
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'unlock',
    title: 'Разблокировка',
    hint: 'Забыли пароль, Google / Apple ID',
    summary:
      'Помогаем вернуть доступ к устройству при забытом пароле и типовых блокировках — в рамках законных сценариев и проверки владельца.',
    timing: 'от 30 мин',
    guarantee: 'по работе',
    points: [
      'Забыт PIN / графический ключ',
      'FRP / аккаунт Google',
      'Программные блокировки',
      'Консультация по возможным вариантам',
    ],
    price: {
      note: 'Доступность и цена зависят от модели и типа блокировки. Сначала скажем, возможно ли.',
      items: [
        { id: 'un-consult', title: 'Консультация по блокировке', priceFrom: 0, priceLabel: 'бесплатно' },
        { id: 'un-pin', title: 'Сброс PIN / графического ключа', priceFrom: 1500, note: 'Если технически возможно' },
        { id: 'un-frp', title: 'Снятие FRP (Google)', priceFrom: 2000 },
        { id: 'un-mi', title: 'Разблокировка аккаунта производителя', priceFrom: 2500, note: 'Xiaomi / др. — по модели' },
        { id: 'un-complex', title: 'Сложные / редкие блокировки', priceLabel: 'по запросу' },
      ],
    },
    tone: 'from-[#4c1d95] to-[#2e1065]',
    image:
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'data',
    title: 'Спасение данных',
    hint: 'Фото, чаты, доступ к памяти',
    summary:
      'Если телефон не включается, а нужны файлы — сначала работаем на извлечение данных, потом уже обсуждаем ремонт.',
    timing: 'индивидуально',
    guarantee: 'по факту извлечения',
    points: [
      'Не включается, но нужны фото',
      'Повреждённый накопитель',
      'После неудачной прошивки',
      'Копия важных данных',
    ],
    price: {
      note: 'Оплата обычно за результат / этап. Сначала оценим шансы — без лишних обещаний.',
      items: [
        { id: 'dt-eval', title: 'Оценка возможности извлечения', priceFrom: 500, note: 'Зачитывается при успехе' },
        { id: 'dt-copy', title: 'Копия данных (устройство включается)', priceFrom: 1500 },
        { id: 'dt-soft', title: 'Извлечение после программного сбоя', priceFrom: 3000 },
        { id: 'dt-hw', title: 'Извлечение при аппаратных повреждениях', priceFrom: 5000, note: 'Индивидуально' },
        { id: 'dt-urgent', title: 'Срочное извлечение', priceFrom: 4000, note: 'По возможности в день обращения' },
      ],
    },
    tone: 'from-[#9a3412] to-[#7c2d12]',
    image:
      'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80',
  },
]

export function getServiceById(id) {
  return services.find((s) => s.id === id) ?? null
}

export const works = [
  {
    id: 'w1',
    title: 'Восстановление прошивки',
    model: 'Samsung Galaxy S22',
    category: 'Прошивка',
    status: 'Готово',
    image:
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'w2',
    title: 'Снятие блокировки',
    model: 'Xiaomi Redmi Note 11',
    category: 'Разблокировка',
    status: 'Готово',
    image:
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'w3',
    title: 'Спасение данных',
    model: 'iPhone 12',
    category: 'Данные',
    status: 'Извлечено',
    image:
      'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'w4',
    title: 'Переклейка стекла',
    model: 'iPhone 14 Pro',
    category: 'Дисплей',
    status: 'Готово',
    image:
      'https://images.unsplash.com/photo-1695048133142-1a20484428d3?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'w5',
    title: 'После залития',
    model: 'Huawei P30',
    category: 'Влага',
    status: 'Восстановлен',
    image:
      'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'w6',
    title: 'Замена АКБ',
    model: 'iPhone 13',
    category: 'Батарея',
    status: 'Готово',
    image:
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=900&q=80',
  },
]

export const trust = [
  { label: 'Диагностика', value: 'бесплатно*' },
  { label: 'Срок многих работ', value: 'от 30 мин' },
  { label: 'Гарантия', value: 'до 90 дней' },
  { label: 'Рейтинг', value: '5.0' },
]
