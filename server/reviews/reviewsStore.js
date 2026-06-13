import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'reviews.json');

function readAll() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch {}
  return [];
}

function writeAll(reviews) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(reviews, null, 2), 'utf8');
}

/**
 * @param {{ status?: string, problematic?: boolean, highRating?: boolean }} [filters]
 */
export function listReviews({ status, problematic, highRating } = {}) {
  let reviews = readAll();
  if (status) reviews = reviews.filter(r => r.status === status);
  if (problematic === true) reviews = reviews.filter(r => r.rating <= 3);
  if (highRating === true) reviews = reviews.filter(r => r.rating >= 4);
  return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getReviewByOrderId(orderId) {
  return readAll().find(r => r.orderId === orderId) ?? null;
}

export function createReview({ orderId, orderNumber, device, clientName, clientPhone, masterName, rating, comment, issuedAt }) {
  const reviews = readAll();
  if (reviews.find(r => r.orderId === orderId)) {
    throw new Error('Отзыв для этого заказа уже существует');
  }
  const now = new Date().toISOString();
  const review = {
    id: `rev_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    orderId,
    orderNumber: orderNumber || '',
    device: device || '',
    clientName: clientName || '',
    clientPhone: clientPhone || '',
    masterName: masterName || '',
    rating: Math.max(1, Math.min(5, Number(rating))),
    comment: String(comment || '').trim(),
    status: 'new',
    issuedAt: issuedAt || now,
    createdAt: now,
    updatedAt: now,
  };
  reviews.push(review);
  writeAll(reviews);
  return review;
}

export function updateReview(id, patch) {
  const reviews = readAll();
  const idx = reviews.findIndex(r => r.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const { id: _id, createdAt, ...safePatch } = patch;
  reviews[idx] = { ...reviews[idx], ...safePatch, id, updatedAt: now };
  writeAll(reviews);
  return reviews[idx];
}

export function getReviewStats() {
  const reviews = readAll();
  const total = reviews.length;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    const n = Math.max(1, Math.min(5, r.rating));
    distribution[n] = (distribution[n] || 0) + 1;
    sum += n;
  }
  return {
    total,
    average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
    distribution,
    problematic: reviews.filter(r => r.rating <= 3).length,
    recent: reviews
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(r => ({ id: r.id, rating: r.rating, comment: r.comment, device: r.device, createdAt: r.createdAt })),
  };
}
