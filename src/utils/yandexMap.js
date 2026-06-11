export const PROSHIVKA_MAP = {
  lat: 45.019395,
  lon: 41.916583,
  zoom: 16,
  oid: '120325503052',
  orgUrl: 'https://yandex.ru/maps/org/proshivka/120325503052/',
};

/**
 * Строит URL embed-виджета Яндекс Карт.
 * С параметром oid показывает баннер/карточку организации как на Яндекс Картах.
 */
export function buildYandexWidgetUrl({ lon, lat, zoom, oid } = PROSHIVKA_MAP) {
  const base = `https://yandex.ru/map-widget/v1/?ll=${lon},${lat}&z=${zoom ?? 16}`;
  if (oid) return `${base}&ol=biz&oid=${oid}`;
  return `${base}&pt=${lon},${lat},pm2rdm`;
}

export const DEFAULT_YANDEX_WIDGET_URL = buildYandexWidgetUrl(PROSHIVKA_MAP);

export function isEmbeddableYandexMapUrl(url = '') {
  return /yandex\.(ru|com)\/map-widget\/v1\//i.test(String(url));
}

/**
 * Разрешает конфиг карты из CMS-данных.
 * Если в сохранённом embedUrl нет ol=biz&oid= — используется DEFAULT_YANDEX_WIDGET_URL,
 * который показывает баннер/карточку организации.
 */
export function resolveYandexMapConfig(yandexMap = {}) {
  const orgUrl = yandexMap.orgUrl || PROSHIVKA_MAP.orgUrl;
  const routeUrl = yandexMap.openUrl || orgUrl;

  const stored = String(yandexMap.embedUrl || '');
  const storedIsValid =
    isEmbeddableYandexMapUrl(stored) &&
    stored.includes(PROSHIVKA_MAP.oid) &&
    stored.includes('ol=biz');

  const embedUrl = storedIsValid ? stored : DEFAULT_YANDEX_WIDGET_URL;

  return {
    embedUrl,
    orgUrl,
    routeUrl,
    routeLabel: yandexMap.routeLabel ?? 'Построить маршрут',
    fallbackLabel: yandexMap.label ?? 'Открыть в Яндекс Картах',
  };
}
