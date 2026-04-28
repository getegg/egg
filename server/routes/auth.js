'use strict'

/**
 * Auth routes — Nostr keypair based
 * Prefix: /api/auth
 *
 * Flow:
 *  1. Client requests a challenge  GET  /api/auth/challenge
 *  2. Client signs challenge with their nsec → NIP-98 HTTP Auth event
 *  3. Client sends signed event     POST /api/auth/verify
 *  4. Server returns a session token (JWT or signed cookie)
 */

const crypto = require('crypto')

// In-memory challenge store (replace with Redis/SQLite for production)
const challenges = new Map()

module.exports = async function authRoutes(app, opts) {
  const { config } = opts

  // ── GET /api/auth/challenge ───────────────
  // Returns a random challenge string the client must sign
  app.get('/challenge', async (req, reply) => {
    const challenge = crypto.randomBytes(32).toString('hex')
    const expiresAt = Date.now() + 60_000 // 60 seconds

    challenges.set(challenge, { expiresAt })

    // Purge expired challenges
    for (const [k, v] of challenges) {
      if (v.expiresAt < Date.now()) challenges.delete(k)
    }

    return reply.send({ challenge, expiresAt })
  })

  // ── POST /api/auth/verify ─────────────────
  // Verifies a NIP-98 signed event containing the challenge
  app.post('/verify', async (req, reply) => {
    const { event } = req.body || {}

    if (!event) return reply.code(400).send({ error: 'event is required' })
    if (event.kind !== 27235) return reply.code(400).send({ error: 'expected kind 27235 (NIP-98)' })

    // Extract challenge from tags
    const challengeTag = event.tags?.find(t => t[0] === 'challenge')
    const challenge = challengeTag?.[1]

    if (!challenge || !challenges.has(challenge)) {
      return reply.code(401).send({ error: 'Invalid or expired challenge' })
    }

    const stored = challenges.get(challenge)
    if (stored.expiresAt < Date.now()) {
      challenges.delete(challenge)
      return reply.code(401).send({ error: 'Challenge expired' })
    }

    // TODO: verify event signature using nostr-tools
    // const valid = verifySignature(event)
    // if (!valid) return reply.code(401).send({ error: 'Invalid signature' })

    challenges.delete(challenge)

    // Issue a simple session token (use proper JWT in production)
    const token = crypto.randomBytes(32).toString('hex')
    const npub  = event.pubkey

    const isAdmin = npub === config.server.admin_npub

    return reply.send({
      token,
      npub,
      is_admin: isAdmin,
      message: `Authenticated as ${npub.slice(0, 12)}...`
    })
  })

  // ── GET /api/auth/me ──────────────────────
  app.get('/me', async (req, reply) => {
    const auth = req.headers.authorization
    if (!auth) return reply.code(401).send({ error: 'Not authenticated' })
    // TODO: validate token
    return reply.send({ message: 'Token validation not yet implemented' })
  })
}
