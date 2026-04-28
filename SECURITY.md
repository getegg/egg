# Security Policy

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report security issues privately via Nostr DM to:

- **Edgar Paula** — [npub1gx95nc7f4yslxwqg8u84jt9zqcsg80lsecl0ld2zyesx4qpevf9sd2ph6j](https://nosta.me/npub1gx95nc7f4yslxwqg8u84jt9zqcsg80lsecl0ld2zyesx4qpevf9sd2ph6j)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Your suggested fix (optional)

We aim to respond within 72 hours and release a patch within 14 days for critical issues.

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.x (current) | ✅ Yes |

## Security considerations for self-hosters

- Always run EGG behind Nginx with TLS (handled by the installer)
- Keep your `npub`/`nsec` secure — it is your admin identity
- Regularly update: `sudo /opt/egg/scripts/update.sh`
- Private repos use Nostr event encryption (NIP-44) — planned for v0.2
- Keep Node.js updated: `apt upgrade nodejs`
