/**
 * Перенос на новый VPS: деплой кода + восстановление из ZIP-бэкапа.
 *
 * Заранее:
 *   1. В deploy.secrets — IP нового сервера, root-пароль, ADMIN_PASSWORD, домен
 *   2. DNS A-запись домена → новый IP (или укажите --base-url http://IP)
 *   3. ZIP из админки «Резервная копия»
 *
 * Запуск:
 *   npm run new-server -- --backup путь/к/proshivka-backup-....zip
 *   npm run new-server -- --backup backup.zip --base-url http://1.2.3.4
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertSecrets, loadSecrets, runDeploy } from './deploy.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv) {
  const out = { backup: '', baseUrl: '' }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--backup' || a === '-b') {
      out.backup = argv[++i] || ''
    } else if (a.startsWith('--backup=')) {
      out.backup = a.slice('--backup='.length)
    } else if (a === '--base-url') {
      out.baseUrl = argv[++i] || ''
    } else if (a.startsWith('--base-url=')) {
      out.baseUrl = a.slice('--base-url='.length)
    } else if (a === '--help' || a === '-h') {
      out.help = true
    }
  }
  return out
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForAdmin(baseUrl, password, { attempts = 36, delayMs = 5000 } = {}) {
  const loginUrl = `${baseUrl.replace(/\/$/, '')}/api/admin/login`
  let lastErr = ''
  for (let i = 1; i <= attempts; i += 1) {
    try {
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok && data.token) {
        console.log(`> admin API готов (${i}/${attempts})`)
        return data.token
      }
      lastErr = `HTTP ${res.status} ${data.error || ''}`
    } catch (e) {
      lastErr = e.message || String(e)
    }
    console.log(`> ждём сайт… ${i}/${attempts} (${lastErr})`)
    await sleep(delayMs)
  }
  throw new Error(`Сайт не ответил на ${loginUrl}: ${lastErr}`)
}

async function restoreBackup(baseUrl, token, zipPath) {
  const buf = fs.readFileSync(zipPath)
  console.log(`> restore ${path.basename(zipPath)} (${buf.length} bytes)…`)
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/admin/restore`, {
    method: 'POST',
    headers: {
      'X-Admin-Token': token,
      'Content-Type': 'application/zip',
    },
    body: buf,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `restore HTTP ${res.status}`)
  }
  return data
}

function printHelp() {
  console.log(`Перенос ПРОШИВКА на новый сервер

Использование:
  npm run new-server -- --backup <файл.zip> [--base-url <url>]

В deploy.secrets должны быть:
  DEPLOY_HOST, DEPLOY_PASSWORD, DEPLOY_DOMAIN, ADMIN_PASSWORD

Примеры:
  npm run new-server -- --backup C:\\\\backups\\\\proshivka-backup-20261125.zip
  npm run new-server -- --backup ./backup.zip --base-url http://217.60.1.2
`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const cfg = loadSecrets()
  assertSecrets(cfg)

  if (!cfg.ADMIN_PASSWORD) {
    throw new Error('Нет ADMIN_PASSWORD в deploy.secrets — нужен пароль админки на новом сервере')
  }

  const backupPath = path.resolve(args.backup || '')
  if (!args.backup || !fs.existsSync(backupPath)) {
    throw new Error(
      'Укажите существующий ZIP: npm run new-server -- --backup путь/к/proshivka-backup.zip',
    )
  }
  const st = fs.statSync(backupPath)
  if (!st.isFile() || st.size < 32) {
    throw new Error(`Подозрительный файл бэкапа: ${backupPath}`)
  }

  const baseUrl =
    (args.baseUrl || '').replace(/\/$/, '') || `https://${cfg.DEPLOY_DOMAIN}`

  console.log('=== Новый сервер ===')
  console.log(`  host:   ${cfg.DEPLOY_USER}@${cfg.DEPLOY_HOST}`)
  console.log(`  domain: ${cfg.DEPLOY_DOMAIN}`)
  console.log(`  API:    ${baseUrl}`)
  console.log(`  backup: ${backupPath}`)
  console.log('')

  await runDeploy(cfg)

  console.log('\n> ждём админ-API…')
  const token = await waitForAdmin(baseUrl, cfg.ADMIN_PASSWORD)
  const restored = await restoreBackup(baseUrl, token, backupPath)
  const c = restored.counts || {}

  console.log('\n=== Готово ===')
  console.log(
    `Восстановлено: работ ${c.works ?? '—'}, фото ${c.uploads ?? '—'}, заказов ${c.orders ?? '—'}`,
  )
  console.log(`Сайт: ${baseUrl}/`)
  console.log(`Админка: ${baseUrl}/admin`)
  console.log('')
  console.log('Чеклист:')
  console.log('  1. DNS A-запись домена (и www) указывает на новый IP')
  console.log('  2. Откройте главную, работы и CRM — всё как в бэкапе')
  console.log('  3. Скачайте свежий ZIP из «Резервная копия» и сохраните в облако')
}

main().catch((e) => {
  console.error('\nnew-server failed:', e.message || e)
  process.exit(1)
})
