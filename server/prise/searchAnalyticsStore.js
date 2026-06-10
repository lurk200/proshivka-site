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
  return { queries: [] };
}

function write(data) {
  ensureDir();
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Normalize query: lowercase, trim, collapse spaces
function normalize(q) {
  return String(q || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

export function logSearch(query) {
  const q = normalize(query);
  if (!q || q.length < 2 || q.length > 120) return;
  const data = read();
  const now = new Date().toISOString();
  const existing = data.queries.find(e => e.q === q);
  if (existing) {
    existing.count += 1;
    existing.lastAt = now;
  } else {
    data.queries.push({ q, count: 1, firstAt: now, lastAt: now });
  }
  // Keep top 500 entries by count to avoid unbounded growth
  data.queries.sort((a, b) => b.count - a.count);
  if (data.queries.length > 500) data.queries.length = 500;
  write(data);
}

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

  let countTotal = 0, countToday = 0, countWeek = 0;
  for (const e of data.queries) {
    countTotal += e.count;
    // Use lastAt as a rough proxy (not per-occurrence)
    if (e.lastAt) {
      const t = new Date(e.lastAt).getTime();
      if (t >= todayStart.getTime()) countToday++;
      if (t >= weekAgo) countWeek += e.count;
    }
  }
  return { totalUnique: data.queries.length, countTotal, countToday, countWeek };
}

// Returns top popular queries that don't match any existing service name/description
export function getGaps(services, limit = 10) {
  const data = read();
  if (!data.queries.length) return [];

  return data.queries
    .filter(entry => {
      const q = entry.q;
      return !services.some(svc =>
        svc.name.toLowerCase().includes(q) ||
        (svc.description || '').toLowerCase().includes(q),
      );
    })
    .slice(0, limit);
}
