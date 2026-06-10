import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createDefaultRepairPriceSettings,
  mergeRepairPriceSettings,
} from '../../src/data/repairPriceSettings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_FILE = path.join(__dirname, 'data', 'repair-price-settings.json');

export function getRepairSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      return mergeRepairPriceSettings(raw);
    }
  } catch {
    /* fallback */
  }
  return createDefaultRepairPriceSettings();
}

/** @param {object} settings */
export function saveRepairSettings(settings) {
  const merged = mergeRepairPriceSettings(settings);
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

export function getSettingsFilePath() {
  return SETTINGS_FILE;
}
