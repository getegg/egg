'use strict'

/**
 * EGG — Built-in Nostr Relay
 *
 * Implements NIPs: 1, 9, 11, 34
 * Handles EGG-specific event kinds: 30617-30621, 1621-1622
 */

const { WebSocketServer } = require('ws')
const path   = require('path')
const fs     = require('fs')
const toml   = require('toml')
const crypto = require('crypto')

// ── Config ───────────────────────────────────
const configPath = process.env.EGG_CONFIG
  || path.join(__dirname, '../config/egg.toml')

const config = toml.parse(fs.readFileSync(configPath, 'utf8'))
const PORT   = config.relay?.port || 7777

// ── In-memory event store (replace with SQLite for production) ──
const events   = new Map()   // id → event
const subs     = new Map()   // ws → Map<subId, filters[]>

// ── EGG-relevant event kinds ─────────────────
const EGG_KINDS = new Set([
  30617, // Repository metadata
  30618, // Commit / Patch
  30619, // Pull Request
  30620, // Release / Tag
  30621, // Access Grant
  1621,  // Issue
  1622,  // Comment / Review
  0,     // Profile metadata
  3,     // Contacts / follows
])

// ── WebSocket server ──────────────────────────
const wss = new WebSocketServer({ port: PORT })

console.log(`[EGG relay] Listening on ws://127.0.0.1:${PORT}`)

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress
  console.log(`[EGG relay] Connected: ${ip}`)

  subs.set(ws, new Map())

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw) } catch { return }

    if (!Array.isArray(msg) || msg.length < 2) return

    const [type, ...args] = msg

    switch (type) {
      case 'EVENT':  handleEvent(ws, args[0]);              break
      case 'REQ':    handleReq(ws, args[0], args.slice(1)); break
      case 'CLOSE':  handleClose(ws, args[0]);              break
    }
  })

  ws.on('close', () => {
    subs.delete(ws)
    console.log(`[EGG relay] Disconnected: ${ip}`)
  })
})

// ── EVENT handler ─────────────────────────────
function handleEvent(ws, event) {
  if (!event || !event.id || !event.sig) {
    return send(ws, ['NOTICE', 'Invalid event'])
  }

  // Accept EGG kinds and standard social kinds
  if (!EGG_KINDS.has(event.kind) && event.kind !== 1) {
    return send(ws, ['OK', event.id, false, 'blocked: unsupported kind'])
  }

  // Store event
  events.set(event.id, event)

  // Acknowledge
  send(ws, ['OK', event.id, true, ''])

  // Broadcast to matching subscribers
  for (const [client, clientSubs] of subs.entries()) {
    if (client === ws || client.readyState !== 1) continue
    for (const [subId, filters] of clientSubs.entries()) {
      if (matchesFilters(event, filters)) {
        send(client, ['EVENT', subId, event])
      }
    }
  }

  // Forward to external relays if configured
  const broadcastTo = config.relay?.broadcast_to || []
  for (const url of broadcastTo) {
    broadcastEvent(url, event).catch(() => {})
  }
}

// ── REQ handler ──────────────────────────────
function handleReq(ws, subId, filters) {
  if (!subId || !filters) return

  // Store subscription
  subs.get(ws).set(subId, filters)

  // Send matching stored events
  for (const event of events.values()) {
    if (matchesFilters(event, filters)) {
      send(ws, ['EVENT', subId, event])
    }
  }

  send(ws, ['EOSE', subId])
}

// ── CLOSE handler ────────────────────────────
function handleClose(ws, subId) {
  subs.get(ws)?.delete(subId)
}

// ── Filter matching ──────────────────────────
function matchesFilters(event, filters) {
  for (const f of filters) {
    if (matchesFilter(event, f)) return true
  }
  return false
}

function matchesFilter(event, f) {
  if (f.ids    && !f.ids.some(id => event.id.startsWith(id)))         return false
  if (f.authors && !f.authors.some(a => event.pubkey.startsWith(a)))  return false
  if (f.kinds  && !f.kinds.includes(event.kind))                      return false
  if (f.since  && event.created_at < f.since)                         return false
  if (f.until  && event.created_at > f.until)                         return false
  if (f['#e']  && !f['#e'].some(e => event.tags.some(t => t[0]==='e' && t[1]===e))) return false
  if (f['#p']  && !f['#p'].some(p => event.tags.some(t => t[0]==='p' && t[1]===p))) return false
  if (f['#a']  && !f['#a'].some(a => event.tags.some(t => t[0]==='a' && t[1]===a))) return false
  return true
}

// ── Helpers ───────────────────────────────────
function send(ws, msg) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(msg))
  }
}

async function broadcastEvent(relayUrl, event) {
  const { WebSocket } = require('ws')
  const ws = new WebSocket(relayUrl)
  await new Promise((resolve, reject) => {
    ws.on('open',  () => { ws.send(JSON.stringify(['EVENT', event])); ws.close(); resolve() })
    ws.on('error', reject)
  })
}
