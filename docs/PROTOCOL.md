# EGG Protocol Specification

> **EGG — Event Git Graph**
> Nostr-native decentralized Git forge protocol

This document defines the Nostr event kinds and tag structures used by EGG. It extends [NIP-34](https://github.com/nostr-protocol/nips/blob/master/34.md).

---

## Overview

EGG maps every Git and collaboration concept to a Nostr event:

```
Git concept        Nostr event kind
──────────────     ────────────────
Repository    →    kind:30617
Commit/Patch  →    kind:30618
Pull Request  →    kind:30619
Release/Tag   →    kind:30620
Access Grant  →    kind:30621
Issue         →    kind:1621
Comment       →    kind:1622
```

All events are signed by the author's Nostr keypair. The `pubkey` field is the author's identity — no separate username or email is required.

---

## Event Kinds

### kind:30617 — Repository

Describes a Git repository hosted on an EGG instance.

```jsonc
{
  "kind": 30617,
  "pubkey": "<owner npub hex>",
  "created_at": 1700000000,
  "tags": [
    ["d", "myproject"],                           // repo identifier (unique per pubkey)
    ["name", "myproject"],                        // display name
    ["description", "A cool project"],
    ["web", "https://egg.owner.com/myproject"],   // web URL
    ["clone", "https://egg.owner.com/myproject.git"],
    ["clone", "git@egg.owner.com:myproject.git"],
    ["r", "main"],                                // default branch
    ["visibility", "public"],                     // "public" | "private"
    ["t", "nostr"],                               // topics/tags
    ["t", "git"]
  ],
  "content": "Long description or README excerpt.",
  "sig": "..."
}
```

The `d` tag combined with the `pubkey` forms the unique repo address: `30617:<pubkey>:myproject`

---

### kind:30618 — Commit / Patch

Represents a Git commit or patch set.

```jsonc
{
  "kind": 30618,
  "pubkey": "<author npub hex>",
  "created_at": 1700000001,
  "tags": [
    ["d", "<commit-sha>"],
    ["a", "30617:<owner-pubkey>:myproject", "wss://egg.owner.com/relay"],  // repo ref
    ["r", "main"],           // branch
    ["parent", "<parent-sha>"],
    ["message", "Fix null pointer in auth handler"]
  ],
  "content": "<patch diff content>",
  "sig": "..."
}
```

---

### kind:30619 — Pull Request

Proposes merging changes from a source branch/repo into a target.

```jsonc
{
  "kind": 30619,
  "pubkey": "<author npub hex>",
  "created_at": 1700000002,
  "tags": [
    ["d", "<uuid>"],
    ["a", "30617:<owner-pubkey>:myproject"],     // target repo
    ["title", "Add WebSocket support"],
    ["target-branch", "main"],
    ["source-branch", "feat/websocket"],
    ["source-repo", "30617:<fork-pubkey>:myproject-fork"],
    ["status", "open"],                           // "open" | "merged" | "closed"
    ["r", "<latest-commit-sha>"]
  ],
  "content": "This PR adds WebSocket support for real-time relay connections.",
  "sig": "..."
}
```

---

### kind:30620 — Release / Tag

Marks a versioned release of a repository.

```jsonc
{
  "kind": 30620,
  "pubkey": "<author npub hex>",
  "created_at": 1700000003,
  "tags": [
    ["d", "v0.1.0"],
    ["a", "30617:<owner-pubkey>:myproject"],
    ["r", "<commit-sha>"],
    ["title", "v0.1.0 — Initial release"]
  ],
  "content": "## Changelog\n\n- Initial public release\n- Git hosting + Nostr relay",
  "sig": "..."
}
```

---

### kind:30621 — Access Grant

Grants or revokes repository access for a specific npub.

```jsonc
{
  "kind": 30621,
  "pubkey": "<admin npub hex>",
  "created_at": 1700000004,
  "tags": [
    ["d", "<uuid>"],
    ["a", "30617:<owner-pubkey>:myproject"],
    ["p", "<grantee-npub-hex>"],
    ["role", "contributor"],                     // "viewer" | "contributor" | "maintainer" | "admin"
    ["action", "grant"]                          // "grant" | "revoke"
  ],
  "content": "",
  "sig": "..."
}
```

For private repos, this event may be encrypted (NIP-44) so only the grantee can read it.

---

### kind:1621 — Issue

A bug report or feature request linked to a repository.

```jsonc
{
  "kind": 1621,
  "pubkey": "<author npub hex>",
  "created_at": 1700000005,
  "tags": [
    ["a", "30617:<owner-pubkey>:myproject"],
    ["subject", "Relay crashes on malformed events"],
    ["label", "bug"],
    ["label", "relay"],
    ["status", "open"]                           // "open" | "closed"
  ],
  "content": "When sending an event without the `sig` field, the relay crashes with...",
  "sig": "..."
}
```

---

### kind:1622 — Comment / Review

A threaded comment on an issue, PR, or specific commit line.

```jsonc
{
  "kind": 1622,
  "pubkey": "<author npub hex>",
  "created_at": 1700000006,
  "tags": [
    ["e", "<issue-or-pr-event-id>", "", "reply"],  // parent event
    ["a", "30617:<owner-pubkey>:myproject"],
    ["r", "<commit-sha>"],                          // optional: links to a commit
    ["line", "42"]                                  // optional: inline code comment
  ],
  "content": "Reproduced on v0.1.0. The issue is in `relay/index.js` line 42.",
  "sig": "..."
}
```

---

## Cross-instance Interaction

EGG instances discover each other through Nostr relay references in event tags.

When a developer on `egg.bob.com` wants to contribute to a repo at `egg.alice.com`:

1. They fetch the repo's `kind:30617` event from `alice.com`'s relay.
2. They push their fork to their own instance (`egg.bob.com`).
3. They publish a `kind:30619` PR event to their relay, referencing the target repo.
4. `alice.com`'s relay subscribes to PRs targeting its repos and receives the event.
5. Alice sees the PR in her EGG web client.

No central coordination required.

---

## NIP Compliance

| NIP | Description | Status |
|-----|-------------|--------|
| NIP-01 | Basic protocol | ✅ Required |
| NIP-09 | Event deletion | ✅ Supported |
| NIP-11 | Relay info document | ✅ Supported |
| NIP-34 | Git stuff | ✅ Extended |
| NIP-44 | Encrypted payloads | 🚧 Planned (private repos) |
| NIP-98 | HTTP Auth | ✅ Used for web client login |

---

## Versioning

This spec follows the EGG version. Breaking changes will bump the major version.

Current: **v0.1 (alpha)**
