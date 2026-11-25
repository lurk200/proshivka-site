/** Форматирование цен прайса услуги. Позже подключится калькулятор из админки. */

export function formatRub(value) {
  if (value == null || Number.isNaN(Number(value))) return null
  return `${Number(value).toLocaleString('ru-RU')} ₽`
}

/** @param {{ priceFrom?: number, priceTo?: number, priceLabel?: string }} item */
export function formatPriceItem(item) {
  if (item.priceLabel) return item.priceLabel
  const from = formatRub(item.priceFrom)
  const to = formatRub(item.priceTo)
  if (from && to) return `${from} – ${to}`
  if (from) return `от ${from}`
  return 'по запросу'
}

/** Минимальная платная «от» по услуге для карточек списка (0 / бесплатно не считаем) */
export function serviceFromPrice(service) {
  const items = service?.price?.items ?? []
  const nums = items
    .map((i) => i.priceFrom)
    .filter((n) => typeof n === 'number' && n > 0)
  if (!nums.length) return null
  return Math.min(...nums)
}
