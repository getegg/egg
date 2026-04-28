'use strict'

/**
 * Nostr events routes
 * Prefix: /api/events
 *
 * These endpoints proxy/store EGG-specific Nostr events:
 *   issues, pull requests, reviews, releases
 */

// In-memory store; replace with SQLite (better-sqlite3) in production
const store = {
  issues:   new Map(), // id → event
  prs:      new Map(),
  comments: new Map(),
  releases: new Map(),
}

// EGG event kinds
const KIND = {
  REPO:         30617,
  PATCH:        30618,
  PULL_REQUEST: 30619,
  RELEASE:      30620,
  ACCESS_GRANT: 30621,
  ISSUE:        1621,
  COMMENT:      1622,
}

module.exports = async function eventRoutes(app, opts) {

  // ── POST /api/events ─────────────────────
  // Receive and store a signed Nostr event
  app.post('/', async (req, reply) => {
    const { event } = req.body || {}
    if (!event) return reply.code(400).send({ error: 'event is required' })

    // TODO: verify signature
    // const valid = verifySignature(event)
    // if (!valid) return reply.code(400).send({ error: 'Invalid signature' })

    switch (event.kind) {
      case KIND.ISSUE:        store.issues.set(event.id, event);   break
      case KIND.PULL_REQUEST: store.prs.set(event.id, event);      break
      case KIND.COMMENT:      store.comments.set(event.id, event); break
      case KIND.RELEASE:      store.releases.set(event.id, event); break
      default:
        return reply.code(400).send({ error: `Unsupported event kind: ${event.kind}` })
    }

    return reply.code(201).send({ ok: true, id: event.id })
  })

  // ── GET /api/events/issues/:repo ─────────
  app.get('/issues/:repo', async (req, reply) => {
    const { repo } = req.params
    const repoTag = `30617:*:${repo}`

    const issues = [...store.issues.values()].filter(e =>
      e.tags?.some(t => t[0] === 'a' && t[1].endsWith(`:${repo}`))
    )
    return reply.send(issues)
  })

  // ── GET /api/events/prs/:repo ─────────────
  app.get('/prs/:repo', async (req, reply) => {
    const { repo } = req.params
    const prs = [...store.prs.values()].filter(e =>
      e.tags?.some(t => t[0] === 'a' && t[1].endsWith(`:${repo}`))
    )
    return reply.send(prs)
  })

  // ── GET /api/events/comments/:eventId ────
  app.get('/comments/:eventId', async (req, reply) => {
    const { eventId } = req.params
    const comments = [...store.comments.values()].filter(e =>
      e.tags?.some(t => t[0] === 'e' && t[1] === eventId)
    )
    return reply.send(comments)
  })

  // ── GET /api/events/releases/:repo ───────
  app.get('/releases/:repo', async (req, reply) => {
    const { repo } = req.params
    const releases = [...store.releases.values()].filter(e =>
      e.tags?.some(t => t[0] === 'a' && t[1].endsWith(`:${repo}`))
    )
    return reply.send(releases)
  })
}
