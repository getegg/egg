# 🥚 EGG — Event Git Graph

> **The decentralized GitHub, native to Nostr.**
> Your server. Your code. Your identity.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Nostr](https://img.shields.io/badge/protocol-Nostr-purple)](https://nostr.com)
[![Status](https://img.shields.io/badge/status-alpha-orange)]()

---

**EGG** is a self-hosted Git forge that replaces GitHub/GitLab for open-source teams who want true ownership and decentralized collaboration.

Deploy it on your own domain (`egg.yourdomain.com`) and get:
- **Full Git hosting** — push, pull, branch, merge with standard git
- **Web client** — browse repos, diffs, history
- **Built-in Nostr relay** — all social interactions (issues, PRs, reviews) happen as signed Nostr events
- **Decentralized identity** — your `npub` is your username. No accounts, no email, no passwords.
- **Cross-instance collaboration** — developers on any EGG instance can interact with your repos through Nostr

```
egg.alice.com ──── nostr events ────► egg.bob.com
      │                                     │
   git repos                            git repos
   web client                           web client  
   nostr relay                          nostr relay
```

---

## Table of Contents

- [Architecture](#architecture)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Managing Repositories](#managing-repositories)
- [Access Control](#access-control)
- [Nostr Integration](#nostr-integration)
- [Updating](#updating)
- [Uninstalling](#uninstalling)
- [Contributing](#contributing)
- [Protocol Spec](#protocol-spec)
- [License](#license)

---

## Architecture

EGG separates two concerns:

| Layer | What it does | Where it lives |
|-------|-------------|----------------|
| **Git + Server** | Stores code, serves the web client | Your VPS / `egg.yourdomain.com` |
| **Nostr** | Issues, PRs, reviews, identity, access grants | Distributed relay network |

```
┌─────────────────────────────────┐
│        egg.yourdomain.com       │
│                                 │
│  ┌──────────┐  ┌─────────────┐ │
│  │ Git bare │  │  Web Client │ │
│  │  repos   │  │   (EGG UI)  │ │
│  └──────────┘  └─────────────┘ │
│  ┌──────────────────────────┐  │
│  │   Built-in Nostr Relay   │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
          │ Nostr events │
          ▼              ▼
   Other EGG        Any Nostr
   instances         clients
```

**Code lives on your server. Conversations live on Nostr.**

---

## Requirements

| Item | Minimum | Recommended |
|------|---------|-------------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| RAM | 512 MB | 1 GB |
| Disk | 10 GB | 40 GB |
| CPU | 1 vCPU | 2 vCPU |
| Domain | Required | Required |
| Node.js | 20.x | 22.x |
| Git | 2.34+ | Latest |

> **A domain is required.** EGG is designed to run at `egg.yourdomain.com`. Nostr identity and cross-instance discovery depend on a stable domain.

---

## Installation

### 1. Point your domain

Add a DNS `A` record for `egg.yourdomain.com` pointing to your server's IP.
Wait for DNS propagation before proceeding.

### 2. SSH into your server

```bash
ssh user@your-server-ip
```

### 3. Install dependencies

```bash
# Ubuntu / Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx certbot python3-certbot-nginx

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### 4. Clone EGG

```bash
git clone https://github.com/getegg/egg.git /opt/egg
cd /opt/egg
```

### 5. Run the installer

```bash
sudo ./scripts/install.sh
```

The installer will ask you:
- Your domain (`egg.yourdomain.com`)
- Your Nostr public key (`npub1...`) — this becomes the instance admin
- Whether the instance is public or invite-only
- Port for the built-in relay (default: `7777`)

It will automatically:
- Install Node.js dependencies
- Configure Nginx as reverse proxy
- Issue an SSL certificate via Let's Encrypt
- Create the git user and directories
- Start EGG as a systemd service
- Start the Nostr relay as a systemd service

### 6. Verify the installation

```bash
sudo systemctl status egg
sudo systemctl status egg-relay
```

Visit `https://egg.yourdomain.com` — you should see the EGG web client.

---

## Configuration

Configuration lives in `/opt/egg/config/egg.toml`:

```toml
[server]
domain    = "egg.yourdomain.com"
port      = 3000
admin_npub = "npub1..."          # Your Nostr public key

[git]
repos_path = "/var/egg/repos"    # Where bare repos are stored
ssh_port   = 22

[relay]
enabled  = true
port     = 7777
max_connections = 1000

[access]
# "public"  — anyone can register and push public repos
# "invite"  — only authorized npubs can create repos
mode = "public"

[tls]
enabled = true
cert = "/etc/letsencrypt/live/egg.yourdomain.com/fullchain.pem"
key  = "/etc/letsencrypt/live/egg.yourdomain.com/privkey.pem"
```

After changing config, restart EGG:

```bash
sudo systemctl restart egg
```

---

## Managing Repositories

### Create a repository

Via the web client at `https://egg.yourdomain.com`, or via CLI:

```bash
egg-cli repo create myproject --visibility public
```

### Push your first code

```bash
# In your local project
git init
git add .
git commit -m "first commit"

# Add your EGG instance as remote
git remote add origin git@egg.yourdomain.com:myproject.git

# Push
git push -u origin main
```

### Clone a repo from another EGG instance

```bash
git clone git@egg.bob.com:coolproject.git
```

### Clone via HTTPS (read-only for public repos)

```bash
git clone https://egg.yourdomain.com/myproject.git
```

---

## Access Control

Access is enforced by **two layers working together**:

- **Server layer** — controls who can push/pull via SSH keys or npub-auth
- **Nostr layer** — controls who can interact (issues, PRs, reviews) via signed events

### Public repository

Anyone can clone. Any `npub` can open issues and submit PRs as Nostr events.
You control who can merge via authorized collaborators.

### Private repository

Only authorized `npub`s can clone and interact.

### Grant access to a collaborator

```bash
egg-cli access grant \
  --repo myproject \
  --npub npub1collaborator... \
  --role contributor   # roles: viewer | contributor | maintainer | admin
```

This publishes a signed Nostr event granting access. The collaborator's EGG client or any Nostr client will see the invitation.

### Revoke access

```bash
egg-cli access revoke --repo myproject --npub npub1collaborator...
```

---

## Nostr Integration

EGG uses Nostr events for all social interactions. The built-in relay listens on port `7777` (configurable).

### Event kinds used by EGG

| Kind | Git concept | Description |
|------|------------|-------------|
| `30617` | Repository | Repo metadata: name, description, visibility, branch |
| `30618` | Commit / Patch | Code patch signed by author's keypair |
| `30619` | Pull Request | Proposed change referencing source/target events |
| `1621` | Issue | Bug report or feature request linked to a repo |
| `1622` | Comment | Threaded discussion on issues, PRs or code lines |
| `30620` | Release / Tag | Published release with changelog |
| `30621` | Access Grant | npub authorization event (encrypted for private repos) |

### Connect your Nostr client

Point any Nostr client to your relay:
```
wss://egg.yourdomain.com/relay
```

Issues and PR notifications will appear in your Nostr feed.

### Use a different relay

You can configure EGG to broadcast events to external relays in addition to the built-in one:

```toml
[relay]
broadcast_to = [
  "wss://relay.damus.io",
  "wss://nos.lol"
]
```

---

## Updating

```bash
cd /opt/egg
git pull origin main
npm install --production
sudo systemctl restart egg egg-relay
```

To check the current version:

```bash
egg-cli --version
```

---

## Uninstalling

```bash
sudo /opt/egg/scripts/uninstall.sh
```

This removes EGG services, Nginx config and the git user.
**Your repos in `/var/egg/repos` are NOT deleted automatically** — back them up or move them manually.

---

## Contributing

EGG is built in the open. Contributions are welcome.

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/egg.git
cd egg
npm install
cp config/egg.example.toml config/egg.toml   # edit as needed
npm run dev
```

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

For protocol discussions, open an issue with the `protocol` label or join the conversation on Nostr.

---

## Protocol Spec

The EGG event protocol is documented in [docs/PROTOCOL.md](docs/PROTOCOL.md).

We follow and extend [NIP-34](https://github.com/nostr-protocol/nips/blob/master/34.md) (Git stuff) from the Nostr protocol.

---

## License

[MIT](LICENSE) — Edgar Paula, 2025

---

**Links**

- 🌐 Website: [egg.edgarpaula.org](https://egg.edgarpaula.org)  
- 📦 Organization: [github.com/getegg](https://github.com/getegg)  
- 🟣 EGG on Nostr: [nosta.me/npub1xux7...](https://nosta.me/npub1xux7a76ad990n594q6kxn68gefh4zvyjmpa68wc2t7sml7ks7j7qxrhpc5)  
- 👤 Author: [edgarpaula.org](https://edgarpaula.org)
