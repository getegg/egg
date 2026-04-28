#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  EGG — Updater
# ─────────────────────────────────────────────
set -euo pipefail

GREEN='\033[0;32m'; BOLD='\033[1m'; NC='\033[0m'
EGG_DIR="/opt/egg"

[[ $EUID -ne 0 ]] && { echo "Run as root."; exit 1; }

echo -e "${GREEN}${BOLD}Updating EGG...${NC}"

cd "$EGG_DIR"
git fetch origin
CURRENT=$(git rev-parse HEAD)
git pull origin main
NEW=$(git rev-parse HEAD)

if [[ "$CURRENT" == "$NEW" ]]; then
  echo "Already up to date."
  exit 0
fi

echo "Installing dependencies..."
npm install --production --silent

npm install -g "$EGG_DIR" --silent

echo "Restarting services..."
systemctl restart egg egg-relay

echo -e "${GREEN}${BOLD}EGG updated successfully! 🥚${NC}"
egg-cli --version
