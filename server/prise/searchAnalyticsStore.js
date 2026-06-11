import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const ANALYTICS_FILE = path.join(DATA_DIR, 'search-analytics.json');

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read() {
  ensureDir();
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf8'));
    }
  } catch {}
  return { queries: [], sessionLastQuery: {} };
}

function write(data) {
  ensureDir();
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function normalize(q) {
  return String(q || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// ── Device model detection ────────────────────────────────────────────────────

export function detectDeviceModel(query) {
  const q = query.toLowerCase();

  const iphoneM = q.match(/iphone\s*(\d{1,2})\s*(pro\s*max|pro\s*plus|pro|plus|mini|max)?/i);
  if (iphoneM) {
    const v = (iphoneM[2] || '').trim().replace(/\s+/g, ' ');
    return `iPhone ${iphoneM[1]}${v ? ' ' + v.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : ''}`;
  }

  const samsungM = q.match(/samsung\s*(?:galaxy\s*)?(s|a|note|m|f)\s*(\d{1,2})\s*(ultra|plus|fe|lite)?/i);
  if (samsungM) {
    const s = samsungM[1].toUpperCase();
    const n = samsungM[2];
    const v = samsungM[3] ? ' ' + samsungM[3][0].toUpperCase() + samsungM[3].slice(1) : '';
    return `Samsung ${s}${n}${v}`;
  }
  if (q.includes('samsung')) return 'Samsung';

  const redmiM = q.match(/redmi\s*(note\s*)?(\d{1,2})\s*(pro|ultra|plus|s)?/i);
  if (redmiM) {
    const v = redmiM[3] ? ' ' + redmiM[3][0].toUpperCase() + redmiM[3].slice(1) : '';
    return `Redmi${redmiM[1] ? ' Note' : ''} ${redmiM[2]}${v}`;
  }
  const pocoM = q.match(/poco\s*([a-z]\d?\s*(?:pro|plus)?)/i);
  if (pocoM) return `POCO ${pocoM[1].trim().toUpperCase()}`;
  if (q.includes('xiaomi') || q.includes('redmi') || q.includes('poco')) return 'Xiaomi / Redmi';

  if (q.includes('huawei') || q.includes('honor')) return 'Huawei / Honor';

  const ipadM = q.match(/ipad\s*(pro|mini|air)?(\s*\d+)?/i);
  if (ipadM) return `iPad${ipadM[1] ? ' ' + ipadM[1][0].toUpperCase() + ipadM[1].slice(1) : ''}`;

  if (q.includes('macbook')) return 'MacBook';
  if (q.includes('ipad')) return 'iPad';
  if (q.includes('apple') || q.includes('айфон')) return 'iPhone / Apple';

  const oppoM = q.match(/oppo\s*([a-z]\d+)/i);
  if (oppoM) return `OPPO ${oppoM[1].toUpperCase()}`;
  if (q.includes('oppo') || q.includes('realme')) return 'OPPO / Realme';

  if (q.includes('nokia')) return 'Nokia';
  if (q.includes('motorola') || q.includes('moto')) return 'Motorola';

  return null;
}

// ── Fault category detection ──────────────────────────────────────────────────

const FAULT_MAP = [
  { name: 'Дисплей',          kw: ['дисплей', 'экран', 'стекло', 'тачскрин', 'lcd', 'oled', 'матрица', 'display', 'разбитый экран', 'разбитое стекло'] },
  { name: 'Аккумулятор',      kw: ['аккумулятор', 'батарея', 'заряд', 'battery', 'ёмкость', 'емкость', 'не держит'] },
  { name: 'Корпус / крышка',  kw: ['корпус', 'крышка', 'рамка', 'задняя крышка', 'боковая рамка', 'cover', 'back glass'] },
  { name: 'Разъём зарядки',   kw: ['разъём', 'разъем', 'зарядка', 'порт зарядки', 'lightning', 'usb-c', 'type-c', 'charging port', 'не заряжается'] },
  { name: 'Камера',           kw: ['камера', 'фотоапп', 'вспышка', 'объектив', 'camera', 'фото', 'rear camera', 'front camera'] },
  { name: 'Динамик',          kw: ['динамик', 'колонка', 'слуховой динамик', 'звук', 'speaker', 'нет звука'] },
  { name: 'Микрофон',         kw: ['микрофон', 'mic', 'не слышно', 'нет звука при звонке'] },
  { name: 'Face ID / Touch ID', kw: ['face id', 'face-id', 'touch id', 'touch-id', 'биометрия', 'отпечаток', 'сканер'] },
  { name: 'Кнопки',           kw: ['кнопка', 'кнопки', 'volume', 'power button', 'включение', 'блокировка', 'home кнопка'] },
  { name: 'Шлейфы',           kw: ['шлейф', 'шлейфы', 'flex', 'ribbon'] },
  { name: 'Датчики',          kw: ['датчик', 'sensor', 'proximity', 'гироскоп', 'акселерометр', 'освещение'] },
  { name: 'Вибромотор',       kw: ['вибро', 'vibro', 'вибратор', 'taptic', 'нет вибрации'] },
];

export function detectFaultCategory(query) {
  const q = query.toLowerCase();
  for (const { name, kw } of FAULT_MAP) {
    if (kw.some(k => q.includes(k))) return name;
  }
  return 'Прочее';
}

// ── Write operations ──────────────────────────────────────────────────────────

export function logSearch(query, sessionId = null) {
  const q = normalize(query);
  if (!q || q.length < 2 || q.length > 120) return;
  const data = read();
  if (!data.sessionLastQuery) data.sessionLastQuery = {};

  const now = new Date().toISOString();
  const existing = data.queries.find(e => e.q === q);
  if (existing) {
    existing.count += 1;
    existing.lastAt = now;
  } else {
    data.queries.push({ q, count: 1, conversions: 0, firstAt: now, lastAt: now });
  }

  // Link session to last query for conversion tracking
  if (sessionId) {
    data.sessionLastQuery[sessionId] = q;
    // Prune old mappings (keep last 2000)
    const keys = Object.keys(data.sessionLastQuery);
    if (keys.length > 2000) {
      keys.slice(0, keys.length - 2000).forEach(k => delete data.sessionLastQuery[k]);
    }
  }

  data.queries.sort((a, b) => b.count - a.count);
  if (data.queries.length > 500) data.queries.length = 500;
  write(data);
}

export function logConversion(sessionId) {
  if (!sessionId) return;
  const data = read();
  const lastQuery = data.sessionLastQuery?.[sessionId];
  if (!lastQuery) return;
  const entry = data.queries.find(e => e.q === lastQuery);
  if (entry) {
    entry.conversions = (entry.conversions || 0) + 1;
    write(data);
  }
}

// ── Read operations ───────────────────────────────────────────────────────────

export function getPopular(limit = 10) {
  const data = read();
  return data.queries.slice(0, limit);
}

export function getStats() {
  const data = read();
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  let countTotal = 0, countToday = 0, countWeek = 0, totalConversions = 0;
  for (const e of data.queries) {
    countTotal += e.count;
    totalConversions += e.conversions || 0;
    if (e.lastAt) {
      const t = new Date(e.lastAt).getTime();
      if (t >= todayStart.getTime()) countToday++;
      if (t >= weekAgo) countWeek += e.count;
    }
  }
  const avgConvRate = countTotal > 0 ? Math.round(totalConversions / countTotal * 100) : 0;
  return {
    totalUnique: data.queries.length,
    countTotal,
    countToday,
    countWeek,
    totalConversions,
    avgConvRate,
  };
}

export function getSearchDemand(limit = 50) {
  const data = read();
  return data.queries.slice(0, limit).map(entry => ({
    q: entry.q,
    count: entry.count,
    conversions: entry.conversions || 0,
    conversionRate: entry.count > 0 ? Math.round((entry.conversions || 0) / entry.count * 100) : 0,
    firstAt: entry.firstAt,
    lastAt: entry.lastAt,
    model: detectDeviceModel(entry.q),
    category: detectFaultCategory(entry.q),
  }));
}

// ── Part type detection (maps query to partType ID) ──────────────────────────

const PART_TYPE_PATTERNS = [
  // Multi-word / specific patterns first
  { pt: 'camera-glass', re: /стекло\s*камер|линза\s*камер|glass.*cam|cam.*glass/ },
  { pt: 'face-id',      re: /face.?id|сканер\s*лица|биометрия\s*iphone/ },
  { pt: 'back-glass',   re: /задняя\s*крышка|задняя\s*панель|back.?glass|стекло\s*корпус|крышка\s*корпус/ },
  { pt: 'ear-speaker',  re: /слуховой\s*динамик|разговорный\s*динамик|гарнитурн/ },
  { pt: 'water',        re: /после\s*воды|залит|вода\s*попал|восстановление.*вод|water.?damage/ },
  { pt: 'port',         re: /разъём\s*зарядк|гнездо\s*зарядк|порт\s*зарядк|charging.?port|не\s*заряж/ },
  // Single keywords
  { pt: 'display',      re: /дисплей|экран|матрица|тачскрин|lcd|oled/ },
  { pt: 'glass',        re: /стекло|glass/ },
  { pt: 'battery',      re: /аккумулят|батаре|акб\b|battery|не\s*держит\s*заряд/ },
  { pt: 'port',         re: /разъём|разъем|lightning|usb.?c|type.?c|гнездо|не\s*заряж/ },
  { pt: 'housing',      re: /корпус|рамка|frame|housing/ },
  { pt: 'back-glass',   re: /крышк/ },
  { pt: 'camera',       re: /камер|camera|объектив|вспышк/ },
  { pt: 'microphone',   re: /микрофон|\bmic\b/ },
  { pt: 'speaker',      re: /динамик|колонк|speaker|полифон/ },
  { pt: 'vibration',    re: /вибро|vibro|taptic|нет\s*вибр/ },
  { pt: 'button',       re: /кнопк|button|volume|home\b|включени|блокировк/ },
  { pt: 'flex',         re: /шлейф|\bflex\b/ },
  { pt: 'keyboard',     re: /клавиатур|keyboard/ },
  { pt: 'diagnostic',   re: /диагностик|не\s*включает|не\s*работает|перегрев/ },
];

export function detectPartType(query) {
  const q = query.toLowerCase().trim();
  for (const { pt, re } of PART_TYPE_PATTERNS) {
    if (re.test(q)) return pt;
  }
  return 'other';
}

// ── Suggested service name builder ────────────────────────────────────────────

const PART_TYPE_FOR_NAME = {
  display:       'дисплея',
  glass:         'стекла дисплея',
  battery:       'аккумулятора',
  port:          'разъёма зарядки',
  'back-glass':  'задней крышки',
  housing:       'корпуса',
  camera:        'камеры',
  'camera-glass':'стекла камеры',
  speaker:       'динамика',
  'ear-speaker': 'слухового динамика',
  microphone:    'микрофона',
  'face-id':     'Face ID',
  button:        'кнопок',
  flex:          'шлейфа',
  vibration:     'вибромотора',
  keyboard:      'клавиатуры',
  water:         'после воды',
  diagnostic:    null,
  other:         null,
};
const PART_TYPE_VERB = { 'face-id': 'Восстановление', water: 'Восстановление', diagnostic: 'Диагностика' };

export function getSuggestedServiceName(partType, deviceModel) {
  const verb = PART_TYPE_VERB[partType] ?? 'Замена';
  const partName = PART_TYPE_FOR_NAME[partType];
  if (partType === 'diagnostic') {
    return deviceModel ? `Диагностика ${deviceModel}` : 'Диагностика';
  }
  return [verb, partName, deviceModel].filter(Boolean).join(' ');
}

// ── Brand from detected device name ──────────────────────────────────────────

function brandFromDevice(device) {
  if (!device) return null;
  const d = device.toLowerCase();
  if (/iphone|ipad|macbook|apple/.test(d)) return 'Apple';
  if (/samsung|galaxy/.test(d)) return 'Samsung';
  if (/xiaomi|redmi|poco/.test(d)) return 'Xiaomi';
  if (/huawei/.test(d)) return 'Huawei';
  if (/honor/.test(d)) return 'Honor';
  if (/oppo/.test(d)) return 'OPPO';
  if (/realme/.test(d)) return 'Realme';
  if (/motorola|moto/.test(d)) return 'Motorola';
  if (/nokia/.test(d)) return 'Nokia';
  return null;
}

// ── Device coverage: devices with high demand but few services ────────────────

export function getDeviceCoverage(services, limit = 20) {
  const data = read();
  if (!data.queries.length) return [];

  // Aggregate query counts by detected device model
  const byDevice = {};
  for (const entry of data.queries) {
    const device = detectDeviceModel(entry.q);
    if (!device) continue;
    if (!byDevice[device]) byDevice[device] = { queryCount: 0, partTypes: {} };
    byDevice[device].queryCount += entry.count;
    const pt = detectPartType(entry.q);
    byDevice[device].partTypes[pt] = (byDevice[device].partTypes[pt] ?? 0) + entry.count;
  }

  return Object.entries(byDevice)
    .filter(([, { queryCount }]) => queryCount >= 3)
    .map(([device, { queryCount, partTypes }]) => {
      const brand = brandFromDevice(device);
      // Count branded services for this device
      const brandedServices = brand
        ? services.filter(s => s.brand && s.brand.toLowerCase() === brand.toLowerCase())
        : [];
      const existingPartTypes = new Set(brandedServices.map(s => s.partType));

      // Part types that are being searched but have no branded service
      const missing = Object.entries(partTypes)
        .filter(([pt]) => pt !== 'other' && !existingPartTypes.has(pt))
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([pt]) => pt);

      return { device, brand, queryCount, serviceCount: brandedServices.length, missing };
    })
    .sort((a, b) => {
      const ratioA = a.serviceCount > 0 ? a.queryCount / a.serviceCount : a.queryCount * 10;
      const ratioB = b.serviceCount > 0 ? b.queryCount / b.serviceCount : b.queryCount * 10;
      return ratioB - ratioA;
    })
    .slice(0, limit);
}

// ── Trending: queries active in the last 7 days ───────────────────────────────

export function getTrending(limit = 20) {
  const data = read();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return data.queries
    .filter(e => e.lastAt && e.lastAt >= weekAgo && e.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(entry => ({
      q: entry.q,
      count: entry.count,
      conversions: entry.conversions || 0,
      lastAt: entry.lastAt,
      partType: detectPartType(entry.q),
      deviceModel: detectDeviceModel(entry.q),
    }));
}

// ── Gaps: queries with no matching service (enhanced) ────────────────────────

export function getGaps(services, limit = 10) {
  const data = read();
  if (!data.queries.length) return [];
  return data.queries
    .filter(entry => {
      const q = entry.q;
      return !services.some(
        svc =>
          svc.name.toLowerCase().includes(q) ||
          (svc.description || '').toLowerCase().includes(q),
      );
    })
    .slice(0, limit)
    .map(entry => {
      const partType = detectPartType(entry.q);
      const deviceModel = detectDeviceModel(entry.q);
      return {
        q: entry.q,
        count: entry.count,
        conversions: entry.conversions || 0,
        lastAt: entry.lastAt,
        partType,
        deviceModel,
        brand: brandFromDevice(deviceModel),
        suggestedName: getSuggestedServiceName(partType, deviceModel),
      };
    });
}
