#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  EGG — Uninstaller
# ─────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; BOLD='\033[1m'; NC='\033[0m'

[[ $EUID -ne 0 ]] && { echo -e "${RED}Run as root.${NC}"; exit 1; }

echo -e "${YELLOW}${BOLD}This will remove EGG services, Nginx config and the egg system user.${NC}"
echo -e "${YELLOW}Your repositories in /var/egg/repos will NOT be deleted.${NC}"
echo ""
read -rp "Type 'yes' to confirm: " CONFIRM
[[ "$CONFIRM" != "yes" ]] && { echo "Aborted."; exit 0; }

echo -e "${RED}Stopping services...${NC}"
systemctl stop egg egg-relay 2>/dev/null || true
systemctl disable egg egg-relay 2>/dev/null || true
rm -f /etc/systemd/system/egg.service /etc/systemd/system/egg-relay.service
systemctl daemon-reload

echo -e "${RED}Removing Nginx config...${NC}"
rm -f /etc/nginx/sites-enabled/egg /etc/nginx/sites-available/egg
nginx -t && systemctl reload nginx

echo -e "${RED}Removing egg-cli...${NC}"
npm uninstall -g egg 2>/dev/null || true

echo -e "${RED}Removing egg system user...${NC}"
userdel -r egg 2>/dev/null || true

echo ""
echo -e "${GREEN}EGG uninstalled.${NC}"
echo -e "Your repos are still at ${BOLD}/var/egg/repos${NC} — move or delete them manually."
