import {
  createOrder,
  deleteOrder,
  findOrderById,
  listOrders,
  trackOrder,
  updateOrder,
} from '../server/orders/ordersStore.js';
import {
  listTemplates,
  listEvents,
  listOrderEvents,
  updateTemplate,
  triggerNotification,
  TEMPLATE_VARIABLES,
} from '../server/notifications/notificationStore.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function getAdminPassword() {
  return process.env.VITE_ADMIN_PASSWORD || 'proshivka';
}

function isAdminRequest(req) {
  return req.headers['x-admin-password'] === getAdminPassword();
}

// ─── Status → notification event type map ─────────────────────────────────────

const STATUS_NOTIFY_MAP = {
  accepted:      'order_created',
  in_progress:   'status_in_progress',
  waiting_parts: 'status_waiting_parts',
  ready:         'status_ready',
  completed:     'order_completed',
};

function getSiteUrl(req) {
  if (process.env.VITE_SITE_URL) return process.env.VITE_SITE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost:5173';
  return `${proto}://${host}`;
}

// ─── Analytics helpers ────────────────────────────────────────────────────────

function buildAnalytics(orders) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const active = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const completed = orders.filter(o => o.status === 'completed');
  const today = orders.filter(o => (o.createdAt || '').slice(0, 10) === todayStr);
  const thisWeek = orders.filter(o => new Date(o.createdAt) >= weekAgo);
  const thisMonth = orders.filter(o => new Date(o.createdAt) >= monthAgo);

  const effectiveCost = (o) => {
    const direct = Number(o.cost);
    if (direct > 0) return direct;
    const sum = (Number(o.diagCost) || 0) + (Number(o.repairCost) || 0) + (Number(o.partsCost) || 0) - (Number(o.discount) || 0);
    return sum > 0 ? sum : 0;
  };

  const revenueWeek = thisWeek
    .filter(o => o.status === 'completed')
    .reduce((s, o) => s + effectiveCost(o), 0);
  const revenueMonth = thisMonth
    .filter(o => o.status === 'completed')
    .reduce((s, o) => s + effectiveCost(o), 0);

  const costsCompleted = completed.filter(o => effectiveCost(o) > 0);
  const avgCheck = costsCompleted.length
    ? Math.round(costsCompleted.reduce((s, o) => s + effectiveCost(o), 0) / costsCompleted.length)
    : 0;

  // Average completion time in hours
  const withTimes = completed.filter(o => o.createdAt && o.issuedAt);
  const avgCompletionHours = withTimes.length
    ? Math.round(
        withTimes.reduce(
          (s, o) => s + (new Date(o.issuedAt) - new Date(o.createdAt)) / 3600000,
          0,
        ) / withTimes.length,
      )
    : null;

  // Status distribution
  const byStatus = {};
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
  }

  // Last 30 days — orders per day
  const dailyMap = {};
  for (const o of thisMonth) {
    const day = (o.createdAt || '').slice(0, 10);
    if (day) dailyMap[day] = (dailyMap[day] || 0) + 1;
  }
  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // Manager load
  const byManager = {};
  for (const o of active) {
    const m = o.managerName?.trim() || 'Не назначен';
    byManager[m] = (byManager[m] || 0) + 1;
  }
  const managers = Object.entries(byManager)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }));

  return {
    total: orders.length,
    active: active.length,
    completed: completed.length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    today: today.length,
    thisWeek: thisWeek.length,
    thisMonth: thisMonth.length,
    revenueWeek,
    revenueMonth,
    avgCheck,
    avgCompletionHours,
    byStatus,
    daily,
    managers,
  };
}

// ─── API handlers ─────────────────────────────────────────────────────────────

