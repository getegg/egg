#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  EGG — Event Git Graph
#  Installer script
#  https://github.com/getegg/egg
# ─────────────────────────────────────────────

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

EGG_DIR="/opt/egg"
EGG_DATA="/var/egg"
EGG_USER="egg"
NODE_MIN=20

log()     { echo -e "${GREEN}[EGG]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }
header()  { echo -e "\n${BLUE}${BOLD}── $* ──${NC}\n"; }

# ── Banner ──────────────────────────────────
echo -e "${BLUE}${BOLD}"
cat <<'EOF'
   _____ _____ _____ 
  |  ___|  __ \  ___|
  | |__ | |  \/ |  
  |  __|| | __| |  
  | |___| |_\ \ |___
  \____/ \____/\____/

  Event Git Graph
  Decentralized Git · Native Nostr
EOF
echo -e "${NC}"

# ── Root check ───────────────────────────────
[[ $EUID -ne 0 ]] && error "Run as root: sudo ./scripts/install.sh"

# ── OS check ─────────────────────────────────
if ! command -v apt-get &>/dev/null; then
  error "This installer requires a Debian/Ubuntu system."
fi

header "Collecting configuration"

# ── Prompt domain ────────────────────────────
read -rp "  Your EGG domain (e.g. egg.yourdomain.com): " EGG_DOMAIN
[[ -z "$EGG_DOMAIN" ]] && error "Domain is required."

# ── Prompt admin npub ────────────────────────
read -rp "  Your Nostr public key (npub1...): " ADMIN_NPUB
[[ -z "$ADMIN_NPUB" ]] && error "Admin npub is required."
[[ "$ADMIN_NPUB" != npub1* ]] && error "npub must start with 'npub1'"

# ── Prompt access mode ───────────────────────
echo ""
echo "  Access mode:"
echo "    [1] public  — anyone can register"
echo "    [2] invite  — only authorized npubs can create repos"
read -rp "  Choose [1/2] (default: 1): " ACCESS_CHOICE
ACCESS_MODE="public"
[[ "$ACCESS_CHOICE" == "2" ]] && ACCESS_MODE="invite"

# ── Prompt relay port ────────────────────────
read -rp "  Nostr relay port (default: 7777): " RELAY_PORT
RELAY_PORT="${RELAY_PORT:-7777}"

# ── Confirm ──────────────────────────────────
echo ""
echo -e "${BOLD}  Summary:${NC}"
echo "    Domain:      $EGG_DOMAIN"
echo "    Admin npub:  $ADMIN_NPUB"
echo "    Access mode: $ACCESS_MODE"
echo "    Relay port:  $RELAY_PORT"
echo ""
read -rp "  Proceed? [y/N]: " CONFIRM
[[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]] && { echo "Aborted."; exit 0; }

# ── Dependencies ─────────────────────────────
header "Installing dependencies"

apt-get update -qq
apt-get install -y -qq \
  git curl nginx certbot python3-certbot-nginx \
  ufw build-essential

# Node.js
if ! command -v node &>/dev/null || \
   [[ $(node -e "process.exit(parseInt(process.version.slice(1)) >= $NODE_MIN ? 0 : 1)" 2>/dev/null; echo $?) -ne 0 ]]; then
  log "Installing Node.js $NODE_MIN.x..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_MIN}.x | bash - >/dev/null 2>&1
  apt-get install -y -qq nodejs
fi

log "Node.js $(node -v) ✓"
log "npm $(npm -v) ✓"
log "git $(git --version | cut -d' ' -f3) ✓"

# ── Create system user ───────────────────────
header "Setting up EGG user and directories"

if ! id "$EGG_USER" &>/dev/null; then
  useradd --system --create-home --shell /bin/bash "$EGG_USER"
  log "Created system user '$EGG_USER'"
fi

mkdir -p "$EGG_DATA/repos"
mkdir -p "$EGG_DATA/data"
mkdir -p "$EGG_DATA/logs"
chown -R "$EGG_USER:$EGG_USER" "$EGG_DATA"

# SSH authorized_keys for git
EGG_HOME=$(getent passwd "$EGG_USER" | cut -d: -f6)
mkdir -p "$EGG_HOME/.ssh"
touch "$EGG_HOME/.ssh/authorized_keys"
chmod 700 "$EGG_HOME/.ssh"
chmod 600 "$EGG_HOME/.ssh/authorized_keys"
chown -R "$EGG_USER:$EGG_USER" "$EGG_HOME/.ssh"
log "SSH directory ready ✓"

# ── npm install ──────────────────────────────
header "Installing EGG application"

cd "$EGG_DIR"
npm install --production --silent
log "Node.js dependencies installed ✓"

# ── Write config ─────────────────────────────
header "Writing configuration"

cat > "$EGG_DIR/config/egg.toml" <<EOF
[server]
domain    = "$EGG_DOMAIN"
port      = 3000
admin_npub = "$ADMIN_NPUB"

[git]
repos_path = "$EGG_DATA/repos"
ssh_port   = 22
git_user   = "$EGG_USER"

[relay]
enabled         = true
port            = $RELAY_PORT
max_connections = 1000
broadcast_to    = []

[access]
mode = "$ACCESS_MODE"

[tls]
enabled = true
cert = "/etc/letsencrypt/live/$EGG_DOMAIN/fullchain.pem"
key  = "/etc/letsencrypt/live/$EGG_DOMAIN/privkey.pem"

[logging]
level = "info"
path  = "$EGG_DATA/logs/egg.log"
EOF

chown "$EGG_USER:$EGG_USER" "$EGG_DIR/config/egg.toml"
log "Config written to $EGG_DIR/config/egg.toml ✓"

# ── Nginx config ─────────────────────────────
header "Configuring Nginx"

cat > "/etc/nginx/sites-available/egg" <<EOF
server {
    listen 80;
    server_name $EGG_DOMAIN;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
    }

    location /relay {
        proxy_pass          http://127.0.0.1:$RELAY_PORT;
        proxy_http_version  1.1;
        proxy_set_header    Upgrade \$http_upgrade;
        proxy_set_header    Connection "upgrade";
        proxy_set_header    Host \$host;
        proxy_read_timeout  86400;
    }
}
EOF

