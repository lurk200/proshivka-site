import { parseRepairQuery } from '../../src/prise/utils/repairQueryParser.js';
import { getRepairSettings } from './repairSettingsStore.js';
import {
  lookupRepairOptions,
  normalizeDisplayModel,
  resolveModel,
  searchTaggsmModels,
  toPublicRepairResult,
} from './taggsmProvider.js';

export { getRepairSettings, saveRepairSettings } from './repairSettingsStore.js';

/** @param {string} query */
export async function getModelSuggestions(query) {
  const models = await searchTaggsmModels(query);
  return models.map(({ id, label }) => ({ id, label }));
}

/**
 * @param {string} model — id модели или текстовый запрос
 * @param {string} [label] — точное название из автодополнения
 */
export async function getRepairQuote(model, label) {
  const raw = String(model || '').trim();
  if (!raw) return null;

  const settings = getRepairSettings();
  if (!settings.enabled) return null;

  const parsed = parseRepairQuery(raw);
  const resolved = await resolveModel(parsed.modelQuery || raw, label);
  if (!resolved) return null;

  const result = await lookupRepairOptions(
    resolved.id,
    resolved.label,
    settings,
    parsed.repairKind,
  );
  const publicResult = toPublicRepairResult(result);
  if (!publicResult) return null;

  return {
    ...publicResult,
    intent: parsed.repairKind
      ? { kind: parsed.repairKind, label: parsed.repairLabel }
      : null,
  };
}

export function getRepairPriceSettings() {
  return getRepairSettings();
}