function registerOrdersApi(server) {
  server.middlewares.use(async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');

    // ── Public: track order ──
    if (url.pathname === '/api/orders/track') {
      if (req.method !== 'GET') { res.statusCode = 405; return res.end(); }
      const number = url.searchParams.get('number') ?? '';
      const order = trackOrder(number);
      if (!order) {
        return sendJson(res, 404, { error: 'Заказ не найден. Проверьте номер.', code: 'NOT_FOUND' });
      }
      return sendJson(res, 200, { order });
    }

    // ── Admin: analytics ──
    if (url.pathname === '/api/orders/analytics') {
      if (!isAdminRequest(req)) {
        return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      }
      if (req.method !== 'GET') { res.statusCode = 405; return res.end(); }
      return sendJson(res, 200, { analytics: buildAnalytics(listOrders()) });
    }

    // ── Admin: notification delivery status ──
    if (url.pathname === '/api/admin/notifications/delivery-status') {
      if (!isAdminRequest(req)) {
        return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      }
      if (req.method !== 'GET') { res.statusCode = 405; return res.end(); }
      return sendJson(res, 200, {
        webhookConfigured: Boolean(process.env.VITE_NOTIFY_WEBHOOK_URL),
      });
    }

    // ── Admin: notifications templates ──
    if (url.pathname === '/api/admin/notifications/templates') {
      if (!isAdminRequest(req)) {
        return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      }
      if (req.method === 'GET') {
        return sendJson(res, 200, { templates: listTemplates(), variables: TEMPLATE_VARIABLES });
      }
      res.statusCode = 405; return res.end();
    }

    const tplMatch = url.pathname.match(/^\/api\/admin\/notifications\/templates\/([^/]+)$/);
    if (tplMatch) {
      if (!isAdminRequest(req)) {
        return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      }
      const tplId = decodeURIComponent(tplMatch[1]);
      if (req.method === 'PUT' || req.method === 'PATCH') {
        try {
          const raw = await readBody(req);
          const patch = raw ? JSON.parse(raw) : {};
          const updated = updateTemplate(tplId, patch);
          return sendJson(res, 200, { template: updated });
        } catch (err) {
          if (err.message === 'TEMPLATE_NOT_FOUND') return sendJson(res, 404, { error: 'Шаблон не найден' });
          return sendJson(res, 400, { error: 'Неверные данные' });
        }
      }
      res.statusCode = 405; return res.end();
    }

    // ── Admin: notification events log ──
    if (url.pathname === '/api/admin/notifications/log') {
      if (!isAdminRequest(req)) {
        return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      }
      if (req.method === 'GET') {
        const limit = Number(url.searchParams.get('limit') || 100);
        return sendJson(res, 200, { events: listEvents(limit) });
      }
      res.statusCode = 405; return res.end();
    }

    const orderEventsMatch = url.pathname.match(/^\/api\/admin\/notifications\/order\/([^/]+)$/);
    if (orderEventsMatch) {
      if (!isAdminRequest(req)) {
        return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      }
      if (req.method === 'GET') {
        const orderId = decodeURIComponent(orderEventsMatch[1]);
        return sendJson(res, 200, { events: listOrderEvents(orderId) });
      }
      res.statusCode = 405; return res.end();
    }

    // ── Admin: orders list + create ──
    if (url.pathname === '/api/orders') {
      if (!isAdminRequest(req)) {
        return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      }
      try {
        if (req.method === 'GET') {
          return sendJson(res, 200, { orders: listOrders() });
        }
        if (req.method === 'POST') {
          const raw = await readBody(req);
          const parsed = raw ? JSON.parse(raw) : {};
          const order = createOrder(parsed);
          // Trigger creation notification
          triggerNotification(order, 'order_created', getSiteUrl(req)).catch(() => {});
          return sendJson(res, 201, { order });
        }
        res.statusCode = 405; return res.end();
      } catch (err) {
        if (err.message === 'ORDER_NUMBER_EXISTS') {
          return sendJson(res, 409, { error: 'Такой номер уже есть', code: 'DUPLICATE' });
        }
        return sendJson(res, 400, { error: 'Неверные данные', code: 'BAD_REQUEST' });
      }
    }

    // ── Admin: single order ──
    const itemMatch = url.pathname.match(/^\/api\/orders\/([^/]+)$/);
    if (itemMatch) {
      if (!isAdminRequest(req)) {
        return sendJson(res, 401, { error: 'Требуется авторизация', code: 'UNAUTHORIZED' });
      }
      const id = decodeURIComponent(itemMatch[1]);
      try {
        if (req.method === 'GET') {
          const order = findOrderById(id);
          if (!order) return sendJson(res, 404, { error: 'Не найден', code: 'NOT_FOUND' });
          return sendJson(res, 200, { order });
        }

        if (req.method === 'PUT' || req.method === 'PATCH') {
          const raw = await readBody(req);
          const parsed = raw ? JSON.parse(raw) : {};
          const prevOrder = findOrderById(id);
          const order = updateOrder(id, parsed);

          // Trigger notification if status changed
          const newStatus = order.status;
          const prevStatus = prevOrder?.status;
          if (newStatus !== prevStatus) {
            const eventType = STATUS_NOTIFY_MAP[newStatus];
            if (eventType) {
              triggerNotification(order, eventType, getSiteUrl(req)).catch(() => {});
            }
          }

          return sendJson(res, 200, { order });
        }

        if (req.method === 'DELETE') {
          deleteOrder(id);
          return sendJson(res, 200, { ok: true });
        }

        res.statusCode = 405; return res.end();
      } catch (err) {
        if (err.message === 'NOT_FOUND') {
          return sendJson(res, 404, { error: 'Не найден', code: 'NOT_FOUND' });
        }
        return sendJson(res, 400, { error: 'Неверные данные', code: 'BAD_REQUEST' });
      }
    }

    next();
  });
}

export function ordersApiPlugin() {
  return {
    name: 'orders-api',
    configureServer: registerOrdersApi,
    configurePreviewServer: registerOrdersApi,
  };
}
