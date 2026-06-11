/** Порядок отображения вариантов (от премиум к базовым) */
export const TIER_ORDER = [
  'full-orig',
  'original',
  'oled-jcid',
  'soft-oled',
  'oled',
  'jcid',
  'copy-good',
  'copy',
];

const QUALITY_LABELS = {
  'full-orig': 'Full ORIG',
  original: 'Оригинал',
  'oled-jcid': 'OLED · JCID',
  'soft-oled': 'Soft OLED',
  oled: 'OLED',
  jcid: 'JCID',
  'copy-good': 'Хорошая копия',
  copy: 'Копия',
};

const REPAIR_TYPE_LABELS = {
  display:        'Замена дисплея',
  battery:        'Замена аккумулятора',
  port:           'Замена разъёма зарядки',
  camera:         'Замена камеры',
  'camera-glass': 'Замена стекла камеры',
  'back-glass':   'Замена задней крышки',
  housing:        'Замена корпуса',
  'ear-speaker':  'Замена слухового динамика',
  microphone:     'Замена микрофона',
  speaker:        'Замена динамика',
  vibration:      'Замена вибромотора',
  button:         'Замена кнопок',
  'face-id':      'Восстановление Face ID',
};

/**
 * Detect the repair/part category from a product title and section.
 * Order matters: most specific patterns checked first.
 *
 * @param {string} title
 * @param {string} [sectionName]
 * @returns {string | null}
 */
export function detectRepairCategory(title, sectionName = '') {
  const t = title.toLowerCase();
  const s = sectionName.toLowerCase();

  // ── Battery ──────────────────────────────────────────────────────────────
  if (/акб|аккумулятор/i.test(t) || /акб|аккумулятор/i.test(s)) {
    return 'battery';
  }

  // ── Face ID (very specific — before button/camera) ────────────────────
  if (/face[\s._-]*id/i.test(t) || /face[\s._-]*id/i.test(s)) {
    return 'face-id';
  }

  // ── Camera glass (more specific than generic camera) ──────────────────
  if (/стекло\s*камер|линза\s*камер|стекл[оа]\s+на\s+камер|glass.*cam|cam.*glass/i.test(t)) {
    return 'camera-glass';
  }

  // ── Charging port (before generic flex so display flex isn't captured) ─
  const isDisplayFlex =
    /шлейф.*(?:диспл|lcd|матриц|экран)|(?:диспл|lcd|матриц|экран).*шлейф/i.test(t);
  if (
    !isDisplayFlex &&
    (/шлейф\s+(?:заряд|питани)|разъ?е?м|коннектор\s+заряд|плата\s+заряд|нижн.*плат|гнездо\s+заряд|charging|type-?c.*шлейф|lightning.*шлейф/i.test(t) ||
      /разъ?е?м|заряд/i.test(s))
  ) {
    return 'port';
  }

  // ── Display ───────────────────────────────────────────────────────────
  if (
    /дисплей/i.test(t) &&
    !/скотч|подсветк|поляриз|стекло\s|плёнк|пленк/i.test(t)
  ) {
    return 'display';
  }

  // ── Camera (after camera-glass) ───────────────────────────────────────
  if (/камер|camera|объектив/i.test(t) || /камер/i.test(s)) {
    return 'camera';
  }

  // ── Back glass / rear cover ───────────────────────────────────────────
  if (
    /задн.*крышк|задн.*стекл|back.*cover|back.*glass|крышк.*корпус|rear.*cover/i.test(t) ||
    /задн.*крышк|задн.*стекл/i.test(s)
  ) {
    return 'back-glass';
  }

  // ── Housing / frame ───────────────────────────────────────────────────
  if (
    /\bкорпус\b|рамк[аи]|housing|frame|средн.*часть/i.test(t) ||
    /\bкорпус\b|рамк/i.test(s)
  ) {
    return 'housing';
  }

  // ── Ear speaker (before generic speaker) ─────────────────────────────
  if (/слухов|разговорн|гарнитурн|earpiece|ear[\s-]*speaker/i.test(t)) {
    return 'ear-speaker';
  }

  // ── Microphone ────────────────────────────────────────────────────────
  if (/микрофон|microphone/i.test(t)) {
    return 'microphone';
  }

  // ── Speaker (loudspeaker / polyphonic) ────────────────────────────────
  if (
    /динамик|полифон|speaker|buzzer|громкоговор/i.test(t) ||
    /динамик|полифон/i.test(s)
  ) {
    return 'speaker';
  }

  // ── Vibration motor ───────────────────────────────────────────────────
  if (/вибромотор|вибратор|vibrat/i.test(t)) {
    return 'vibration';
  }

  // ── Buttons ───────────────────────────────────────────────────────────
  if (/кнопк[аи]?|home[\s-]*button|power[\s-]*button|volume[\s-]*button/i.test(t) || /кнопк/i.test(s)) {
    return 'button';
  }

  return null;
}

/**
 * Classify quality tier for a part.
 * Display parts get full tier resolution; all others use simple original/copy.
 *
 * @param {string} title
 * @param {string} kind
 */
export function classifyPartTier(title, kind) {
  const t = title.toLowerCase();

  if (kind === 'display') {
    if (/full\s*orig(?:inal)?/i.test(t)) return 'full-orig';
    if (/оригинал|original|genuine|service\s*pack|\borg\b/i.test(t)) return 'original';
    if (/soft\s*oled/i.test(t) && /jcid|diagnosable/i.test(t)) return 'oled-jcid';
    if (/soft\s*oled/i.test(t)) return 'soft-oled';
    if (/oled/i.test(t) && /jcid|diagnosable|ltps/i.test(t)) return 'oled-jcid';
    if (/oled/i.test(t)) return 'oled';
    if (/jcid|diagnosable|ltps/i.test(t)) return 'jcid';
    if (/\bjk\b|\bgx\b|\balg\b|\brj\b|\bdd\b|\brd\b/i.test(t)) return 'copy-good';
    return 'copy';
  }

  // All other categories: simple tier
  if (/full\s*orig(?:inal)?/i.test(t)) return 'original';
  if (/ориг|original|orig[\s-]?ic|service\s*pack|genuine/i.test(t)) return 'original';
  if (/jcid|diagnosable/i.test(t)) return 'jcid';
  if (/повышенн|увелич/i.test(t)) return 'copy-good';
  return 'copy';
}

/** @param {string} tier */
export function getQualityLabel(tier) {
  return QUALITY_LABELS[tier] ?? 'Копия';
}

/** @param {string} title */
export function extractVariantHint(title) {
  const parts = String(title || '').split(',');
  if (parts.length > 1) {
    return parts.slice(1).join(',').trim().replace(/\s+/g, ' ');
  }
  const match = title.match(/\)\s*,\s*(.+)$/i);
  return match?.[1]?.trim() || '';
}

/** @param {string} category */
export function repairTypeLabel(category) {
  return REPAIR_TYPE_LABELS[category] ?? category;
}
