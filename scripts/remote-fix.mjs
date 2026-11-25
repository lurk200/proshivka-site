import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'ssh2'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
function loadSecrets() {
  const out = {}
  for (const line of fs.readFileSync(path.join(ROOT, 'deploy.secrets'), 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return out
}

const cmd = process.argv.slice(2).join(' ') || 'echo no-cmd'
const cfg = loadSecrets()

const conn = new Client()
conn
  .on('ready', () => {
    conn.exec(cmd, { pty: true }, (err, stream) => {
      if (err) throw err
      stream.on('data', (d) => process.stdout.write(d))
      stream.stderr.on('data', (d) => process.stderr.write(d))
      stream.on('close', (code) => {
        conn.end()
        process.exit(code || 0)
      })
    })
  })
  .on('error', (e) => {
    console.error(e)
    process.exit(1)
  })
  .connect({
    host: cfg.DEPLOY_HOST,
    username: cfg.DEPLOY_USER || 'root',
    password: cfg.DEPLOY_PASSWORD,
    readyTimeout: 30000,
  })
