import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

const DEFAULTS = {
  company: {
    // Идентификация
    name: 'ПРОШИВКА',
    tagline: 'Ремонт смартфонов и электроники',
    brandTagline: 'Ремонт смартфонов и электроники',
    descriptor: 'Лаборатория восстановления устройств',
    footerTagline: 'Диагностика · Ремонт · Восстановление данных',
    // Контакты
    phone: '+7 (988) 087-43-12',
    email: '',
    website: 'proshivka.online',
    address: 'улица Пирогова, 5Ак4, Ставрополь, 355032',
    schedule: '10:00 - 20:00 Ежедневно',
    // Мессенджеры/соцсети
    contacts: [
      { type: 'telegram', label: 'Telegram', url: '' },
      { type: 'whatsapp', label: 'WhatsApp', url: '' },
      { type: 'vk', label: 'ВКонтакте', url: '' },
      { type: 'max', label: 'MAX', url: '' },
    ],
    // Рейтинг и отзывы
    rating: '5.0',
    reviewUrl: 'https://yandex.ru/maps/org/proshivka/120325503052/',
    logoUrl: '',
  },
};

export function readSettings(key) {
  const fp = path.join(DATA_DIR, `${key}.json`);
  try {
    if (fs.existsSync(fp)) {
      return { ...DEFAULTS[key], ...JSON.parse(fs.readFileSync(fp, 'utf8')) };
    }
  } catch { /* empty */ }
  return { ...(DEFAULTS[key] || {}) };
}

export function writeSettings(key, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const merged = { ...(DEFAULTS[key] || {}), ...data };
  fs.writeFileSync(path.join(DATA_DIR, `${key}.json`), JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}
