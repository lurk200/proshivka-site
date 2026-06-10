/**
 * Notification templates + event log.
 *
 * Templates are stored in server/notifications/data/templates.json.
 * Event log in server/notifications/data/events.json.
 *
 * Actual delivery (email / telegram / whatsapp / sms) is stubbed —
 * set VITE_NOTIFY_WEBHOOK_URL to receive a POST with event payload.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

// ─── Variable docs ────────────────────────────────────────────────────────────

export const TEMPLATE_VARIABLES = [
  { key: '{{orderNumber}}', desc: 'Номер заказа' },
  { key: '{{device}}', desc: 'Устройство' },
  { key: '{{statusLabel}}', desc: 'Название статуса' },
  { key: '{{clientName}}', desc: 'Имя клиента' },
  { key: '{{cost}}', desc: 'Стоимость' },
  { key: '{{managerName}}', desc: 'Менеджер' },
  { key: '{{clientComment}}', desc: 'Сообщение менеджера' },
  { key: '{{trackUrl}}', desc: 'Ссылка на статус заказа' },
];

// ─── Default templates ────────────────────────────────────────────────────────

const DEFAULT_TEMPLATES = [
  {
    id: 'order_created',
    eventType: 'order_created',
    name: 'Заказ принят',
    description: 'При создании нового заказа',
    enabled: true,
    channels: { email: false, telegram: false, whatsapp: false, sms: false },
    subject: 'Ваш заказ {{orderNumber}} принят',
    body: 'Здравствуйте, {{clientName}}!\n\nВаш заказ {{orderNumber}} ({{device}}) принят в сервис.\nСледить за статусом: {{trackUrl}}\n\nЕсли есть вопросы — звоните нам.',
  },
  {
    id: 'status_in_progress',
    eventType: 'status_in_progress',
    name: 'В работе',
    description: 'Когда мастер приступил к ремонту',
    enabled: true,
    channels: { email: false, telegram: false, whatsapp: false, sms: false },
    subject: 'Заказ {{orderNumber}} — ремонт начат',
    body: 'Здравствуйте, {{clientName}}!\n\nВаш {{device}} (заказ {{orderNumber}}) передан мастеру.\n{{clientComment}}\nСледить: {{trackUrl}}',
  },
  {
    id: 'status_cost_approval',
    eventType: 'status_cost_approval',
    name: 'Согласование стоимости',
    description: 'Ожидается согласование цены',
    enabled: true,
    channels: { email: false, telegram: false, whatsapp: false, sms: false },
    subject: 'Заказ {{orderNumber}} — стоимость ремонта {{cost}}',
    body: 'Здравствуйте, {{clientName}}!\n\nДиагностика {{device}} завершена. Стоимость ремонта: {{cost}}.\n{{clientComment}}\nПодтвердить или уточнить детали: {{trackUrl}}',
  },
  {
    id: 'status_ready',
    eventType: 'status_ready',
    name: 'Готово к выдаче',
    description: 'Устройство готово, можно забирать',
    enabled: true,
    channels: { email: false, telegram: false, whatsapp: false, sms: false },
    subject: 'Заказ {{orderNumber}} — готово!',
    body: 'Здравствуйте, {{clientName}}!\n\nВаш {{device}} (заказ {{orderNumber}}) отремонтирован и готов к выдаче.\n{{clientComment}}\nПодробности: {{trackUrl}}',
  },
  {
    id: 'order_completed',
    eventType: 'order_completed',
    name: 'Заказ завершён',
    description: 'Устройство выдано клиенту',
    enabled: false,
    channels: { email: false, telegram: false, whatsapp: false, sms: false },
    subject: 'Заказ {{orderNumber}} завершён, спасибо!',
    body: 'Здравствуйте, {{clientName}}!\n\nСпасибо за обращение в наш сервис. Ваш {{device}} выдан.\nДокументы доступны по ссылке: {{trackUrl}}',
  },
];

// ─── File helpers ─────────────────────────────────────────────────────────────

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readTemplates() {
  ensureDataDir();
  try {
    if (fs.existsSync(TEMPLATES_FILE)) {
      return JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf8'));
    }
  } catch { /* empty */ }
  return DEFAULT_TEMPLATES;
}

