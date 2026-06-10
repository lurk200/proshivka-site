const PRINT_KEYS = [
  'clientPhone',
  'reason',
  'appearance',
  'kit',
  'prepayment',
  'recommendations',
  'estimatedReadyAt',
  'managerName',
];

export function defaultPrintFields() {
  return {
    clientPhone: '',
    reason: '',
    appearance: '',
    kit: '',
    prepayment: 0,
    recommendations: '',
    estimatedReadyAt: '',
    managerName: '',
  };
}

export function mergePrintFields(target, payload) {
  for (const key of PRINT_KEYS) {
    if (payload[key] === undefined) continue;
    if (key === 'prepayment') {
      const n = Number(payload.prepayment);
      target.prepayment = Number.isFinite(n) ? n : 0;
    } else {
      target[key] = String(payload[key] ?? '').trim();
    }
  }
  return target;
}

export function pickPrintFields(order) {
  const base = defaultPrintFields();
  for (const key of PRINT_KEYS) {
    if (order[key] !== undefined && order[key] !== null) {
      base[key] = key === 'prepayment' ? Number(order.prepayment) || 0 : String(order[key]).trim();
    }
  }
  return base;
}
