/** Стили бейджей уровней качества — единые для карточек цен и справочника */
export const QUALITY_BADGE_STYLES = {
  'Full ORIG': 'bg-amber-400/15 text-amber-200 border-amber-400/35',
  Оригинал: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  'OLED · JCID': 'bg-[#84CC16]/10 text-[#84CC16] border-[#84CC16]/25',
  'Soft OLED': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  OLED: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
  JCID: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
  'Копия хорошего качества':
    'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-medium)]',
  Копия: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
};

export function qualityBadgeClass(label) {
  return QUALITY_BADGE_STYLES[label] ?? QUALITY_BADGE_STYLES['Копия'];
}
