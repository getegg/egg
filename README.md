# 🥚 Event Git Graph (EGG)

> **A decentralized Git collaboration layer powered by Nostr**

---

## 🚀 Overview

**Event Git Graph (EGG)** is a decentralized infrastructure for software collaboration that combines:

- Git (version control)
- Nostr (identity and event distribution)
- Pegg (lightweight static hosting layer)

EGG reimagines platforms like GitHub by removing central servers and giving full control back to developers.

> **Your code. Your identity. Your infrastructure.**

---

## 🌍 Vision

EGG is not just a platform — it is a protocol-driven ecosystem.

Instead of relying on centralized services, each developer:

- Hosts their own repositories
- Owns their identity via cryptographic keys
- Publishes and interacts through distributed events

There is no central authority, no global database, and no single point of failure.

---

## 🧠 Core Concept: Code as Events

In EGG, every action becomes a signed event:

- Repository creation
- Commits
- Forks
- Issues
- Pull requests
- Permissions

These events are distributed through the Nostr network and form a **graph of software evolution**.

---

## 🏗️ Architecture

EGG is composed of three main layers:

### 1. 🗂️ Storage Layer (Pegg)

Repositories are hosted as static files on:

- GitHub Pages
- Personal servers
- Local environments

This layer is called **Pegg** — a decentralized, lightweight hosting system.

---

### 2. 🌐 Protocol Layer (Nostr)

Nostr provides:

- Identity (public/private keys)
- Authentication (signatures)
- Event distribution
- Social graph

Users do not create accounts — they use cryptographic keys.

---

### 3. 💻 Client Layer (EGG Client)

The EGG Client is the interface where users:

- Explore repositories
- Manage projects
- Contribute to code
- Interact with other developers

Anyone can build their own client.

---

## 👤 User Model

EGG replicates the full GitHub-like experience — without centralized accounts.

Each user has:

- Public profile (based on Nostr pubkey)
- Name, bio, links
- Repositories
- Contribution history
- Followers / following
- Activity feed

All data is:

- Signed by the user
- Distributed via Nostr
- Not stored in a central server

---

## 📦 Repositories

Repositories can be:

### 🌍 Public
- Open to everyone
- Discoverable via clients
- Forkable

### 🔒 Private
- Encrypted or access-restricted
- Shared with selected public keys
- Controlled by the owner

---

## 🔐 Permissions

Access control is managed through:

- Signed events
- Public key allowlists
- Local validation

This enables:

- Selective collaboration
- Delegated access
- Shared hosting environments

---

## 🍴 Forking & Collaboration

Forks are independent repositories linked to the original via events.

There is no central authority controlling merges or contributions.

Instead:

- Relationships are tracked via event references
- Collaboration is peer-to-peer
- History forms a distributed graph

---

## 🌐 Pegg (Decentralized Hosting)

**Pegg** is the hosting layer of EGG.

It works similarly to GitHub Pages, but:

- There is no central Pegg
- Anyone can run their own
- It is lightweight and static

Example:
egg.edgarpaula.org/
├── index.json
├── users/
│ └── pubkey/
│ ├── profile.json
│ └── repos/


---

## 🥚 Why "EGG"?

The name represents:

- Birth of new ideas
- Organic growth
- Decentralized creation

Each repository is a seed.  
Each fork is a new life.  
Each Pegg is a fertile environment.

---

## 🌱 Open Ecosystem

EGG is fully open and extensible.

Developers can:

- Build custom clients
- Create indexers and search engines
- Launch marketplaces
- Develop SaaS on top of Pegg

No permission required.

---

## 🛡️ Censorship Resistance

Because EGG is decentralized:

- Projects cannot be easily taken down
- Identities cannot be banned
- Data can be replicated across hosts

---

## ⚠️ Challenges

- UX complexity
- Event standardization
- Project discovery
- Moderation
- Sync performance

These are expected in decentralized systems and will evolve over time.

---

## 🔮 Future

EGG aims to become:

- A standard for decentralized code collaboration
- A Git-native social layer
- A censorship-resistant development network

---

## 📌 Philosophy

> **Don't trust the platform. Be the platform.**

---

## 🤝 Contributing

This project is open to all developers.

You can:

- Build clients
- Improve specs
- Experiment with Pegg
- Propose new event types

---

## 📜 License

MIT License

---

## 🧡 Final Thought

EGG is not trying to replace GitHub.

It is building something fundamentally different:

A world where developers are sovereign.

