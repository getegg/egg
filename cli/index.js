#!/usr/bin/env node
'use strict'

/**
 * egg-cli — EGG command line tool
 * Usage: egg-cli <command> [options]
 */

const { execSync } = require('child_process')
const path  = require('path')
const fs    = require('fs')
const pkg   = require('../package.json')

const args = process.argv.slice(2)
const cmd  = args[0]

const HELP = `
  egg-cli v${pkg.version}

  Usage: egg-cli <command> [options]

  Commands:
    repo create <name>        Create a new repository
    repo list                 List repositories on this instance
    repo delete <name>        Delete a repository

    access grant              Grant npub access to a repo
    access revoke             Revoke npub access from a repo
    access list <repo>        List access grants for a repo

    relay status              Show relay status
    relay logs                Tail relay logs

    status                    Show EGG service status
    logs                      Tail EGG logs
    version                   Print version
    help                      Show this help

  Examples:
    egg-cli repo create myproject --visibility public
    egg-cli access grant --repo myproject --npub npub1... --role contributor
    egg-cli access revoke --repo myproject --npub npub1...
    egg-cli status
`

function parseFlags(args) {
  const flags = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      flags[key] = args[i + 1] || true
      i++
    }
  }
  return flags
}

function apiBase() {
  const configPath = process.env.EGG_CONFIG
    || path.join(__dirname, '../config/egg.toml')
  if (!fs.existsSync(configPath)) return 'http://localhost:3000'
  try {
    const toml = require('toml')
    const cfg  = toml.parse(fs.readFileSync(configPath, 'utf8'))
    return `https://${cfg.server.domain}`
  } catch { return 'http://localhost:3000' }
}

async function apiFetch(method, route, body) {
  const base = apiBase()
  const url  = `${base}${route}`
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)

  const r = await fetch(url)
  return r.json()
}

// ── Commands ──────────────────────────────────

async function main() {
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    console.log(HELP)
    return
  }

  if (cmd === 'version' || cmd === '--version' || cmd === '-v') {
    console.log(`egg-cli v${pkg.version}`)
    return
  }

  if (cmd === 'status') {
    try {
      execSync('systemctl is-active egg', { stdio: 'pipe' })
      console.log('  egg         ✓ running')
    } catch { console.log('  egg         ✗ stopped') }
    try {
      execSync('systemctl is-active egg-relay', { stdio: 'pipe' })
      console.log('  egg-relay   ✓ running')
    } catch { console.log('  egg-relay   ✗ stopped') }
    return
  }

  if (cmd === 'logs') {
    execSync('journalctl -u egg -f', { stdio: 'inherit' })
    return
  }

  const sub = args[1]

  // ── repo ──────────────────────────────────
  if (cmd === 'repo') {
    const flags = parseFlags(args.slice(2))

    if (sub === 'list') {
      const repos = await apiFetch('GET', '/api/repos')
      if (!repos.length) { console.log('  No repositories.'); return }
      repos.forEach(r => console.log(`  ${r.name.padEnd(30)} ${r.clone_url}`))
      return
    }

    if (sub === 'create') {
      const name = args[2]
      if (!name) { console.error('Usage: egg-cli repo create <name>'); process.exit(1) }
      const result = await apiFetch('POST', '/api/repos', {
        name,
        visibility: flags.visibility || 'public',
        description: flags.description || ''
      })
      console.log(`  Created: ${result.ssh_url}`)
      return
    }

    if (sub === 'delete') {
      const name = args[2]
      if (!name) { console.error('Usage: egg-cli repo delete <name>'); process.exit(1) }
      const result = await apiFetch('DELETE', `/api/repos/${name}`)
      console.log(`  ${result.message}`)
      return
    }
  }

  // ── access ────────────────────────────────
  if (cmd === 'access') {
    const flags = parseFlags(args.slice(2))

    if (sub === 'grant') {
      if (!flags.repo || !flags.npub || !flags.role) {
        console.error('Usage: egg-cli access grant --repo <name> --npub <npub> --role <role>')
        process.exit(1)
      }
      const result = await apiFetch('POST', '/api/users/access', flags)
      console.log(`  Granted ${result.role} to ${result.npub} on ${result.repo}`)
      return
    }

    if (sub === 'revoke') {
      if (!flags.repo || !flags.npub) {
        console.error('Usage: egg-cli access revoke --repo <name> --npub <npub>')
        process.exit(1)
      }
      const result = await apiFetch('DELETE', '/api/users/access', flags)
      console.log(`  ${result.message}`)
      return
    }

    if (sub === 'list') {
      const repo = args[2]
      if (!repo) { console.error('Usage: egg-cli access list <repo>'); process.exit(1) }
      const grants = await apiFetch('GET', `/api/users/access/${repo}`)
      if (!grants.length) { console.log('  No access grants.'); return }
      grants.forEach(g => console.log(`  ${g.npub.slice(0,20)}...  ${g.role}`))
      return
    }
  }

  // ── relay ─────────────────────────────────
  if (cmd === 'relay') {
    if (sub === 'status') {
      try {
        execSync('systemctl is-active egg-relay', { stdio: 'pipe' })
        console.log('  egg-relay   ✓ running')
      } catch { console.log('  egg-relay   ✗ stopped') }
      return
    }
    if (sub === 'logs') {
      execSync('journalctl -u egg-relay -f', { stdio: 'inherit' })
      return
    }
  }

  console.error(`  Unknown command: ${cmd}\n  Run 'egg-cli help' for usage.`)
  process.exit(1)
}

main().catch(err => { console.error(err.message); process.exit(1) })
