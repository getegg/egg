'use strict'

/**
 * User/npub routes
 * Prefix: /api/users
 *
 * In EGG, "users" are Nostr keypairs (npub).
 * No database of users — identity lives on Nostr.
 * This module manages access grants per instance.
 */

// In-memory ACL; persist to SQLite in production
const accessGrants = new Map() // `${npub}:${repo}` → role

const ROLES = ['viewer', 'contributor', 'maintainer', 'admin']

module.exports = async function userRoutes(app, opts) {
  const { config } = opts

  // ── GET /api/users/access/:repo ──────────
  // List all access grants for a repo
  app.get('/access/:repo', async (req, reply) => {
    const { repo } = req.params
    const grants = []
    for (const [key, role] of accessGrants.entries()) {
      const [npub, r] = key.split(':')
      if (r === repo) grants.push({ npub, role })
    }
    return reply.send(grants)
  })

  // ── POST /api/users/access ────────────────
  // Grant access to an npub (admin only)
  app.post('/access', async (req, reply) => {
    const { npub, repo, role } = req.body || {}

    if (!npub || !repo || !role) {
      return reply.code(400).send({ error: 'npub, repo and role are required' })
    }
    if (!ROLES.includes(role)) {
      return reply.code(400).send({ error: `role must be one of: ${ROLES.join(', ')}` })
    }
    if (!npub.startsWith('npub1')) {
      return reply.code(400).send({ error: 'Invalid npub' })
    }

    accessGrants.set(`${npub}:${repo}`, role)

    // TODO: publish a kind:30621 Nostr event announcing the grant

    return reply.code(201).send({ ok: true, npub, repo, role })
  })

  // ── DELETE /api/users/access ──────────────
  // Revoke access
  app.delete('/access', async (req, reply) => {
    const { npub, repo } = req.body || {}
    if (!npub || !repo) return reply.code(400).send({ error: 'npub and repo are required' })

    const key = `${npub}:${repo}`
    if (!accessGrants.has(key)) return reply.code(404).send({ error: 'Grant not found' })

    accessGrants.delete(key)

    // TODO: publish revocation event

    return reply.send({ ok: true, message: `Access revoked for ${npub} on ${repo}` })
  })

  // ── GET /api/users/check ──────────────────
  // Check if an npub has access to a repo
  app.get('/check', async (req, reply) => {
    const { npub, repo } = req.query
    if (!npub || !repo) return reply.code(400).send({ error: 'npub and repo are required' })

    const role = accessGrants.get(`${npub}:${repo}`) || null
    return reply.send({ npub, repo, role, has_access: role !== null })
  })
}
