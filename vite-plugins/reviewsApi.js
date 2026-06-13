import {
  listReviews,
  listPublishedReviews,
  getPublicStats,
  getReviewByOrderId,
  createReview,
  updateReview,
  getReviewStats,
} from '../server/reviews/reviewsStore.js';
import { findOrderById } from '../server/orders/ordersStore.js';

function isAdminRequest(req) {
  return req.headers['x-admin-password'] === (process.env.VITE_ADMIN_PASSWORD || 'proshivka');
}

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function handleReviews(req, res, url) {
  const { pathname } = url;

  // ── Public: published reviews list ───────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/reviews/published') {
    const rating = url.searchParams.get('rating');
    const limit = url.searchParams.get('limit');
    const reviews = listPublishedReviews({ rating: rating ? Number(rating) : undefined, limit: limit ? Number(limit) : undefined });
    return json(res, 200, { reviews });
  }

  // ── Public: aggregate stats (published only) ──────────────────────────────
  if (req.method === 'GET' && pathname === '/api/reviews/stats') {
    return json(res, 200, getPublicStats());
  }

  // ── Public: check if review exists ───────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/reviews/check') {
    const orderId = url.searchParams.get('orderId');
    if (!orderId) return json(res, 400, { error: 'orderId required' });
    const review = getReviewByOrderId(orderId);
    return json(res, 200, { exists: !!review, review: review ?? null });
  }

  // ── Public: submit review ────────────────────────────────────────────────
  if (req.method === 'POST' && pathname === '/api/reviews') {
    readBody(req).then(body => {
      const { orderId, rating, comment } = body;
      if (!orderId) return json(res, 400, { error: 'orderId required' });
      if (!rating || rating < 1 || rating > 5) return json(res, 400, { error: 'rating must be 1–5' });

      const order = findOrderById(orderId);
      if (!order) return json(res, 404, { error: 'Заказ не найден' });
      if (order.status !== 'completed') return json(res, 400, { error: 'Заказ ещё не выдан' });

      // 7-day edit window from issuedAt
      if (order.issuedAt) {
        const issued = new Date(order.issuedAt);
        const diffDays = (Date.now() - issued.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) return json(res, 400, { error: 'Срок оставления отзыва истёк (7 дней)' });
      }

      const existing = getReviewByOrderId(orderId);
      if (existing) {
        // Allow updating within 7-day window
        const updated = updateReview(existing.id, {
          rating: Math.max(1, Math.min(5, Number(rating))),
          comment: String(comment || '').trim(),
        });
        return json(res, 200, { ok: true, review: updated, updated: true });
      }

      const device = order.device || '';
      const clientName = order.clientName || '';
      const clientPhone = '';
      const masterName = order.masterName || '';
      const orderNumber = order.orderNumber || '';

      try {
        const review = createReview({
          orderId,
          orderNumber,
          device,
          clientName,
          clientPhone,
          masterName,
          rating: Number(rating),
          comment: String(comment || '').trim(),
          issuedAt: order.issuedAt || new Date().toISOString(),
        });
        return json(res, 201, { ok: true, review });
      } catch (err) {
        return json(res, 409, { error: err.message });
      }
    });
    return;
  }

  // ── Admin: list reviews ──────────────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/admin/reviews') {
    if (!isAdminRequest(req)) return json(res, 401, { error: 'Unauthorized' });
    const tab = url.searchParams.get('tab') || 'all';
    const filters = {};
    if (tab === 'problematic') filters.problematic = true;
    else if (tab === 'high-rating') filters.highRating = true;
    else if (tab === 'published') filters.status = 'published';
    const reviews = listReviews(filters);
    return json(res, 200, { reviews });
  }

  // ── Admin: stats ─────────────────────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/admin/reviews/stats') {
    if (!isAdminRequest(req)) return json(res, 401, { error: 'Unauthorized' });
    return json(res, 200, getReviewStats());
  }

  // ── Admin: update review status ──────────────────────────────────────────
  const adminUpdateMatch = pathname.match(/^\/api\/admin\/reviews\/([^/]+)$/);
  if (req.method === 'PUT' && adminUpdateMatch) {
    if (!isAdminRequest(req)) return json(res, 401, { error: 'Unauthorized' });
    const id = adminUpdateMatch[1];
    readBody(req).then(body => {
      const updated = updateReview(id, body);
      if (!updated) return json(res, 404, { error: 'Отзыв не найден' });
      return json(res, 200, { ok: true, review: updated });
    });
    return;
  }

  return null;
}

export function reviewsApiPlugin() {
  const middleware = (req, res, next) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (!url.pathname.startsWith('/api/reviews') && !url.pathname.startsWith('/api/admin/reviews')) {
      return next?.() ?? undefined;
    }
    const handled = handleReviews(req, res, url);
    if (handled === null) {
      next?.();
    }
  };

  return {
    name: 'reviews-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
