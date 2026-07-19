#!/bin/bash
# Run ON THE SERVER after upload (ssh -p 65002 u769128625@92.113.18.31)

set -e
cd ~/domains/weeleaf.com/public_html/api || cd ~/public_html/api

if [ ! -f config.local.php ]; then
  cp config.local.php.example config.local.php
  echo ">>> Edit config.local.php now — set db_pass and install_key"
  echo ">>> Run: nano config.local.php"
  exit 1
fi

# Test API health
echo "Testing /api/health ..."
curl -s "https://weeleaf.com/api/health" || curl -s "http://localhost/api/health"
echo ""

# Run install (reads install_key from config — pass same key)
INSTALL_KEY=$(php -r '$c=require "config.local.php"; echo $c["install_key"];')
echo "Running install..."
curl -s -X POST "https://weeleaf.com/api/install.php" \
  -H "Content-Type: application/json" \
  -d "{\"install_key\":\"$INSTALL_KEY\"}"
echo ""

echo "Done. Open https://weeleaf.com/api/health and https://weeleaf.com"
