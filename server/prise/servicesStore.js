import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const SUPPLIERS_FILE = path.join(DATA_DIR, 'suppliers.json');

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, defaults) {
  ensureDir();
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {}
  return defaults;
}

function writeJson(file, data) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

const NOW = new Date().toISOString();

// ── Default labor costs by part type ─────────────────────────────────────────

const DEFAULT_LABOR = {
  display: 2000, battery: 1500, port: 1500,
  camera: 1500, speaker: 1000, button: 1000,
  cover: 800, keyboard: 1200, other: 500,
};

// ── Synonym map for search expansion (lowercase) ──────────────────────────────

const SYNONYM_MAP = {
  'дисплей':       ['экран', 'матрица', 'стекло', 'тачскрин', 'экранчик'],
  'экран':         ['дисплей', 'матрица', 'стекло', 'тачскрин'],
  'матрица':       ['дисплей', 'экран'],
  'стекло':        ['дисплей', 'экран', 'тачскрин'],
  'тачскрин':      ['дисплей', 'экран', 'стекло'],
  'аккумулятор':   ['батарея', 'акб', 'акум', 'акумулятор'],
  'батарея':       ['аккумулятор', 'акб', 'акум'],
  'акб':           ['аккумулятор', 'батарея'],
  'акум':          ['аккумулятор', 'батарея', 'акб'],
  'корпус':        ['крышка', 'задняя крышка', 'задняя панель', 'back cover', 'задняя стенка'],
  'крышка':        ['корпус', 'задняя панель', 'задняя крышка'],
  'задняя крышка': ['корпус', 'крышка'],
  'задняя панель': ['корпус', 'крышка'],
  'разъём':        ['коннектор', 'порт зарядки', 'зарядка', 'usb', 'lightning', 'type-c', 'гнездо'],
  'коннектор':     ['разъём', 'порт', 'зарядка'],
  'зарядка':       ['разъём', 'коннектор', 'порт зарядки'],
  'зарядник':      ['разъём', 'коннектор', 'порт зарядки'],
  'порт':          ['разъём', 'коннектор'],
  'динамик':       ['звук', 'спикер', 'слуховой', 'разговорный'],
  'спикер':        ['динамик', 'звук'],
  'микрофон':      ['звук', 'микрофоны'],
  'звук':          ['динамик', 'микрофон'],
  'камера':        ['фотокамера', 'камеры', 'основная камера', 'фронтальная камера'],
  'клавиатура':    ['клавиши', 'кнопки ноутбука'],
  'диагностика':   ['проверка', 'диагноз', 'осмотр'],
  'чистка':        ['пыль', 'чистить', 'охлаждение'],
};

function expandQuery(query) {
  const q = query.toLowerCase().trim();
  const terms = new Set([q]);
  // Full phrase lookup
  if (SYNONYM_MAP[q]) SYNONYM_MAP[q].forEach(s => terms.add(s));
  // Word-by-word lookup
  q.split(/\s+/).forEach(word => {
    if (SYNONYM_MAP[word]) SYNONYM_MAP[word].forEach(s => terms.add(s));
  });
  return [...terms];
}

// ── Freshness ─────────────────────────────────────────────────────────────────

export function getFreshnessStatus(service) {
  const ts = service.lastChecked ?? service.updatedAt ?? service.createdAt;
  if (!ts) return 'fresh';
  const days = (Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60 * 24);
  if (days < 30) return 'fresh';
  if (days < 90) return 'stale';
  return 'outdated';
}

// ── Migration: backfill missing fields on read ────────────────────────────────

function migrateService(s) {
  return {
    laborCost: s.laborCost ?? DEFAULT_LABOR[s.partType] ?? 500,
    partCost: s.partCost ?? null,
    purchasePrice: s.purchasePrice ?? null,
    lastChecked: s.lastChecked ?? s.updatedAt ?? NOW,
    ...s,
  };
}

// ── Default data ──────────────────────────────────────────────────────────────

const DEFAULT_SUPPLIERS = [
  { id: 'sup_001', name: 'TagGSM', url: 'taggsmprof.ru', searchTemplate: '', lastPriceCheck: null, phone: '', rating: 5, note: 'Основной поставщик, интеграция через API', createdAt: NOW },
  { id: 'sup_002', name: 'GSMops', url: 'gsmops.ru', searchTemplate: 'https://gsmops.ru/search/?query={query}', lastPriceCheck: null, phone: '', rating: 4, note: 'Дисплеи и аккумуляторы', createdAt: NOW },
  { id: 'sup_003', name: 'Местный склад', url: '', searchTemplate: '', lastPriceCheck: null, phone: '', rating: 3, note: 'Наличие в городе', createdAt: NOW },
];

