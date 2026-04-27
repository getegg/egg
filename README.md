# 🥚 Event Git Graph (EGG)

<p align="center">
  <img src="https://img.shields.io/badge/status-experimental-orange" />
  <img src="https://img.shields.io/badge/protocol-nostr-purple" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
  <img src="https://img.shields.io/badge/decentralized-true-blue" />
  <img src="https://img.shields.io/badge/self--hosted-yes-lightgrey" />
</p>

<p align="center">
  <strong>A decentralized Git collaboration layer powered by events.</strong><br/>
  <em>Your code. Your identity. Your infrastructure.</em>
</p>

---

## 🚀 Overview

**Event Git Graph (EGG)** is a decentralized infrastructure for software development and collaboration.

It combines:

- **Git** → distributed version control  
- **Nostr** → identity and event distribution  
- **Pegg** → lightweight static hosting layer  

EGG reimagines platforms like GitHub by removing central servers and replacing them with a **protocol-driven ecosystem**.

Instead of relying on a single platform, each developer becomes their own platform.

---

## 🌍 Vision

Modern development depends on centralized services. While Git is distributed, collaboration is not.

EGG changes that.

> There is no central server.  
> There is no global database.  
> There is no authority controlling access.

Each developer:

- Hosts their own repositories  
- Owns their identity (via cryptographic keys)  
- Publishes and consumes events in a distributed network  

---

## 🧠 Core Concept: Code as Events

EGG introduces a new paradigm:

> **All development actions are events.**

These include:

- Repository creation  
- Commits (references)  
- Forks  
- Issues  
- Pull requests  
- Permissions  

Each event is:

- Cryptographically signed  
- Distributed through relays  
- Independently verifiable  

Together, they form a **graph of software evolution** — the *Event Git Graph*.

---

## 🏗️ Architecture

EGG is composed of three layers:

---

### 🗂️ 1. Storage Layer — *Pegg*

Repositories are hosted as static content:

- GitHub Pages  
- Personal servers  
- Local environments  

This layer is called **Pegg**.

#### What is Pegg?

Pegg is:

- A static hosting structure  
- A repository index  
- A publishing environment  

It is:

- Lightweight  
- Serverless  
- Replicable  
- Fully independent  

There is **no central Pegg**.

Anyone can run their own.

---

### 🌐 2. Protocol Layer — *Nostr*

EGG uses Nostr for:

- Identity (public/private keys)  
- Authentication (signatures)  
- Event propagation  
- Social relationships  

Users do not create accounts.

They use keys.

---

### 💻 3. Client Layer — *EGG Client*

The client is the interface layer.

It enables users to:

- Browse repositories  
- Manage projects  
- Contribute code  
- Publish events  

There is no official mandatory client.

Anyone can build their own.

---

## 👤 User Model

EGG replicates a full GitHub-like experience — without centralized accounts.

Each user has:

- Public profile (derived from pubkey)  
- Name, bio, avatar, links  
- Repository list  
- Contribution history  
- Followers / following  
- Activity timeline  

All data is:

- Signed by the user  
- Distributed via Nostr  
- Stored in a decentralized manner  

---

## 📦 Repositories

Repositories are independently hosted and referenced.

### 🌍 Public Repositories

- Open to anyone  
- Discoverable via clients  
- Forkable without permission  

### 🔒 Private Repositories

- Access restricted by public keys  
- Optional encryption  
- Shared selectively  

---

## 🔐 Permissions

Permissions are not server-based.

They are defined by:

- Signed events  
- Public key lists  
- Local validation logic  

This enables:

- Fine-grained control  
- Delegated access  
- Shared hosting environments  

Example:

A user may allow others to publish repositories inside their Pegg.

---

## 🍴 Forking & Collaboration

Forks are independent.

They:

- Reference original repositories  
- Exist in separate hosting environments  
- Are linked through events  

There is no central merge authority.

Collaboration is:

- Peer-to-peer  
- Event-driven  
- Graph-based  

---

## 🌐 Pegg Structure Example
/egg
index.json
users/
<pubkey>/
profile.json
repos/
project-a/
project-b/


---

## 🥚 Meaning of EGG

The name **EGG** represents:

- Birth of ideas  
- Organic growth  
- Decentralized creation  

Each repository is a seed.  
Each fork is a mutation.  
Each Pegg is an ecosystem.  

---

## 🌱 Open Ecosystem

EGG is not a closed product.

It is an open protocol and infrastructure.

Developers can:

- Build custom clients  
- Create indexing services  
- Develop marketplaces  
- Offer hosted Pegg environments  
- Extend the protocol  

No permission required.

---

## 🛡️ Censorship Resistance

Because EGG is decentralized:

- Projects cannot be globally removed  
- Identities cannot be banned  
- Data can be mirrored  

The system is resilient by design.

---

## ⚠️ Challenges

EGG acknowledges:

- UX complexity  
- Event standardization  
- Discoverability  
- Moderation  
- Synchronization  

These are part of the evolution of decentralized systems.

---

## 🔮 Roadmap

### Phase 1
- Protocol definition  
- Static Pegg structure  
- Basic repository listing  

### Phase 2
- Nostr login integration  
- Event publishing  
- Basic client interface  

### Phase 3
- Full GitHub-like UI  
- Forks, issues, PRs  
- Multi-user Pegg support  

### Phase 4
- Ecosystem tools  
- Search/indexing  
- Plugin architecture  

Perfeito — aqui está **toda a parte que você colou, corrigida e totalmente formatada em um único bloco de código** 👇

````markdown id="egg-full-fix"
---

## 📦 Example Repository Index

```json
[
  {
    "name": "my-project",
    "url": "/repos/my-project",
    "visibility": "public"
  }
]
````

---

## 🔌 Example Event (Repository)

```json
{
  "kind": 30001,
  "content": {
    "name": "my-project",
    "description": "Example project",
    "url": "https://example.com/repos/my-project",
    "visibility": "public"
  }
}
```

---

## 📌 Philosophy

> Don't trust the platform. Be the platform.

EGG transforms:

* Platforms → Protocols
* Accounts → Keys
* Servers → Networks

---

## 🤝 Contributing

We welcome all contributors.

You can:

* Build a client
* Propose protocol improvements
* Create Pegg instances
* Experiment freely

---

## 📜 License

MIT License

---

## 🧡 Final Thought

EGG is not trying to replace existing platforms.

It is building something fundamentally different:

> A world where developers are sovereign.

Where code is free, identity is owned, and collaboration is truly decentralized.

---

<p align="center">
  <strong>🥚 Let ideas hatch.</strong>
</p>
```
