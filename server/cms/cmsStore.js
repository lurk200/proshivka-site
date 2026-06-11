import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_DIR = path.join(__dirname, 'data');

export function getCmsDataDir() {
  if (process.env.CMS_DATA_DIR) {
    return path.resolve(process.env.CMS_DATA_DIR);
  }
  return LEGACY_DIR;
}

export function getCmsDataFile() {
  return path.join(getCmsDataDir(), 'site-content.json');
}

function getCmsBackupFile() {
  return path.join(getCmsDataDir(), 'site-content.backup.json');
}

/** Перенос из старого пути внутри репозитория (если настроен CMS_DATA_DIR). */
export function migrateLegacyStore() {
  const legacyFile = path.join(LEGACY_DIR, 'site-content.json');
  const targetFile = getCmsDataFile();

  if (path.resolve(legacyFile) === path.resolve(targetFile)) return false;

  if (fs.existsSync(legacyFile) && !fs.existsSync(targetFile)) {
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.copyFileSync(legacyFile, targetFile);
    return true;
  }

  return false;
}

export function loadSiteContentRaw() {
  migrateLegacyStore();

  const file = getCmsDataFile();
  try {
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw.trim()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSiteContentRaw(content) {
  migrateLegacyStore();

  const file = getCmsDataFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });

  if (fs.existsSync(file)) {
    try {
      fs.copyFileSync(file, getCmsBackupFile());
    } catch {
      // резервная копия необязательна
    }
  }

  fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
}

export function hasSiteContentFile() {
  migrateLegacyStore();
  return fs.existsSync(getCmsDataFile());
}

export function getCmsStoreInfo() {
  migrateLegacyStore();
  const file = getCmsDataFile();
  const backup = getCmsBackupFile();

  return {
    dataDir: getCmsDataDir(),
    dataFile: file,
    exists: fs.existsSync(file),
    backupExists: fs.existsSync(backup),
    updatedAt: fs.existsSync(file) ? fs.statSync(file).mtime.toISOString() : null,
    persistent: Boolean(process.env.CMS_DATA_DIR),
  };
}
