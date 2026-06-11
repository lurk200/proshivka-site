import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { getStatusMeta } from '../../src/data/orderStatuses.js';
import {
  buildCompletionAct,
  buildWarranty,
  canHaveDocuments,
  canSetWarranty,
  defaultWorkPerformed,
  parseWarrantyDays,
} from './orderDocuments.js';
import { defaultPrintFields, mergePrintFields, pickPrintFields } from './orderPrintFields.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const ORDERS_EXAMPLE = path.join(__dirname, 'data', 'orders.example.json');

function ensureOrdersFile() {
  if (!fs.existsSync(ORDERS_FILE) && fs.existsSync(ORDERS_EXAMPLE)) {
    fs.mkdirSync(path.dirname(ORDERS_FILE), { recursive: true });
    fs.copyFileSync(ORDERS_EXAMPLE, ORDERS_FILE);
  }
}

function readStore() {
  ensureOrdersFile();
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
      return { orders: Array.isArray(raw.orders) ? raw.orders : [] };
    }
  } catch { /* empty */ }
  return { orders: [] };
}

function writeStore(store) {
  fs.mkdirSync(path.dirname(ORDERS_FILE), { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export function normalizeOrderNumber(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-ZА-Я0-9-]/gi, '');
}

export function generateOrderNumber(existing = []) {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const prefix = `${yy}${mm}${dd}`;

  const todayNums = existing
    .map((o) => normalizeOrderNumber(o.orderNumber))
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number.parseInt(n.slice(prefix.length + 1), 10))
    .filter((n) => Number.isFinite(n));

  const next = (todayNums.length ? Math.max(...todayNums) : 0) + 1;
  return `${prefix}-${String(next).padStart(2, '0')}`;
}

// ─── History helpers ─────────────────────────────────────────────────────────

function appendHistory(order, status, note, { public: isPublic = true, type = 'status', label } = {}) {
  const entry = {
    type,
    status,
    label: label || getStatusMeta(status).label,
    at: new Date().toISOString(),
    note: note?.trim() || '',
    public: isPublic !== false,
  };
  return [...(order.history ?? []), entry];
}

function appendFieldChange(order, field, from, to, label) {
  const entry = {
    type: 'field_change',
    field,
    from: String(from ?? ''),
    to: String(to ?? ''),
    label,
    at: new Date().toISOString(),
    note: '',
    public: false,
  };
  return [...(order.history ?? []), entry];
}

// ─── Financial helpers ───────────────────────────────────────────────────────

/** Автоматически считает итог из составных полей. Если cost задан явно — он приоритетнее. */
export function computeOrderTotal(order) {
  const diag = Number(order.diagCost) || 0;
  const repair = Number(order.repairCost) || 0;
  const parts = Number(order.partsCost) || 0;
  const discount = Number(order.discount) || 0;
  const total = diag + repair + parts - discount;
  return total > 0 ? total : null;
}

// ─── Read / write ────────────────────────────────────────────────────────────

