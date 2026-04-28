'use strict'

const path    = require('path')
const fs      = require('fs')
const Fastify = require('fastify')
const toml    = require('toml')
const pino    = require('pino')

// ── Load config ──────────────────────────────
const configPath = process.env.EGG_CONFIG
  || path.join(__dirname, '../config/egg.toml')

if (!fs.existsSync(configPath)) {
  console.error(`[EGG] Config not found: ${configPath}`)
  console.error(`[EGG] Copy config/egg.example.toml to config/egg.toml and edit it.`)
  process.exit(1)
}

const config = toml.parse(fs.readFileSync(configPath, 'utf8'))

// ── Logger ───────────────────────────────────
const logger = pino({
  level: config.logging?.level || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' }
    : undefined
})

// ── Fastify app ──────────────────────────────
const app = Fastify({ logger })

// CORS
app.register(require('@fastify/cors'), {
  origin: true
})

// Static client files
const clientDist = path.join(__dirname, '../client/dist')
if (fs.existsSync(clientDist)) {
  app.register(require('@fastify/static'), {
    root: clientDist,
    prefix: '/'
  })
}

// ── Routes ───────────────────────────────────
app.register(require('./routes/repos'),  { prefix: '/api/repos',  config })
app.register(require('./routes/auth'),   { prefix: '/api/auth',   config })
app.register(require('./routes/events'), { prefix: '/api/events', config })
app.register(require('./routes/users'),  { prefix: '/api/users',  config })

// Health check
app.get('/healthz', async () => ({
  status: 'ok',
  version: require('../package.json').version,
  domain: config.server.domain
}))

// NIP-11 relay info (served at /relay)
app.get('/relay', { websocket: false }, async (req, reply) => {
  if (req.headers.accept === 'application/nostr+json') {
    return reply.send({
      name:        config.relay.relay_name || `${config.server.domain} EGG Relay`,
      description: config.relay.relay_description || 'EGG built-in Nostr relay',
      pubkey:      '',
      contact:     `admin@${config.server.domain}`,
      supported_nips: [1, 9, 11, 34],
      software:    'https://github.com/getegg/egg',
      version:     require('../package.json').version
    })
  }
  reply.code(400).send('Use a Nostr client to connect to this relay.')
})

// SPA fallback — serve index.html for any unmatched route
app.setNotFoundHandler(async (req, reply) => {
  const indexPath = path.join(clientDist, 'index.html')
  if (fs.existsSync(indexPath)) {
    return reply.type('text/html').send(fs.readFileSync(indexPath))
  }
  reply.code(404).send({ error: 'Not found' })
})

// ── Start ────────────────────────────────────
const PORT = config.server.port || 3000

app.listen({ port: PORT, host: '127.0.0.1' }, (err) => {
  if (err) {
    logger.error(err)
    process.exit(1)
  }
  logger.info(`EGG server running on port ${PORT}`)
  logger.info(`Domain: https://${config.server.domain}`)
})

module.exports = app
