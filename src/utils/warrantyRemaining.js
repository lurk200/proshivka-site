export function getWarrantyDaysLeft(warranty, at = new Date()) {
  if (!warranty?.until) return null;
  const end = new Date(warranty.until);
  const now = new Date(at);
  end.setHours(23, 59, 59, 999);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
}

export function formatWarrantyUntil(iso) {
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