const DEFAULT_SERVICES = [
  // ── Смартфоны — Дисплей ──────────────────────────────────────────────────
  {
    id: 'svc_001', name: 'Замена дисплея iPhone',
    description: 'Замена дисплея в сборе. OLED / JCID / Оригинал на выбор.',
    category: 'replace', deviceType: 'smartphone', partType: 'display', brand: 'Apple',
    price: null, priceFrom: 4500, priceTo: 18000,
    laborCost: 3200, partCost: null,
    duration: '1–2 часа', hasExpress: true, expressMultiplier: 1.5,
    popularity: 99, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_002', name: 'Замена дисплея Samsung Galaxy',
    description: 'AMOLED / In-Cell. Подходит для всех серий Galaxy.',
    category: 'replace', deviceType: 'smartphone', partType: 'display', brand: 'Samsung',
    price: null, priceFrom: 3500, priceTo: 9500,
    laborCost: 2000, partCost: null,
    duration: '1–2 часа', hasExpress: true, expressMultiplier: 1.5,
    popularity: 95, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_003', name: 'Замена дисплея Xiaomi / Redmi / POCO',
    description: 'AMOLED и IPS-дисплеи. Большой выбор моделей в наличии.',
    category: 'replace', deviceType: 'smartphone', partType: 'display', brand: 'Xiaomi',
    price: null, priceFrom: 2500, priceTo: 6000,
    laborCost: 2000, partCost: null,
    duration: '1–2 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 90, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  // ── Смартфоны — Аккумулятор ──────────────────────────────────────────────
  {
    id: 'svc_004', name: 'Замена аккумулятора iPhone',
    description: 'Оригинальные или совместимые аккумуляторы. Восстановление ёмкости.',
    category: 'replace', deviceType: 'smartphone', partType: 'battery', brand: 'Apple',
    price: null, priceFrom: 3200, priceTo: 5500,
    laborCost: 1900, partCost: null,
    duration: '40–60 мин', hasExpress: true, expressMultiplier: 1.3,
    popularity: 98, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_005', name: 'Замена аккумулятора Samsung',
    description: 'Быстрая замена АКБ без потери данных.',
    category: 'replace', deviceType: 'smartphone', partType: 'battery', brand: 'Samsung',
    price: null, priceFrom: 2200, priceTo: 3800,
    laborCost: 1500, partCost: null,
    duration: '40–60 мин', hasExpress: false, expressMultiplier: 1.5,
    popularity: 92, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_006', name: 'Замена аккумулятора Xiaomi / Redmi',
    description: 'Совместимые АКБ. Гарантия 6 месяцев.',
    category: 'replace', deviceType: 'smartphone', partType: 'battery', brand: 'Xiaomi',
    price: null, priceFrom: 1800, priceTo: 3200,
    laborCost: 1500, partCost: null,
    duration: '40–60 мин', hasExpress: false, expressMultiplier: 1.5,
    popularity: 88, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  // ── Смартфоны — Разъём зарядки ───────────────────────────────────────────
  {
    id: 'svc_007', name: 'Замена разъёма зарядки iPhone (Lightning / USB-C)',
    description: 'Замена нижнего шлейфа с разъёмом зарядки.',
    category: 'replace', deviceType: 'smartphone', partType: 'port', brand: 'Apple',
    price: null, priceFrom: 3800, priceTo: 6500,
    laborCost: 2100, partCost: null,
    duration: '1–2 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 80, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_008', name: 'Замена разъёма зарядки Android (USB-C / micro-USB)',
    description: 'Замена разъёма для смартфонов Samsung, Xiaomi и других брендов.',
    category: 'replace', deviceType: 'smartphone', partType: 'port', brand: null,
    price: null, priceFrom: 2000, priceTo: 4500,
    laborCost: 1500, partCost: null,
    duration: '1–2 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 75, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  // ── Смартфоны — Камера ───────────────────────────────────────────────────
  {
    id: 'svc_009', name: 'Замена основной камеры',
    description: 'Замена модуля задней камеры. Восстановление качества фото.',
    category: 'replace', deviceType: 'smartphone', partType: 'camera', brand: null,
    price: null, priceFrom: 2000, priceTo: 7000,
    laborCost: 1500, partCost: null,
    duration: '1–2 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 65, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_010', name: 'Замена фронтальной камеры',
    description: 'Замена фронтального модуля. Устранение проблем с Face ID / selfie.',
    category: 'replace', deviceType: 'smartphone', partType: 'camera', brand: null,
    price: null, priceFrom: 1500, priceTo: 4500,
    laborCost: 1500, partCost: null,
    duration: '1–1.5 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 60, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  // ── Смартфоны — Корпус/Крышка ────────────────────────────────────────────
  {
    id: 'svc_011', name: 'Замена задней крышки / корпуса',
    description: 'Замена задней стеклянной или пластиковой крышки. Восстановление вида.',
    category: 'replace', deviceType: 'smartphone', partType: 'cover', brand: null,
    price: null, priceFrom: 1500, priceTo: 5500,
    laborCost: 800, partCost: null,
    duration: '30–60 мин', hasExpress: false, expressMultiplier: 1.5,
    popularity: 70, supplierId: 'sup_002', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  // ── Смартфоны — Динамик/Микрофон ─────────────────────────────────────────
  {
    id: 'svc_012', name: 'Замена слухового / разговорного динамика',
    description: 'Устранение проблем со звуком при звонках.',
    category: 'replace', deviceType: 'smartphone', partType: 'speaker', brand: null,
    price: null, priceFrom: 1500, priceTo: 3500,
    laborCost: 1000, partCost: null,
    duration: '1–1.5 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 55, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_012b', name: 'Замена полифонического динамика',
    description: 'Нет звука, хрипит, не играет музыка — замена полифона.',
    category: 'replace', deviceType: 'smartphone', partType: 'speaker', brand: null,
    price: null, priceFrom: 1200, priceTo: 3000,
    laborCost: 1000, partCost: null,
    duration: '1–1.5 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 52, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_012c', name: 'Замена микрофона',
    description: 'Собеседник не слышит при звонке — замена микрофона.',
    category: 'replace', deviceType: 'smartphone', partType: 'speaker', brand: null,
    price: null, priceFrom: 1200, priceTo: 2800,
    laborCost: 1000, partCost: null,
    duration: '1–1.5 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 48, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  // ── Смартфоны — Кнопки ───────────────────────────────────────────────────
  {
    id: 'svc_013', name: 'Замена кнопки питания / громкости',
    description: 'Замена шлейфа боковых кнопок. Кнопка не нажимается или заедает.',
    category: 'replace', deviceType: 'smartphone', partType: 'button', brand: null,
    price: null, priceFrom: 1000, priceTo: 2500,
    laborCost: 1000, partCost: null,
    duration: '1–1.5 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 50, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_013b', name: 'Замена кнопки Home / Touch ID',
    description: 'Кнопка Home не работает — замена шлейфа.',
    category: 'replace', deviceType: 'smartphone', partType: 'button', brand: 'Apple',
    price: null, priceFrom: 1500, priceTo: 3500,
    laborCost: 1000, partCost: null,
    duration: '1–1.5 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 45, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  // ── Смартфоны — Диагностика ──────────────────────────────────────────────
  {
    id: 'svc_014', name: 'Диагностика смартфона',
    description: 'Полная диагностика неисправностей. Бесплатно при последующем ремонте.',
    category: 'diagnostic', deviceType: 'smartphone', partType: 'other', brand: null,
    price: 500, priceFrom: null, priceTo: null,
    laborCost: 500, partCost: 0,
    duration: '30–60 мин', hasExpress: false, expressMultiplier: 1,
    popularity: 100, supplierId: null, available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  // ── Планшеты ─────────────────────────────────────────────────────────────
  {
    id: 'svc_015', name: 'Замена дисплея планшета',
    description: 'Замена тачскрина или дисплея в сборе для iPad, Samsung Tab, Xiaomi Pad.',
    category: 'replace', deviceType: 'tablet', partType: 'display', brand: null,
    price: null, priceFrom: 3500, priceTo: 12000,
    laborCost: 2500, partCost: null,
    duration: '1.5–3 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 75, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_016', name: 'Замена аккумулятора планшета',
    description: 'Восстановление ёмкости АКБ, длительное время работы.',
    category: 'replace', deviceType: 'tablet', partType: 'battery', brand: null,
    price: null, priceFrom: 2500, priceTo: 5500,
    laborCost: 2000, partCost: null,
    duration: '1–2 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 65, supplierId: 'sup_001', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_016b', name: 'Замена корпуса / крышки планшета',
    description: 'Замена задней панели или корпуса планшета при повреждении.',
    category: 'replace', deviceType: 'tablet', partType: 'cover', brand: null,
    price: null, priceFrom: 2000, priceTo: 7000,
    laborCost: 1500, partCost: null,
    duration: '1–2 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 50, supplierId: 'sup_002', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_017', name: 'Диагностика планшета',
    description: 'Комплексная диагностика. Бесплатно при ремонте.',
    category: 'diagnostic', deviceType: 'tablet', partType: 'other', brand: null,
    price: 500, priceFrom: null, priceTo: null,
    laborCost: 500, partCost: 0,
    duration: '30–60 мин', hasExpress: false, expressMultiplier: 1,
    popularity: 80, supplierId: null, available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  // ── Ноутбуки ─────────────────────────────────────────────────────────────
  {
    id: 'svc_018', name: 'Замена матрицы / дисплея ноутбука',
    description: 'Замена экрана любого ноутбука. Широкий выбор матриц в наличии.',
    category: 'replace', deviceType: 'laptop', partType: 'display', brand: null,
    price: null, priceFrom: 5000, priceTo: 18000,
    laborCost: 2000, partCost: null,
    duration: '1–2 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 70, supplierId: 'sup_002', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_019', name: 'Замена аккумулятора ноутбука',
    description: 'Совместимые АКБ для всех брендов ноутбуков.',
    category: 'replace', deviceType: 'laptop', partType: 'battery', brand: null,
    price: null, priceFrom: 3000, priceTo: 8000,
    laborCost: 1500, partCost: null,
    duration: '30–60 мин', hasExpress: false, expressMultiplier: 1.5,
    popularity: 80, supplierId: 'sup_002', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_020', name: 'Замена клавиатуры ноутбука',
    description: 'Клавиши залипают или не работают — заменим в тот же день.',
    category: 'replace', deviceType: 'laptop', partType: 'keyboard', brand: null,
    price: null, priceFrom: 2000, priceTo: 6500,
    laborCost: 1200, partCost: null,
    duration: '30–60 мин', hasExpress: false, expressMultiplier: 1.5,
    popularity: 65, supplierId: 'sup_002', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_021', name: 'Чистка ноутбука от пыли',
    description: 'Разборка, чистка, замена термопасты. Снижение температуры на 15–20°C.',
    category: 'repair', deviceType: 'laptop', partType: 'other', brand: null,
    price: 1500, priceFrom: null, priceTo: null,
    laborCost: 1500, partCost: 100,
    duration: '1–1.5 часа', hasExpress: false, expressMultiplier: 1,
    popularity: 85, supplierId: null, available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_022', name: 'Диагностика ноутбука',
    description: 'Полная диагностика железа и ПО. Бесплатно при ремонте.',
    category: 'diagnostic', deviceType: 'laptop', partType: 'other', brand: null,
    price: 500, priceFrom: null, priceTo: null,
    laborCost: 500, partCost: 0,
    duration: '30–60 мин', hasExpress: false, expressMultiplier: 1,
    popularity: 90, supplierId: null, available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_023', name: 'Замена разъёма зарядки ноутбука',
    description: 'Ноутбук не заряжается — замена DC-jack или Type-C разъёма.',
    category: 'replace', deviceType: 'laptop', partType: 'port', brand: null,
    price: null, priceFrom: 1500, priceTo: 4000,
    laborCost: 1500, partCost: null,
    duration: '1–2 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 60, supplierId: 'sup_002', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_024', name: 'Замена оперативной памяти (RAM) ноутбука',
    description: 'Upgrade RAM для увеличения производительности.',
    category: 'replace', deviceType: 'laptop', partType: 'other', brand: null,
    price: null, priceFrom: 2000, priceTo: 8000,
    laborCost: 800, partCost: null,
    duration: '30–60 мин', hasExpress: false, expressMultiplier: 1.5,
    popularity: 55, supplierId: 'sup_002', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
  {
    id: 'svc_025', name: 'Замена SSD / жёсткого диска ноутбука',
    description: 'Замена HDD на SSD или расширение хранилища. Перенос данных включён.',
    category: 'replace', deviceType: 'laptop', partType: 'other', brand: null,
    price: null, priceFrom: 2500, priceTo: 12000,
    laborCost: 1000, partCost: null,
    duration: '1–2 часа', hasExpress: false, expressMultiplier: 1.5,
    popularity: 72, supplierId: 'sup_002', available: true, archived: false,
    lastChecked: NOW, history: [], createdAt: NOW, updatedAt: NOW,
  },
];

// ── Auto-init: persist defaults to disk on first run ─────────────────────────

function initializeDefaults() {
  ensureDir();
  if (!fs.existsSync(SERVICES_FILE)) {
    try { fs.writeFileSync(SERVICES_FILE, JSON.stringify(DEFAULT_SERVICES, null, 2), 'utf8'); } catch {}
  }
  if (!fs.existsSync(SUPPLIERS_FILE)) {
    try { fs.writeFileSync(SUPPLIERS_FILE, JSON.stringify(DEFAULT_SUPPLIERS, null, 2), 'utf8'); } catch {}
  }
}

initializeDefaults();

// ── Services ──────────────────────────────────────────────────────────────────

export function listServices({ category, deviceType, partType, brand, search, archived, available } = {}) {
  let items = readJson(SERVICES_FILE, DEFAULT_SERVICES).map(migrateService);
  if (archived === false || archived === undefined) items = items.filter(s => !s.archived);
  else if (archived === true) items = items.filter(s => s.archived);
  if (available !== undefined) items = items.filter(s => s.available === available);
  if (category) items = items.filter(s => s.category === category);
  if (deviceType) items = items.filter(s => s.deviceType === deviceType);
  if (partType) items = items.filter(s => s.partType === partType);
  if (brand) items = items.filter(s => s.brand === brand || s.brand === null);

  if (search) {
    const terms = expandQuery(search);
    items = items.filter(s => {
      const text = `${s.name} ${s.description ?? ''} ${s.brand ?? ''}`.toLowerCase();
      return terms.some(term => text.includes(term));
    });
  }

  return items;
}

export function getService(id) {
  const items = readJson(SERVICES_FILE, DEFAULT_SERVICES).map(migrateService);
  return items.find(s => s.id === id) ?? null;
}

export function createService(data) {
  const items = readJson(SERVICES_FILE, DEFAULT_SERVICES);
  const now = new Date().toISOString();
  const svc = {
    id: `svc_${randomUUID().slice(0, 8)}`,
    name: data.name || '',
    description: data.description || '',
    category: data.category || 'replace',
    deviceType: data.deviceType || 'smartphone',
    partType: data.partType || 'display',
    brand: data.brand || null,
    price: data.price ?? null,
    priceFrom: data.priceFrom ?? null,
    priceTo: data.priceTo ?? null,
    laborCost: data.laborCost ?? DEFAULT_LABOR[data.partType] ?? 500,
    partCost: data.partCost ?? null,
    purchasePrice: data.purchasePrice ?? null,
    duration: data.duration || '1–2 часа',
    hasExpress: data.hasExpress || false,
    expressMultiplier: data.expressMultiplier ?? 1.5,
    popularity: data.popularity ?? 50,
    supplierId: data.supplierId || null,
    available: data.available !== false,
    archived: false,
    lastChecked: now,
    history: [{ at: now, action: 'created' }],
    createdAt: now,
    updatedAt: now,
  };
  items.push(svc);
  writeJson(SERVICES_FILE, items);
  return svc;
}

export function updateService(id, patch) {
  const items = readJson(SERVICES_FILE, DEFAULT_SERVICES);
  const idx = items.findIndex(s => s.id === id);
  if (idx === -1) return null;
  const prev = items[idx];
  const now = new Date().toISOString();

  const tracked = ['name', 'price', 'priceFrom', 'priceTo', 'laborCost', 'partCost', 'purchasePrice', 'available', 'archived', 'category', 'deviceType', 'partType', 'supplierId', 'brand'];
  const changes = {};
  for (const f of tracked) {
    if (patch[f] !== undefined && patch[f] !== prev[f]) changes[f] = { from: prev[f], to: patch[f] };
  }

  // Reset lastChecked when price is updated
  const priceChanged = ['price', 'priceFrom', 'priceTo', 'laborCost', 'partCost', 'purchasePrice'].some(f => patch[f] !== undefined);
  const lastChecked = priceChanged ? now : (patch.lastChecked ?? prev.lastChecked);

  const historyEntry = Object.keys(changes).length > 0 ? [{ at: now, action: 'updated', changes }] : [];
  items[idx] = {
    ...prev, ...patch, id: prev.id, createdAt: prev.createdAt,
    lastChecked,
    history: [...(prev.history || []), ...historyEntry],
    updatedAt: now,
  };
  writeJson(SERVICES_FILE, items);
  return migrateService(items[idx]);
}

export function deleteService(id) {
  const items = readJson(SERVICES_FILE, DEFAULT_SERVICES);
  const idx = items.findIndex(s => s.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  writeJson(SERVICES_FILE, items);
  return true;
}

export function bulkUpdateServices(ids, patch) {
  const items = readJson(SERVICES_FILE, DEFAULT_SERVICES);
  const now = new Date().toISOString();
  let count = 0;
  for (const s of items) {
    if (!ids.includes(s.id)) continue;
    const entry = { at: now, action: 'bulk_update', changes: patch };
    const priceChanged = ['price', 'priceFrom', 'priceTo', 'laborCost', 'partCost'].some(f => patch[f] !== undefined);
    Object.assign(s, patch, {
      updatedAt: now,
      lastChecked: priceChanged ? now : s.lastChecked,
      history: [...(s.history || []), entry],
    });
    count++;
  }
  writeJson(SERVICES_FILE, items);
  return count;
}

export function bulkAdjustPrices(ids, multiplier) {
  const items = readJson(SERVICES_FILE, DEFAULT_SERVICES);
  const now = new Date().toISOString();
  let count = 0;
  for (const s of items) {
    if (!ids.includes(s.id)) continue;
    const entry = { at: now, action: 'price_adjust', multiplier };
    if (s.price != null) s.price = Math.round(s.price * multiplier / 100) * 100;
    if (s.priceFrom != null) s.priceFrom = Math.round(s.priceFrom * multiplier / 100) * 100;
    if (s.priceTo != null) s.priceTo = Math.round(s.priceTo * multiplier / 100) * 100;
    s.updatedAt = now;
    s.lastChecked = now;
    s.history = [...(s.history || []), entry];
    count++;
  }
  writeJson(SERVICES_FILE, items);
  return count;
}

export function markServicesChecked(ids) {
  const items = readJson(SERVICES_FILE, DEFAULT_SERVICES);
  const now = new Date().toISOString();
  for (const s of items) {
    if (ids.includes(s.id)) { s.lastChecked = now; s.updatedAt = now; }
  }
  writeJson(SERVICES_FILE, items);
  return ids.length;
}

// ── Suppliers ─────────────────────────────────────────────────────────────────

function migrateSupplier(s) {
  return {
    searchTemplate: s.searchTemplate ?? '',
    lastPriceCheck: s.lastPriceCheck ?? null,
    ...s,
  };
}

export function listSuppliers() {
  return readJson(SUPPLIERS_FILE, DEFAULT_SUPPLIERS).map(migrateSupplier);
}

export function createSupplier(data) {
  const items = readJson(SUPPLIERS_FILE, DEFAULT_SUPPLIERS);
  const now = new Date().toISOString();
  const sup = {
    id: `sup_${randomUUID().slice(0, 8)}`,
    name: data.name || '',
    url: data.url || '',
    searchTemplate: data.searchTemplate || '',
    lastPriceCheck: data.lastPriceCheck || null,
    phone: data.phone || '',
    rating: data.rating ?? 3,
    note: data.note || '',
    createdAt: now,
  };
  items.push(sup);
  writeJson(SUPPLIERS_FILE, items);
  return sup;
}

export function updateSupplier(id, patch) {
  const items = readJson(SUPPLIERS_FILE, DEFAULT_SUPPLIERS);
  const idx = items.findIndex(s => s.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch, id: items[idx].id, createdAt: items[idx].createdAt };
  writeJson(SUPPLIERS_FILE, items);
  return items[idx];
}

export function deleteSupplier(id) {
  const items = readJson(SUPPLIERS_FILE, DEFAULT_SUPPLIERS);
  const idx = items.findIndex(s => s.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  writeJson(SUPPLIERS_FILE, items);
  return true;
}

// ── CSV export ────────────────────────────────────────────────────────────────

export function servicesToCsv(ids) {
  const items = readJson(SERVICES_FILE, DEFAULT_SERVICES)
    .map(migrateService)
    .filter(s => !ids || ids.includes(s.id));
  const cols = ['id', 'name', 'category', 'deviceType', 'partType', 'brand', 'price', 'priceFrom', 'priceTo', 'purchasePrice', 'laborCost', 'partCost', 'duration', 'hasExpress', 'popularity', 'available', 'archived'];
  const header = cols.join(';');
  const rows = items.map(s => cols.map(c => {
    const v = s[c];
    if (v === null || v === undefined) return '';
    if (typeof v === 'string' && v.includes(';')) return `"${v}"`;
    return String(v);
  }).join(';'));
  return [header, ...rows].join('\n');
}
