#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCmsDataFile, loadSiteContentRaw } from '../server/cms/cmsStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

if (!process.env.CMS_DATA_DIR) {
  process.env.CMS_DATA_DIR = path.join(root, '..', 'proshivka-data', 'cms');
}

const raw = loadSiteContentRaw();
if (!raw) {
  console.error('CMS файл не найден:', getCmsDataFile());
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(path.dirname(getCmsDataFile()), 'backups');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `site-content-${stamp}.json`);
fs.writeFileSync(outFile, JSON.stringify(raw, null, 2), 'utf8');
console.log('Backup saved:', outFile);