ln -sf /etc/nginx/sites-available/egg /etc/nginx/sites-enabled/egg
nginx -t && systemctl reload nginx
log "Nginx configured ✓"

# ── SSL certificate ──────────────────────────
header "Issuing SSL certificate"

certbot --nginx \
  -d "$EGG_DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email "admin@$EGG_DOMAIN" \
  --redirect

log "SSL certificate issued ✓"

# ── systemd services ─────────────────────────
header "Creating systemd services"

# EGG main service
cat > /etc/systemd/system/egg.service <<EOF
[Unit]
Description=EGG — Event Git Graph
After=network.target

[Service]
Type=simple
User=$EGG_USER
WorkingDirectory=$EGG_DIR
ExecStart=/usr/bin/node $EGG_DIR/server/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=EGG_CONFIG=$EGG_DIR/config/egg.toml
StandardOutput=append:$EGG_DATA/logs/egg.log
StandardError=append:$EGG_DATA/logs/egg-error.log

[Install]
WantedBy=multi-user.target
EOF

# EGG relay service
cat > /etc/systemd/system/egg-relay.service <<EOF
[Unit]
Description=EGG — Built-in Nostr Relay
After=network.target

[Service]
Type=simple
User=$EGG_USER
WorkingDirectory=$EGG_DIR
ExecStart=/usr/bin/node $EGG_DIR/relay/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=EGG_CONFIG=$EGG_DIR/config/egg.toml
StandardOutput=append:$EGG_DATA/logs/relay.log
StandardError=append:$EGG_DATA/logs/relay-error.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable egg egg-relay
systemctl start egg egg-relay
log "Services started ✓"

# ── Firewall ─────────────────────────────────
header "Configuring firewall"

ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow "$RELAY_PORT/tcp"
log "Firewall configured ✓"

# ── Install egg-cli ──────────────────────────
header "Installing egg-cli"

npm install -g "$EGG_DIR" --silent
log "egg-cli installed globally ✓"

# ── Done ─────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  EGG installed successfully! 🥚${NC}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${BOLD}Web client:${NC}   https://$EGG_DOMAIN"
echo -e "  ${BOLD}Nostr relay:${NC}  wss://$EGG_DOMAIN/relay"
echo -e "  ${BOLD}Admin npub:${NC}   $ADMIN_NPUB"
echo -e "  ${BOLD}Config:${NC}       $EGG_DIR/config/egg.toml"
echo -e "  ${BOLD}Repos:${NC}        $EGG_DATA/repos"
echo -e "  ${BOLD}Logs:${NC}         $EGG_DATA/logs/"
echo ""
echo -e "  ${BOLD}Next step — add your SSH key:${NC}"
echo -e "  cat ~/.ssh/id_rsa.pub | sudo tee -a /home/$EGG_USER/.ssh/authorized_keys"
echo ""
echo -e "  ${BOLD}Then push your first repo:${NC}"
echo -e "  git remote add egg git@$EGG_DOMAIN:myproject.git"
echo -e "  git push -u egg main"
echo ""
echo -e "  ${BOLD}Docs:${NC} https://github.com/getegg/egg"
echo ""
