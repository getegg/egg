# Self-Hosting EGG

This guide covers everything you need to run your own EGG instance from a fresh VPS to a production-ready forge at `egg.yourdomain.com`.

---

## Choosing a Server

Any Linux VPS works. Recommended providers:

| Provider | Entry plan | Notes |
|----------|-----------|-------|
| Hetzner | CX11 (~€4/mo) | Excellent price/performance |
| DigitalOcean | Basic Droplet (~$6/mo) | Easy setup |
| Vultr | Cloud Compute (~$6/mo) | Good global coverage |
| Contabo | VPS S (~€5/mo) | High storage |
| Your own hardware | — | Full sovereignty |

**Minimum:** 512 MB RAM, 1 vCPU, 10 GB disk, Ubuntu 22.04+

---

## DNS Setup

Create an `A` record in your DNS provider:

```
Type:  A
Name:  egg           (or @ for root domain)
Value: <your-server-IP>
TTL:   300
```

This creates `egg.yourdomain.com`. Wait 5–60 minutes for propagation.

Test with:
```bash
dig egg.yourdomain.com
```

---

## Quick Install

```bash
ssh root@your-server-ip
git clone https://github.com/getegg/egg.git /opt/egg
cd /opt/egg
sudo ./scripts/install.sh
```

---

## Manual Install (step by step)

If you prefer to understand each step:

### 1. System updates

```bash
apt update && apt upgrade -y
```

### 2. Install dependencies

```bash
apt install -y git curl nginx certbot python3-certbot-nginx ufw build-essential

# Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
```

### 3. Create the egg system user

```bash
useradd --system --create-home --shell /bin/bash egg
mkdir -p /var/egg/repos /var/egg/data /var/egg/logs
chown -R egg:egg /var/egg
```

### 4. Clone and configure EGG

```bash
git clone https://github.com/getegg/egg.git /opt/egg
cd /opt/egg
npm install --production
cp config/egg.example.toml config/egg.toml
nano config/egg.toml   # edit domain, admin_npub, etc.
chown egg:egg config/egg.toml
```

### 5. Configure Nginx

```bash
cat > /etc/nginx/sites-available/egg << 'EOF'
server {
    listen 80;
    server_name egg.yourdomain.com;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    location /relay {
        proxy_pass         http://127.0.0.1:7777;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_read_timeout 86400;
    }
}
EOF

ln -s /etc/nginx/sites-available/egg /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 6. Issue SSL certificate

```bash
certbot --nginx -d egg.yourdomain.com --non-interactive \
  --agree-tos --email admin@yourdomain.com --redirect
```

### 7. Create systemd services

```bash
# EGG server
cat > /etc/systemd/system/egg.service << 'EOF'
[Unit]
Description=EGG — Event Git Graph
After=network.target

[Service]
Type=simple
User=egg
WorkingDirectory=/opt/egg
ExecStart=/usr/bin/node /opt/egg/server/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=EGG_CONFIG=/opt/egg/config/egg.toml

[Install]
WantedBy=multi-user.target
EOF

# Nostr relay
cat > /etc/systemd/system/egg-relay.service << 'EOF'
[Unit]
Description=EGG — Built-in Nostr Relay
After=network.target

[Service]
Type=simple
User=egg
WorkingDirectory=/opt/egg
ExecStart=/usr/bin/node /opt/egg/relay/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=EGG_CONFIG=/opt/egg/config/egg.toml

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable egg egg-relay
systemctl start egg egg-relay
```

### 8. Add your SSH public key

```bash
cat ~/.ssh/id_rsa.pub >> /home/egg/.ssh/authorized_keys
# or
cat ~/.ssh/id_ed25519.pub >> /home/egg/.ssh/authorized_keys
```

---

## Pushing Your First Repository

```bash
# On your local machine
cd your-project
git remote add egg git@egg.yourdomain.com:your-project.git
git push -u egg main
```

Visit `https://egg.yourdomain.com` to see your repo.

---

## Firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 7777/tcp  # Nostr relay (WebSocket)
ufw --force enable
```

---

## Backups

Back up the repos directory and config:

```bash
# Repos
tar czf egg-repos-$(date +%Y%m%d).tar.gz /var/egg/repos

# Config
cp /opt/egg/config/egg.toml ~/egg-config-backup.toml
```

Automate with cron:
```bash
crontab -e
# Add: 0 3 * * * tar czf /root/backups/egg-$(date +\%Y\%m\%d).tar.gz /var/egg/repos
```

---

## Troubleshooting

### Services not starting

```bash
journalctl -u egg -n 50
journalctl -u egg-relay -n 50
```

### Port already in use

```bash
lsof -i :3000
lsof -i :7777
```

### SSL certificate not renewing

```bash
certbot renew --dry-run
systemctl status certbot.timer
```

### Relay not accepting connections

Make sure Nginx is proxying `/relay` correctly:
```bash
curl -v -H "Upgrade: websocket" https://egg.yourdomain.com/relay
```

---

## Upgrading

```bash
sudo /opt/egg/scripts/update.sh
```
