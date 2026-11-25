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

const local = process.argv[2]
const remote = process.argv[3]
const cmd = process.argv.slice(4).join(' ')
if (!local || !remote || !cmd) {
  console.error('Usage: node remote-upload-run.mjs <local> <remote> <cmd...>')
  process.exit(1)
}

const cfg = loadSecrets()
const conn = new Client()

function exec(command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, { pty: true }, (err, stream) => {
      if (err) return reject(err)
      stream.on('data', (d) => process.stdout.write(d))
      stream.stderr.on('data', (d) => process.stderr.write(d))
      stream.on('close', (code) => (code ? reject(new Error(`exit ${code}`)) : resolve()))
    })
  })
}

conn
  .on('ready', async () => {
    try {
      await new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
          if (err) return reject(err)
          sftp.fastPut(path.resolve(ROOT, local), remote, (e) => {
            sftp.end()
            if (e) reject(e)
            else resolve()
          })
        })
      })
      console.log('uploaded', remote)
      await exec(cmd)
      conn.end()
    } catch (e) {
      console.error(e)
      conn.end()
      process.exit(1)
    }
  })
  .on('error', (e) => {
    console.error(e)
    process.exit(1)
  })
  .connect({
    host: cfg.DEPLOY_HOST,
    username: cfg.DEPLOY_USER || 'root',
    password: cfg.DEPLOY_PASSWORD,
  })
