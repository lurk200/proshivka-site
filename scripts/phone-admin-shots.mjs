import http from 'node:http'
import fs from 'node:fs'

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = ''
      res.on('data', (c) => (d += c))
      res.on('end', () => resolve(JSON.parse(d)))
    }).on('error', reject)
  })
}

function cdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    let id = 0
    const pending = new Map()
    ws.addEventListener('open', () => {
      resolve({
        call(method, params = {}) {
          const msgId = ++id
          return new Promise((res, rej) => {
            pending.set(msgId, { res, rej })
            ws.send(JSON.stringify({ id: msgId, method, params }))
          })
        },
        close() {
          ws.close()
        },
      })
    })
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id)
        pending.delete(msg.id)
        if (msg.error) rej(new Error(msg.error.message || 'cdp error'))
        else res(msg.result)
      }
    })
    ws.addEventListener('error', reject)
  })
}

async function shot(client, file) {
  const result = await client.call('Page.captureScreenshot', { format: 'png', fromSurface: true })
  fs.writeFileSync(file, Buffer.from(result.data, 'base64'))
  console.log('saved', file, fs.statSync(file).size)
}

const tabs = await getJson('http://127.0.0.1:9222/json')
const tab =
  tabs.find((t) => t.url?.includes('127.0.0.1:5174') && t.url.includes('admin')) ||
  tabs.find((t) => t.url?.includes('127.0.0.1:5174'))

if (!tab?.webSocketDebuggerUrl) {
  console.error('No site tab')
  process.exit(1)
}

const client = await cdp(tab.webSocketDebuggerUrl)
await client.call('Runtime.enable')
await client.call('Page.enable')

const token = Buffer.from('admin').toString('base64')
await client.call('Runtime.evaluate', {
  expression: `localStorage.setItem('proshivka_v2_admin_token', ${JSON.stringify(token)}); location.href = '/admin?t=' + Date.now();`,
})
await new Promise((r) => setTimeout(r, 2800))
await shot(client, 'phone-admin-dash.png')

await client.call('Runtime.evaluate', {
  expression: "location.href='/admin/works'",
})
await new Promise((r) => setTimeout(r, 2200))
await shot(client, 'phone-admin-works.png')

client.close()
console.log('done')
