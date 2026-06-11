export const PROSHIVKA_MAP = {
  lat: 45.019395,
  lon: 41.916583,
  zoom: 18,
  orgUrl: 'https://yandex.ru/maps/org/proshivka/120325503052/',
};

export function buildYandexWidgetUrl({ lon, lat, zoom } = PROSHIVKA_MAP) {
  return `https://yandex.ru/map-widget/v1/?ll=${lon},${lat}&z=${zoom}&pt=${lon},${lat},pm2rdm`;
}

export const DEFAULT_YANDEX_WIDGET_URL = buildYandexWidgetUrl(PROSHIVKA_MAP);

export function isEmbeddableYandexMapUrl(url = '') {
  return /yandex\.(ru|com)\/map-widget\/v1\//i.test(String(url));
}

function hasProshivkaCoords(url = '') {
  return String(url).includes(String(PROSHIVKA_MAP.lon)) && String(url).includes(String(PROSHIVKA_MAP.lat));
}

/** iframe принимает только map-widget; ссылки /maps/org/ и /maps/? в iframe запрещены (X-Frame-Options). */
export function resolveYandexMapConfig(yandexMap = {}) {
  const orgUrl = yandexMap.orgUrl || PROSHIVKA_MAP.orgUrl;
  const routeUrl = yandexMap.openUrl || orgUrl;
  const embedUrl =
    isEmbeddableYandexMapUrl(yandexMap.embedUrl) && hasProshivkaCoords(yandexMap.embedUrl)
      ? yandexMap.embedUrl
      : DEFAULT_YANDEX_WIDGET_URL;

  return {
    embedUrl,
    orgUrl,
    routeUrl,
    routeLabel: yandexMap.routeLabel ?? 'Построить маршрут',
    fallbackLabel: yandexMap.label ?? 'Открыть в Яндекс Картах',
  };
}
