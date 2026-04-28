# Changelog

All notable changes to EGG are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased]

### Planned
- SQLite persistence for events and access grants
- NIP-44 encryption for private repository events
- Web client (React/Svelte frontend)
- Git CLI plugin (`git egg push`, `git egg pr`)
- Cross-instance pull request discovery
- CI/CD event hooks

---

## [0.1.0] — 2025 (alpha)

### Added
- Git repository hosting (bare repos via SSH and HTTPS)
- Built-in Nostr relay (NIPs 1, 9, 11, 34)
- EGG event protocol v0.1 (kinds 30617–30621, 1621–1622)
- `scripts/install.sh` — automated installer for Ubuntu
- `scripts/update.sh` — one-command updater
- `scripts/uninstall.sh` — clean removal
- `egg-cli` command-line tool
- Nostr keypair (npub) based authentication (NIP-98)
- Repository access control (viewer/contributor/maintainer/admin)
- REST API: repos, auth, events, users
- Configuration via `config/egg.toml`
- systemd service definitions for `egg` and `egg-relay`
- Nginx + Let's Encrypt TLS setup via installer

### Protocol
- `kind:30617` — Repository metadata
- `kind:30618` — Commit / Patch
- `kind:30619` — Pull Request
- `kind:30620` — Release / Tag
- `kind:30621` — Access Grant
- `kind:1621` — Issue
- `kind:1622` — Comment / Review
