/** Быстрые пресеты для приёмки — один тап вместо набора. */

export const BRANDS = [
  'Apple',
  'Samsung',
  'Xiaomi',
  'Redmi',
  'POCO',
  'Realme',
  'Huawei',
  'Honor',
  'OnePlus',
  'Google',
  'Другое',
]

/** Популярные модели по бренду (короткий список под быстрый выбор). */
export const MODELS_BY_BRAND = {
  Apple: [
    'iPhone 11',
    'iPhone 12',
    'iPhone 12 Pro',
    'iPhone 13',
    'iPhone 13 Pro',
    'iPhone 14',
    'iPhone 14 Pro',
    'iPhone 15',
    'iPhone 15 Pro',
    'iPhone 16',
    'iPhone XR',
    'iPhone SE',
  ],
  Samsung: [
    'Galaxy S21',
    'Galaxy S22',
    'Galaxy S23',
    'Galaxy S24',
    'Galaxy A54',
    'Galaxy A55',
    'Galaxy A34',
    'Galaxy A15',
    'Galaxy Note 20',
  ],
  Xiaomi: ['Xiaomi 12', 'Xiaomi 13', 'Xiaomi 14', 'Mi 11', '12T', '13T'],
  Redmi: ['Note 11', 'Note 12', 'Note 13', 'Note 13 Pro', '12C', '13C'],
  POCO: ['X5', 'X6', 'F5', 'M5', 'M6'],
  Realme: ['GT Neo', '11 Pro', '12 Pro', 'C55', 'Note 50'],
  Huawei: ['P30', 'P40', 'P50', 'Nova 9', 'Nova 11', 'Mate 40'],
  Honor: ['X8', 'X9', '90', '200', 'Magic5'],
  OnePlus: ['Nord 2', 'Nord 3', '11', '12'],
  Google: ['Pixel 6', 'Pixel 7', 'Pixel 8', 'Pixel 8a'],
}

export const ISSUE_PRESETS = [
  'Не включается',
  'Замена дисплея',
  'Разбито стекло',
  'Замена аккумулятора',
  'Не заряжается',
  'Замена разъёма зарядки',
  'После влаги',
  'Не работает сенсор',
  'Нет сети / SIM',
  'Камера',
  'Динамик / микрофон',
  'Кнопки',
  'Прошивка',
  'Разблокировка',
  'Диагностика',
  'Другое',
]

/** Быстрые позиции для акта выдачи. */
export const WORK_POSITION_PRESETS = [
  'Замена дисплея',
  'Замена аккумулятора',
  'Замена разъёма зарядки',
  'Замена задней крышки',
  'Замена динамика',
  'Замена камеры',
  'Чистка после влаги',
  'Прошивка / восстановление ПО',
  'Диагностика',
]

/** Нормализация ввода телефона РФ: всегда +7 (XXX) XXX-XX-XX */
export function formatRuPhoneInput(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return '+7 '
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`
  if (!digits.startsWith('7')) digits = `7${digits}`
  digits = digits.slice(0, 11)

  const rest = digits.slice(1)
  let out = '+7'
  if (!rest.length) return `${out} `
  out += ` (${rest.slice(0, 3)}`
  if (rest.length >= 3) out += ')'
  if (rest.length > 3) out += ` ${rest.slice(3, 6)}`
  if (rest.length > 6) out += `-${rest.slice(6, 8)}`
  if (rest.length > 8) out += `-${rest.slice(8, 10)}`
  return out
}

export function phoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '')
}

/** 10 цифр после кода страны (без ведущей 7/8). */
export function phoneLocalDigits(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '')
  if (digits.startsWith('8')) digits = digits.slice(1)
  if (digits.startsWith('7')) digits = digits.slice(1)
  return digits.slice(0, 10)
}

/** Маска локальной части: (999) 000-00-00 */
export function formatPhoneLocalMask(raw) {
  const rest = phoneLocalDigits(raw)
  if (!rest.length) return ''
  let out = '('
  out += rest.slice(0, 3)
  if (rest.length >= 3) out += ')'
  if (rest.length > 3) out += ` ${rest.slice(3, 6)}`
  if (rest.length > 6) out += `-${rest.slice(6, 8)}`
  if (rest.length > 8) out += `-${rest.slice(8, 10)}`
  return out
}

export function fullPhoneFromLocal(localRaw) {
  const local = phoneLocalDigits(localRaw)
  return formatRuPhoneInput(`7${local}`)
}

export function isValidRuPhone(phone) {
  const d = phoneDigits(phone)
  return d.length === 11 && d.startsWith('7')
}

/** 4–5 ходовых моделей для строки «Частые». */
export function frequentModelsForBrand(brand) {
  return (MODELS_BY_BRAND[brand] || []).slice(0, 5)
}
