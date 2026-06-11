import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createDefaultRepairPriceSettings,
  mergeRepairPriceSettings,
} from '../../src/data/repairPriceSettings.js';
import {
  createDefaultCategorySettings,
  mergeRepairCategorySettings,
} from '../../src/data/repairCategorySettings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_FILE = path.join(__dirname, 'data', 'repair-price-settings.json');

function readRaw() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    }
  } catch {}
  return null;
}

export function getRepairSettings() {
  const raw = readRaw();
  if (!raw) {
    return {
      ...createDefaultRepairPriceSettings(),
      categorySettings: createDefaultCategorySettings(),
    };
  }
  const merged = mergeRepairPriceSettings(raw);
  merged.categorySettings = mergeRepairCategorySettings(raw.categorySettings);
  return merged;
}

/**
 * @param {object} settings
 * Preserves categorySettings from the existing file if not included in incoming payload,
 * so that saving markup/labor settings never wipes category settings and vice versa.
 */
export function saveRepairSettings(settings) {
  const raw = readRaw() ?? {};
  const merged = mergeRepairPriceSettings(settings);
  merged.categorySettings = mergeRepairCategorySettings(
    settings.categorySettings ?? raw.categorySettings,
  );
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

export function getSettingsFilePath() {
  return SETTINGS_FILE;
}
