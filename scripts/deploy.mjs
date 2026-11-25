/**
 * Деплой ПРОШИВКА на VPS.
 *
 * 1. Читает deploy.secrets (или env)
 * 2. Собирает tar.gz релиза (без node_modules / dist / .git)
 * 3. Заливает на сервер по SSH/SFTP
 * 4. Запускает deploy/remote-bootstrap.sh
 *
 * Запуск: npm run deploy
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { Client } from 'ssh2'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SECRETS = path.join(ROOT, 'deploy.secrets')

export function loadSecrets() {
  const out = {
    DEPLOY_HOST: process.env.DEPLOY_HOST || '',
    DEPLOY_USER: process.env.DEPLOY_USER || 'root',
    DEPLOY_PASSWORD: process.env.DEPLOY_PASSWORD || '',
    DEPLOY_DOMAIN: process.env.DEPLOY_DOMAIN || 'proshivka.online',
    CERTBOT_EMAIL: process.env.CERTBOT_EMAIL || '',
    SKIP_SSL: process.env.SKIP_SSL || '0',
    DEPLOY_PORT: process.env.DEPLOY_PORT || '22',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  }
  if (fs.existsSync(SECRETS)) {
    const text = fs.readFileSync(SECRETS, 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i < 0) continue
      const k = t.slice(0, i).trim()
      const v = t.slice(i + 1).trim()
      if (k) out[k] = v
    }
  }
  if (!out.CERTBOT_EMAIL) out.CERTBOT_EMAIL = `admin@${out.DEPLOY_DOMAIN}`
  return out
}

export function assertSecrets(cfg) {
  if (!cfg.DEPLOY_HOST) throw new Error('Нет DEPLOY_HOST — заполните deploy.secrets')
  if (!cfg.DEPLOY_PASSWORD && !process.env.DEPLOY_KEY) {
    throw new Error('Нет DEPLOY_PASSWORD (или DEPLOY_KEY) — заполните deploy.secrets')
  }
}

function buildArchive() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const out = path.join(ROOT, `proshivka-release-${stamp}.tar.gz`)
  const exclude = [
    '--exclude=node_modules',
    '--exclude=dist',
    '--exclude=.git',
    '--exclude=phone-shots',
    '--exclude=tmp-phone',
    '--exclude=server/backups',
    '--exclude=deploy.secrets',
    '--exclude=*.tar.gz',
    '--exclude=.env',
    '--exclude=.env.local',
  ]

  const args = ['-czf', out, ...exclude, '-C', ROOT, '.']
  console.log('> packing release…')
  const r = spawnSync('tar', args, { stdio: 'inherit', shell: true })
  if (r.status !== 0) throw new Error('tar failed — нужен tar (Windows 10+ / Git Bash)')
  return out
}

function sshExec(conn, command, { pty = false } = {}) {
  return new Promise((resolve, reject) => {
    conn.exec(command, { pty }, (err, stream) => {
      if (err) return reject(err)
      let stdout = ''
      let stderr = ''
      stream.on('data', (d) => {
        const s = d.toString()
        stdout += s
        process.stdout.write(s)
      })
      stream.stderr.on('data', (d) => {
        const s = d.toString()
        stderr += s
        process.stderr.write(s)
      })
      stream.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Remote exit ${code}\n${stderr || stdout}`))
        } else resolve({ stdout, stderr, code })
      })
    })
  })
}

function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err)
      console.log(`> upload ${path.basename(localPath)} → ${remotePath}`)
      sftp.fastPut(localPath, remotePath, (e) => {
        sftp.end()
        if (e) reject(e)
        else resolve()
      })
    })
  })
}

function connect(cfg) {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    const opts = {
      host: cfg.DEPLOY_HOST,
      port: Number(cfg.DEPLOY_PORT) || 22,
      username: cfg.DEPLOY_USER,
      readyTimeout: 30000,
      password: cfg.DEPLOY_PASSWORD || undefined,
      privateKey: process.env.DEPLOY_KEY
        ? fs.readFileSync(process.env.DEPLOY_KEY)
        : undefined,
    }
    conn
      .on('ready', () => resolve(conn))
      .on('error', reject)
      .connect(opts)
  })
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`
}

/** Полный деплой кода на VPS. cfg — результат loadSecrets(). */
export async function runDeploy(cfg = loadSecrets()) {
  assertSecrets(cfg)

  console.log(`Deploy → ${cfg.DEPLOY_USER}@${cfg.DEPLOY_HOST} (${cfg.DEPLOY_DOMAIN})`)

  const archive = buildArchive()
  const remoteArchive = '/tmp/proshivka-release.tar.gz'
  let conn
  try {
    conn = await connect(cfg)
    await uploadFile(conn, archive, remoteArchive)

    const bootstrapLocal = path.join(ROOT, 'deploy', 'remote-bootstrap.sh')
    await uploadFile(conn, bootstrapLocal, '/tmp/proshivka-bootstrap.sh')

    const envExport = [
      `export APP_DIR=/var/www/proshivka`,
      `export DOMAIN=${shellQuote(cfg.DEPLOY_DOMAIN)}`,
      `export CERTBOT_EMAIL=${shellQuote(cfg.CERTBOT_EMAIL)}`,
      `export SKIP_SSL=${shellQuote(cfg.SKIP_SSL)}`,
    ]
    if (cfg.ADMIN_PASSWORD) {
      envExport.push(`export ADMIN_PASSWORD=${shellQuote(cfg.ADMIN_PASSWORD)}`)
    }

    console.log('> remote bootstrap…')
    await sshExec(
      conn,
      `${envExport.join('\n')}\nchmod +x /tmp/proshivka-bootstrap.sh\nbash /tmp/proshivka-bootstrap.sh`,
      { pty: true },
    )

    console.log('\nГотово.')
    console.log(`  http://${cfg.DEPLOY_DOMAIN}/`)
    console.log(`  https://${cfg.DEPLOY_DOMAIN}/  (если DNS и certbot прошли)`)
    if (cfg.ADMIN_PASSWORD) {
      console.log('ADMIN_PASSWORD записан в /var/www/proshivka/.env на сервере.')
    } else {
      console.log('Смените ADMIN_PASSWORD в /var/www/proshivka/.env на сервере.')
    }
  } finally {
    try {
      fs.unlinkSync(archive)
    } catch {
      /* ignore */
    }
    if (conn) conn.end()
  }
}

async function main() {
  await runDeploy(loadSecrets())
}

const isDirect =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirect) {
  main().catch((e) => {
    console.error('\nDeploy failed:', e.message || e)
    process.exit(1)
  })
}
