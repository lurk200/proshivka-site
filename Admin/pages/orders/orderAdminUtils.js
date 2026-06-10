import { ORDER_STATUSES } from '../../../src/data/orderStatuses';

// ─── Status visual config ────────────────────────────────────────────────────

export const STATUS_CONFIG = {
  accepted: {
    label: 'Принято',
    dot: 'bg-blue-400',
    badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  },
  diagnostics: {
    label: 'Диагностика',
    dot: 'bg-violet-400',
    badge: 'bg-violet-500/15 text-violet-300 border border-violet-500/25',
  },
  waiting_parts: {
    label: 'Ожид. запчасти',
    dot: 'bg-orange-400',
    badge: 'bg-orange-500/15 text-orange-300 border border-orange-500/25',
  },
  in_progress: {
    label: 'В работе',
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/15 text-amber-200 border border-amber-500/25',
  },
  ready: {
    label: 'Готово',
    dot: 'bg-[#84CC16]',
    badge: 'bg-[#84CC16]/15 text-[#84CC16] border border-[#84CC16]/25',
  },
  completed: {
    label: 'Выдан',
    dot: 'bg-[#6b7280]',
    badge: 'bg-white/[0.06] text-[#9ca3af] border border-white/[0.08]',
  },
  cancelled: {
    label: 'Отменён',
    dot: 'bg-red-400',
    badge: 'bg-red-500/15 text-red-300 border border-red-500/25',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getStatusLabel(statusId) {
  return STATUS_CONFIG[statusId]?.label ?? ORDER_STATUSES.find(s => s.id === statusId)?.label ?? statusId;
}

/** Просрочен если estimatedReadyAt в прошлом и заказ не закрыт */
export function isOverdue(order) {
  if (!order.estimatedReadyAt) return false;
  if (order.status === 'completed' || order.status === 'cancelled') return false;
  return new Date(order.estimatedReadyAt) < new Date();
}

/** Нет движения более N дней (не закрыт/отменён) */
export function isStale(order, thresholdDays = 3) {
  if (['completed', 'cancelled'].includes(order.status)) return false;
  const lastActivity = order.updatedAt || order.createdAt;
  if (!lastActivity) return false;
  const daysSince = (Date.now() - new Date(lastActivity).getTime()) / 86400000;
  return daysSince > thresholdDays;
}

/** Готов, но не выдан более N дней */
export function isReadyUnpicked(order, thresholdDays = 7) {
  if (order.status !== 'ready') return false;
  const readyAt = order.readyAt || order.updatedAt;
  if (!readyAt) return false;
  const daysSince = (Date.now() - new Date(readyAt).getTime()) / 86400000;
  return daysSince > thresholdDays;
}

/** Ожидает согласования более N часов */
export function isAwaitingApprovalStale(order, thresholdHours = 24) {
  if (order.status !== 'waiting_parts') return false;
  if (order.costConfirmed) return false;
  const lastActivity = order.updatedAt || order.createdAt;
  if (!lastActivity) return false;
  const hoursSince = (Date.now() - new Date(lastActivity).getTime()) / 3600000;
  return hoursSince > thresholdHours;
}

/**
 * Returns attention flags for a single order.
 * Used by OrdersPage to show visual warnings.
 */
export function getAttentionFlags(order) {
  return {
    overdue: isOverdue(order),
    stale: isStale(order),
    readyUnpicked: isReadyUnpicked(order),
    awaitingApproval: isAwaitingApprovalStale(order),
  };
}

/** Returns the highest-severity flag label or null */
export function getAttentionLabel(order) {
  const flags = getAttentionFlags(order);
  if (flags.overdue) return 'Просрочен';
  if (flags.readyUnpicked) return 'Не забирают 7+ дн.';
  if (flags.awaitingApproval) return 'Ждёт согласования 24+ ч.';
  if (flags.stale) return 'Нет движения 3+ дн.';
  return null;
}

/** Auto-compute total from breakdown fields */
export function computeOrderTotal(order) {
  const diag = Number(order.diagCost) || 0;
  const repair = Number(order.repairCost) || 0;
  const parts = Number(order.partsCost) || 0;
  const discount = Number(order.discount) || 0;
  const total = diag + repair + parts - discount;
  return total > 0 ? total : null;
}

// ─── Warranty helpers ────────────────────────────────────────────────────────

export function getWarrantyDaysLeft(order, at = new Date()) {
  const until = order?.warranty?.until;
  if (!until) return null;
  const end = new Date(until);
  const now = new Date(at);
  end.setHours(23, 59, 59, 999);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
}

export function warrantyBadge(daysLeft) {
  if (daysLeft == null) {
    return { text: 'Без гарантии', className: 'bg-white/[0.06] text-[#9ca3af] border-white/[0.08]' };
  }
  if (daysLeft <= 0) {
    return { text: 'Гарантия истекла', className: 'bg-red-500/15 text-red-300 border-red-500/30' };
  }
  if (daysLeft === 1) {
    return { text: 'Остался 1 день', className: 'bg-amber-500/15 text-amber-200 border-amber-500/30' };
  }
  if (daysLeft <= 7) {
    return { text: `Осталось ${daysLeft} дн.`, className: 'bg-amber-500/15 text-amber-200 border-amber-500/30' };
  }
  return { text: `Осталось ${daysLeft} дн.`, className: 'bg-[#84CC16]/15 text-[#84CC16] border-[#84CC16]/30' };
}

// ─── Search ──────────────────────────────────────────────────────────────────

export function matchesOrderSearch(order, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    order.orderNumber,
    order.device,
    order.clientName,
    order.clientPhone,
    order.reason,
    order.internalNote,
    order.publicComment,
    order.clientComment,
    order.managerName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

// ─── Sort ────────────────────────────────────────────────────────────────────

export function sortArchiveOrders(orders) {
  return [...orders].sort((a, b) => {
    const la = getWarrantyDaysLeft(a) ?? -9999;
    const lb = getWarrantyDaysLeft(b) ?? -9999;
    if (lb !== la) return lb - la;
    return new Date(b.issuedAt || b.updatedAt).getTime() - new Date(a.issuedAt || a.updatedAt).getTime();
  });
}

export function sortActiveOrders(orders) {
  return [...orders].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

// ─── Date formatters ─────────────────────────────────────────────────────────

export function formatDt(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return '—'; }
}

export function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    }).format(new Date(iso));
  } catch { return '—'; }
}
