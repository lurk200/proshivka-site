export const SOCIAL_DISPLAY_ORDER = ['telegram', 'max', 'whatsapp', 'vk'];

const LABELS = {
  telegram: 'Telegram',
  max: 'MAX',
  whatsapp: 'WhatsApp',
  vk: 'ВКонтакте',
};

/** @param {{ type: string, label?: string, url?: string }[]} contacts */
export function getActiveSocialContacts(contacts = []) {
  const byType = Object.fromEntries(contacts.map((c) => [c.type, c]));

  return SOCIAL_DISPLAY_ORDER.map((type) => byType[type])
    .filter((c) => c?.url?.trim() && c.type !== 'viber')
    .map((c) => ({
      ...c,
      label: LABELS[c.type] ?? c.label,
    }));
}
