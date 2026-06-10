const ASK_MESSAGE = 'Здравствуйте! Подскажите, пожалуйста, по ремонту.';
const REPAIR_MESSAGE = 'Здравствуйте! Хочу отправить устройство в ремонт.';

function normalizeTel(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
}

/** @param {string} url @param {string} text */
export function withWhatsappText(url, text) {
  if (!url?.trim()) return null;
  try {
    const parsed = new URL(url, 'https://wa.me');
    const path = parsed.pathname.replace(/\//g, '');
    const phone = path.match(/^\d+$/) ? path : parsed.searchParams.get('phone');
    if (phone) {
      return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    }
    parsed.searchParams.set('text', text);
    return parsed.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}text=${encodeURIComponent(text)}`;
  }
}

/** @param {string} text */
export function telegramShareUrl(text) {
  const page =
    typeof window !== 'undefined' ? window.location.href : 'https://proshivka.ru';
  return `https://t.me/share/url?url=${encodeURIComponent(page)}&text=${encodeURIComponent(text)}`;
}

/** @param {{ type: string, label?: string, url?: string }[]} contacts */
export function getAskMasterChannels(contacts = []) {
  return (contacts ?? [])
    .filter((c) => c.url?.trim() && c.type !== 'viber')
    .map((c) => {
      let url = c.url.trim();
      if (c.type === 'whatsapp') {
        url = withWhatsappText(url, ASK_MESSAGE) || url;
      }
      return {
        type: c.type,
        label: c.label || c.type,
        url,
      };
    });
}

/** @param {string} [phone] */
export function getTelHref(phone) {
  const tel = normalizeTel(phone);
  return tel ? `tel:+${tel}` : null;
}

/**
 * @param {{ type: string, url?: string }[]} contacts
 * @param {string} [phone]
 */
export function getAskMasterHref(contacts = [], phone) {
  const telegram = contacts.find((c) => c.type === 'telegram' && c.url?.trim());
  if (telegram?.url) return telegram.url.trim();

  const whatsapp = contacts.find((c) => c.type === 'whatsapp' && c.url?.trim());
  if (whatsapp?.url) return withWhatsappText(whatsapp.url, ASK_MESSAGE);

  return getTelHref(phone);
}

/**
 * @param {{ type: string, url?: string }[]} contacts
 * @param {string} [phone]
 */
export function getSendRepairHref(contacts = [], phone) {
  const whatsapp = contacts.find((c) => c.type === 'whatsapp' && c.url?.trim());
  if (whatsapp?.url) return withWhatsappText(whatsapp.url, REPAIR_MESSAGE);

  const telegram = contacts.find((c) => c.type === 'telegram' && c.url?.trim());
  if (telegram?.url) return telegramShareUrl(REPAIR_MESSAGE);

  const max = contacts.find((c) => c.type === 'max' && c.url?.trim());
  if (max?.url) return max.url.trim();

  const tel = normalizeTel(phone);
  return tel ? `tel:+${tel}` : null;
}

export { ASK_MESSAGE, REPAIR_MESSAGE };
