# Contributing to EGG

Thank you for your interest in contributing! EGG is built in the open, by the community.

## Ways to contribute

- **Code** — fix bugs, implement roadmap features, improve performance
- **Protocol** — discuss and refine the event kinds spec in [docs/PROTOCOL.md](docs/PROTOCOL.md)
- **Docs** — improve installation guides, add examples, fix typos
- **Testing** — run EGG on different setups and report issues
- **Nostr** — share the project on Nostr and help build community

## Development setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/egg.git
cd egg

# Install dependencies
npm install

# Copy and edit config
cp config/egg.example.toml config/egg.toml

# Run in development mode (auto-restart on changes)
npm run dev

# Run the relay separately
npm run relay
```

EGG server runs on `http://localhost:3000`  
Relay runs on `ws://localhost:7777`

## Pull request process

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Test locally
5. Commit with a clear message: `git commit -m "feat: add SSH key management"`
6. Push and open a PR against `main`

## Commit message format

```
type: short description

feat:     new feature
fix:      bug fix
docs:     documentation only
refactor: code change without fix/feature
test:     adding tests
chore:    build process, dependencies
```

## Reporting issues

Open an issue with:
- EGG version (`egg-cli --version`)
- OS and Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs (`journalctl -u egg -n 50`)

## Protocol changes

Changes to event kinds or tag structures must be discussed in a GitHub Issue with the `protocol` label before implementation. Breaking protocol changes require a major version bump.

## Code style

- Node.js, `'use strict'`, CommonJS modules
- 2-space indentation
- Descriptive variable names — no abbreviations in public APIs
- Comment non-obvious logic

## License

By contributing, you agree your contributions are licensed under [MIT](LICENSE).
