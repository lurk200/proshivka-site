/** Статусы ремонта — порядок отображения в таймлайне */
export const ORDER_STATUSES = [
  {
    id: 'accepted',
    label: 'Принято',
    description: 'Устройство принято в лабораторию',
    tone: 'muted',
  },
  {
    id: 'diagnostics',
    label: 'Диагностика',
    description: 'Проводим диагностику и согласуем работы',
    tone: 'info',
  },
  {
    id: 'waiting_parts',
    label: 'Ожидание запчасти',
    description: 'Ожидаем поставку комплектующих',
    tone: 'warning',
  },
  {
    id: 'in_progress',
    label: 'В работе',
    description: 'Выполняем ремонт',
    tone: 'active',
  },
  {
    id: 'ready',
    label: 'Готово',
    description: 'Ремонт завершён — можно забрать в сервисе',
    tone: 'success',
  },
  {
    id: 'completed',
    label: 'Выдан',
    description: 'Устройство передано клиенту, оформлены акт и гарантия',
    tone: 'done',
  },
  {
    id: 'cancelled',
    label: 'Отменено',
    description: 'Заказ закрыт без ремонта',
    tone: 'cancelled',
  },
];

export const ORDER_STATUS_MAP = Object.fromEntries(
  ORDER_STATUSES.map((s) => [s.id, s]),
);

export function getStatusMeta(statusId) {
  return ORDER_STATUS_MAP[statusId] ?? ORDER_STATUSES[0];
}

/** Индекс для прогресс-бара (отмена — отдельно) */
export function getStatusProgressIndex(statusId) {
  const idx = ORDER_STATUSES.findIndex((s) => s.id === statusId);
  if (statusId === 'cancelled') return -1;
  return idx >= 0 ? idx : 0;
}
