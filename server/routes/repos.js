'use strict'

const path     = require('path')
const fs       = require('fs')
const simpleGit = require('simple-git')

/**
 * Repository routes
 * Prefix: /api/repos
 */
module.exports = async function repoRoutes(app, opts) {
  const { config } = opts
  const reposPath = config.git.repos_path

  // ── List all public repos ─────────────────
  app.get('/', async (req, reply) => {
    const dirs = fs.readdirSync(reposPath, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name.endsWith('.git'))

    const repos = dirs.map(d => {
      const name = d.name.replace(/\.git$/, '')
      const descFile = path.join(reposPath, d.name, 'description')
      const description = fs.existsSync(descFile)
        ? fs.readFileSync(descFile, 'utf8').trim()
        : ''
      return { name, description, clone_url: `https://${config.server.domain}/${name}.git` }
    })

    return reply.send(repos)
  })

  // ── Get single repo info ──────────────────
  app.get('/:repo', async (req, reply) => {
    const repoDir = path.join(reposPath, `${req.params.repo}.git`)
    if (!fs.existsSync(repoDir)) return reply.code(404).send({ error: 'Repository not found' })

    const git = simpleGit(repoDir)
    const log = await git.log({ maxCount: 1 }).catch(() => null)

    return reply.send({
      name:       req.params.repo,
      clone_url:  `https://${config.server.domain}/${req.params.repo}.git`,
      ssh_url:    `git@${config.server.domain}:${req.params.repo}.git`,
      last_commit: log?.latest || null
    })
  })

  // ── List commits ──────────────────────────
  app.get('/:repo/commits', async (req, reply) => {
    const repoDir = path.join(reposPath, `${req.params.repo}.git`)
    if (!fs.existsSync(repoDir)) return reply.code(404).send({ error: 'Not found' })

    const git = simpleGit(repoDir)
    const log = await git.log({ maxCount: 30 }).catch(() => ({ all: [] }))
    return reply.send(log.all)
  })

  // ── Create repo (authenticated) ───────────
  app.post('/', async (req, reply) => {
    const { name, description, visibility } = req.body || {}
    if (!name) return reply.code(400).send({ error: 'name is required' })

    const safe = name.replace(/[^a-zA-Z0-9_.-]/g, '')
    const repoDir = path.join(reposPath, `${safe}.git`)
    if (fs.existsSync(repoDir)) return reply.code(409).send({ error: 'Repository already exists' })

    fs.mkdirSync(repoDir, { recursive: true })
    const git = simpleGit()
    await git.init(repoDir, ['--bare'])

    if (description) {
      fs.writeFileSync(path.join(repoDir, 'description'), description)
    }

    return reply.code(201).send({
      name: safe,
      clone_url: `https://${config.server.domain}/${safe}.git`,
      ssh_url:   `git@${config.server.domain}:${safe}.git`,
      visibility: visibility || 'public'
    })
  })

  // ── Delete repo (authenticated, admin) ───
  app.delete('/:repo', async (req, reply) => {
    const repoDir = path.join(reposPath, `${req.params.repo}.git`)
    if (!fs.existsSync(repoDir)) return reply.code(404).send({ error: 'Not found' })

    fs.rmSync(repoDir, { recursive: true, force: true })
    return reply.send({ message: `Repository '${req.params.repo}' deleted.` })
  })
}
