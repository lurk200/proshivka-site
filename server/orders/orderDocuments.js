/** Сроки гарантии (дней) — только при статусе «Выдан» */
export const WARRANTY_DAY_OPTIONS = [30, 60, 90, 180, 365];

/** Акт и гарантия клиенту — только после выдачи */
export function canHaveDocuments(status) {
  return status === 'completed';
}

/** Гарантию можно задать только в статусе «Выдан» */
export function canSetWarranty(status) {
  return status === 'completed';
}

export function buildCompletionAct(order, issuedAt = new Date()) {
  const at = issuedAt instanceof Date ? issuedAt : new Date(issuedAt);
  return {
    number: `АВР-${order.orderNumber}`,
    issuedAt: at.toISOString(),
  };
}

/**
 * @param {number} days
 * @param {string | Date} fromDate
 */
export function buildWarranty(days, fromDate = new Date()) {
  const d = Number(days);
  if (!Number.isFinite(d) || d <= 0) return null;
  const start = fromDate instanceof Date ? fromDate : new Date(fromDate);
  const until = new Date(start);
  until.setDate(until.getDate() + d);
  return {
    days: d,
    from: start.toISOString(),
    until: until.toISOString(),
  };
}

export function parseWarrantyDays(value) {
  if (value === '' || value == null || value === false) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export function defaultWorkPerformed(order) {
  const comment = order.publicComment?.trim();
  if (comment) return comment;
  return `Выполнен ремонт: ${order.device || 'устройство'}.`;
}