function writeTemplates(templates) {
  ensureDataDir();
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf8');
}

function readEvents() {
  ensureDataDir();
  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
      return Array.isArray(raw) ? raw : [];
    }
  } catch { /* empty */ }
  return [];
}

function writeEvents(events) {
  ensureDataDir();
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
}

// ─── Template CRUD ────────────────────────────────────────────────────────────

export function listTemplates() {
  const stored = readTemplates();
  // Merge with defaults so new templates added in code appear
  const byId = Object.fromEntries(stored.map(t => [t.id, t]));
  return DEFAULT_TEMPLATES.map(def => byId[def.id] ?? def);
}

export function updateTemplate(id, patch) {
  const templates = listTemplates();
  const idx = templates.findIndex(t => t.id === id);
  if (idx < 0) throw new Error('TEMPLATE_NOT_FOUND');
  const allowed = ['enabled', 'channels', 'subject', 'body', 'name'];
  const updated = { ...templates[idx] };
  for (const key of allowed) {
    if (patch[key] !== undefined) updated[key] = patch[key];
  }
  templates[idx] = updated;
  writeTemplates(templates);
  return updated;
}

// ─── Variable interpolation ───────────────────────────────────────────────────

function formatCost(value) {
  if (!value && value !== 0) return 'уточняется';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB', maximumFractionDigits: 0,
  }).format(Number(value));
}

function interpolate(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

function buildVars(order, siteUrl = '') {
  const trackUrl = siteUrl
    ? `${siteUrl}/status-zakaza?number=${encodeURIComponent(order.orderNumber)}`
    : `/status-zakaza?number=${encodeURIComponent(order.orderNumber)}`;
  return {
    orderNumber: order.orderNumber ?? '',
    device: order.device ?? '',
    statusLabel: order.statusLabel ?? order.status ?? '',
    clientName: order.clientName || 'клиент',
    cost: formatCost(order.cost),
    managerName: order.managerName ?? '',
    clientComment: order.clientComment?.trim() || '',
    trackUrl,
  };
}

// ─── Event log ────────────────────────────────────────────────────────────────

function appendEvent(event) {
  const events = readEvents();
  events.unshift(event); // newest first
  if (events.length > 500) events.splice(500); // keep last 500
  writeEvents(events);
}

export function listEvents(limit = 100) {
  return readEvents().slice(0, limit);
}

export function listOrderEvents(orderId) {
  return readEvents().filter(e => e.orderId === orderId);
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

/**
 * Called from ordersApi on relevant status changes.
 * @param {object} order - full order object
 * @param {string} eventType - one of DEFAULT_TEMPLATES[].eventType
 * @param {string} [siteUrl]
 */
export async function triggerNotification(order, eventType, siteUrl = '') {
  const templates = listTemplates();
  const template = templates.find(t => t.id === eventType && t.enabled);
  if (!template) return null;

  const vars = buildVars(order, siteUrl);
  const subject = interpolate(template.subject, vars);
  const body = interpolate(template.body, vars);

  const event = {
    id: randomUUID(),
    orderId: order.id,
    orderNumber: order.orderNumber,
    eventType,
    templateId: template.id,
    subject,
    body,
    channels: template.channels,
    clientName: order.clientName ?? '',
    clientPhone: order.clientPhone ?? '',
    status: 'pending',
    sentAt: null,
    createdAt: new Date().toISOString(),
    error: null,
  };

  // Webhook delivery stub
  const webhookUrl = process.env.VITE_NOTIFY_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, order: { id: order.id, orderNumber: order.orderNumber, device: order.device, status: order.status } }),
      });
      event.status = res.ok ? 'sent' : 'error';
      event.sentAt = new Date().toISOString();
      if (!res.ok) event.error = `HTTP ${res.status}`;
    } catch (err) {
      event.status = 'error';
      event.error = err.message;
    }
  } else {
    // No webhook configured — mark as queued (visible in log)
    event.status = 'queued';
  }

  appendEvent(event);
  return event;
}