export function listOrders() {
  return readStore().orders.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function findOrderByNumber(orderNumber) {
  const key = normalizeOrderNumber(orderNumber);
  if (!key) return null;
  return (
    readStore().orders.find((o) => normalizeOrderNumber(o.orderNumber) === key) ?? null
  );
}

export function findOrderById(id) {
  return readStore().orders.find((o) => o.id === id) ?? null;
}

// ─── Public transform ────────────────────────────────────────────────────────

export function toPublicOrder(order) {
  if (!order) return null;
  const meta = getStatusMeta(order.status);

  const timeline = (order.history ?? [])
    .filter((h) => h.public !== false)
    .map((h) => ({
      type: h.type || 'status',
      status: h.status,
      label: h.label || getStatusMeta(h.status ?? order.status).label,
      at: h.at,
      note: h.note || '',
    }));

  // Map history to per-status timestamps for progress bar
  const statusTimestamps = {};
  for (const h of order.history ?? []) {
    if ((h.type === 'status' || !h.type) && h.status && !statusTimestamps[h.status]) {
      statusTimestamps[h.status] = h.at;
    }
  }

  const base = {
    orderNumber: order.orderNumber,
    device: order.device,
    status: order.status,
    statusLabel: meta.label,
    statusDescription: meta.description,
    statusTone: meta.tone,
    cost: order.cost ?? computeOrderTotal(order),
    costConfirmed: order.costConfirmed === true,
    publicComment: order.publicComment?.trim() || '',
    clientComment: order.clientComment?.trim() || '',
    updatedAt: order.updatedAt,
    createdAt: order.createdAt,
    timeline,
    statusTimestamps,
  };

  const documents = {
    receipt: {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      clientName: order.clientName?.trim() || '',
      device: order.device,
      cost: order.cost ?? computeOrderTotal(order),
      publicComment: order.publicComment?.trim() || '',
      internalNote: order.internalNote?.trim() || '',
      ...pickPrintFields(order),
    },
    act: null,
    warranty: null,
  };

  if (!canHaveDocuments(order.status)) {
    return { ...base, documents };
  }

  if (order.completionAct) {
    documents.act = {
      number: order.completionAct.number,
      issuedAt: order.completionAct.issuedAt,
      clientName: order.clientName?.trim() || '',
      workPerformed: order.workPerformed?.trim() || defaultWorkPerformed(order),
      device: order.device,
      cost: order.cost ?? computeOrderTotal(order),
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      ...pickPrintFields(order),
    };
  }

  if (order.warranty?.days) {
    documents.warranty = {
      days: order.warranty.days,
      from: order.warranty.from,
      until: order.warranty.until,
    };
  }

  return { ...base, documents };
}

export function trackOrder(orderNumber) {
  const order = findOrderByNumber(orderNumber);
  if (!order) return null;
  return toPublicOrder(order);
}

// ─── Create ──────────────────────────────────────────────────────────────────

export function createOrder(payload) {
  const store = readStore();
  const now = new Date().toISOString();
  const status = payload.status || 'accepted';
  const orderNumber =
    normalizeOrderNumber(payload.orderNumber) || generateOrderNumber(store.orders);

  if (findOrderByNumber(orderNumber)) {
    throw new Error('ORDER_NUMBER_EXISTS');
  }

  const order = {
    id: randomUUID(),
    orderNumber,
    device: String(payload.device || '').trim() || 'Устройство',
    status,
    cost: payload.cost != null && payload.cost !== '' ? Number(payload.cost) : null,
    costConfirmed: !!payload.costConfirmed,
    // Financial breakdown
    diagCost: payload.diagCost != null ? Number(payload.diagCost) || 0 : 0,
    repairCost: payload.repairCost != null ? Number(payload.repairCost) || 0 : 0,
    partsCost: payload.partsCost != null ? Number(payload.partsCost) || 0 : 0,
    discount: payload.discount != null ? Number(payload.discount) || 0 : 0,
    // Comments
    publicComment: String(payload.publicComment || '').trim(),
    clientComment: String(payload.clientComment || '').trim(),
    internalNote: String(payload.internalNote || '').trim(),
    createdAt: now,
    updatedAt: now,
    clientName: String(payload.clientName || '').trim(),
    serialNumber: String(payload.serialNumber || '').trim(),
    masterName: String(payload.masterName || '').trim(),
    workPerformed: String(payload.workPerformed || '').trim(),
    readyAt: null,
    issuedAt: null,
    completionAct: null,
    warranty: null,
    ...defaultPrintFields(),
    history: [
      {
        type: 'created',
        status,
        label: getStatusMeta(status).label,
        at: now,
        note: payload.historyNote?.trim() || 'Заказ создан',
        public: true,
      },
    ],
  };

  if (status === 'ready') order.readyAt = now;

  if (status === 'completed') {
    order.issuedAt = now;
    order.workPerformed = order.workPerformed || defaultWorkPerformed(order);
    order.completionAct = buildCompletionAct(order, new Date(now));
    const days = parseWarrantyDays(payload.warrantyDays);
    if (days) order.warranty = buildWarranty(days, new Date(now));
  }

  mergePrintFields(order, payload);
  store.orders.push(order);
  writeStore(store);
  return order;
}

// ─── Update ──────────────────────────────────────────────────────────────────

export function updateOrder(id, patch) {
  const store = readStore();
  const idx = store.orders.findIndex((o) => o.id === id);
  if (idx < 0) throw new Error('NOT_FOUND');

  const prev = store.orders[idx];
  const now = new Date().toISOString();
  let history = prev.history ?? [];

  // ── Status change ──
  if (patch.status && patch.status !== prev.status) {
    history = appendHistory(
      { history },
      patch.status,
      patch.statusNote || getStatusMeta(patch.status).label,
      { public: patch.statusNotePublic !== false, type: 'status' },
    );
  } else if (patch.historyNote?.trim()) {
    history = appendHistory(
      { history },
      prev.status,
      patch.historyNote,
      { public: patch.historyNotePublic !== false, type: 'note', label: patch.historyNote },
    );
  }

  // ── Field change logging (internal, not shown to client) ──
  const trackFields = [
    { key: 'cost', label: 'Стоимость изменена', fmt: v => v != null ? `${Number(v).toLocaleString('ru')} ₽` : '—' },
    { key: 'diagCost', label: 'Диагностика', fmt: v => v != null ? `${Number(v).toLocaleString('ru')} ₽` : '—' },
    { key: 'repairCost', label: 'Ремонт', fmt: v => v != null ? `${Number(v).toLocaleString('ru')} ₽` : '—' },
    { key: 'partsCost', label: 'Запчасти', fmt: v => v != null ? `${Number(v).toLocaleString('ru')} ₽` : '—' },
    { key: 'discount', label: 'Скидка', fmt: v => v != null ? `${Number(v).toLocaleString('ru')} ₽` : '—' },
    { key: 'clientName', label: 'Клиент', fmt: v => v || '—' },
    { key: 'clientPhone', label: 'Телефон', fmt: v => v || '—' },
    { key: 'managerName', label: 'Менеджер', fmt: v => v || '—' },
  ];

  for (const { key, label, fmt } of trackFields) {
    if (patch[key] === undefined) continue;
    const prevVal = prev[key];
    const nextVal = patch[key];
    const prevStr = fmt(prevVal);
    const nextStr = fmt(nextVal);
    if (prevStr !== nextStr) {
      history = appendFieldChange({ history }, key, prevStr, nextStr, label);
    }
  }

  // ── Cost confirmed event ──
  if (patch.costConfirmed !== undefined && !!patch.costConfirmed !== !!prev.costConfirmed) {
    if (patch.costConfirmed) {
      history = appendHistory(
        { history },
        patch.status ?? prev.status,
        'Стоимость согласована клиентом',
        { public: true, type: 'note', label: 'Стоимость согласована' },
      );
    }
  }

  const nextStatus = patch.status ?? prev.status;
  const becameReady = nextStatus === 'ready' && prev.status !== 'ready';
  const becameCompleted = nextStatus === 'completed' && prev.status !== 'completed';
  const leftCompleted = prev.status === 'completed' && nextStatus !== 'completed';

  let readyAt = prev.readyAt ?? null;
  let issuedAt = prev.issuedAt ?? null;
  let completionAct = prev.completionAct ?? null;
  let warranty = prev.warranty ?? null;
  let workPerformed =
    patch.workPerformed !== undefined
      ? String(patch.workPerformed).trim()
      : prev.workPerformed?.trim() || '';
  const clientName =
    patch.clientName !== undefined ? String(patch.clientName).trim() : prev.clientName?.trim() || '';

  if (becameReady) readyAt = now;

  if (becameCompleted) {
    issuedAt = now;
    if (!completionAct) completionAct = buildCompletionAct(prev, new Date(now));
    if (!workPerformed) {
      workPerformed = defaultWorkPerformed({ ...prev, publicComment: patch.publicComment ?? prev.publicComment });
    }
  }

  if (leftCompleted) {
    completionAct = null;
    warranty = null;
    issuedAt = null;
  }

  if (patch.warrantyDays !== undefined && canSetWarranty(nextStatus)) {
    const days = parseWarrantyDays(patch.warrantyDays);
    if (days) {
      const warrantyStart = issuedAt || prev.issuedAt || now;
      warranty = buildWarranty(days, new Date(warrantyStart));
    } else {
      warranty = null;
    }
  } else if (!canSetWarranty(nextStatus)) {
    warranty = null;
  }

  if (canHaveDocuments(nextStatus) && !workPerformed) {
    workPerformed = defaultWorkPerformed({ ...prev, publicComment: patch.publicComment ?? prev.publicComment });
  }

  // ── Build next state ──
  const next = {
    ...prev,
    device: patch.device != null ? String(patch.device).trim() : prev.device,
    status: nextStatus,
    // cost: explicit override takes priority, otherwise recompute from breakdown
    cost:
      patch.cost !== undefined
        ? (patch.cost === '' || patch.cost == null ? null : Number(patch.cost))
        : prev.cost,
    costConfirmed:
      patch.costConfirmed !== undefined ? !!patch.costConfirmed : prev.costConfirmed,
    // Financial breakdown
    diagCost: patch.diagCost !== undefined ? (Number(patch.diagCost) || 0) : (prev.diagCost ?? 0),
    repairCost: patch.repairCost !== undefined ? (Number(patch.repairCost) || 0) : (prev.repairCost ?? 0),
    partsCost: patch.partsCost !== undefined ? (Number(patch.partsCost) || 0) : (prev.partsCost ?? 0),
    discount: patch.discount !== undefined ? (Number(patch.discount) || 0) : (prev.discount ?? 0),
    // Comments
    publicComment:
      patch.publicComment !== undefined ? String(patch.publicComment).trim() : prev.publicComment,
    clientComment:
      patch.clientComment !== undefined ? String(patch.clientComment).trim() : (prev.clientComment ?? ''),
    internalNote:
      patch.internalNote !== undefined ? String(patch.internalNote).trim() : prev.internalNote,
    clientName,
    serialNumber: patch.serialNumber !== undefined ? String(patch.serialNumber).trim() : (prev.serialNumber ?? ''),
    masterName: patch.masterName !== undefined ? String(patch.masterName).trim() : (prev.masterName ?? ''),
    workPerformed: canHaveDocuments(nextStatus) ? workPerformed : leftCompleted ? '' : prev.workPerformed,
    readyAt: becameReady ? readyAt : nextStatus === 'ready' ? prev.readyAt ?? readyAt : prev.readyAt,
    issuedAt: becameCompleted ? issuedAt : canHaveDocuments(nextStatus) ? prev.issuedAt ?? issuedAt : null,
    completionAct: canHaveDocuments(nextStatus) ? completionAct : null,
    warranty: canHaveDocuments(nextStatus) ? warranty : null,
    updatedAt: now,
    history,
  };

  mergePrintFields(next, patch);
  store.orders[idx] = next;
  writeStore(store);
  return next;
}

export function deleteOrder(id) {
  const store = readStore();
  const next = store.orders.filter((o) => o.id !== id);
  if (next.length === store.orders.length) throw new Error('NOT_FOUND');
  writeStore({ orders: next });
  return true;
}
