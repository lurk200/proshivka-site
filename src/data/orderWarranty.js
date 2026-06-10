/** Сроки гарантии (дней) — доступны только при статусе «Выдан» */
export const WARRANTY_DAY_OPTIONS = [
  { days: 30, label: '30 дней' },
  { days: 60, label: '60 дней' },
  { days: 90, label: '90 дней' },
  { days: 180, label: '6 месяцев' },
  { days: 365, label: '1 год' },
];

export function formatDocDate(iso) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}
