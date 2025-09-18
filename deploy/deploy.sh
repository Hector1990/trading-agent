#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST=${REMOTE_HOST:-"124.223.193.139"}
REMOTE_USER=${REMOTE_USER:-"ubuntu"}
SSH_KEY=${SSH_KEY:-"/Users/hector/Code/tencent/cursor.pem"}
REMOTE_DIR=${REMOTE_DIR:-"/opt/tradingagents"}

echo "[+] Packaging project..."
PROJECT_ROOT=$(cd "$(dirname "$0")"/.. && pwd)
cd "$PROJECT_ROOT"

TAR_FILE="tradingagents_$(date +%Y%m%d%H%M%S).tar.gz"
tar --exclude-vcs -czf "$TAR_FILE" .

echo "[+] Uploading to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "sudo mkdir -p ${REMOTE_DIR} && sudo chown -R \$USER:\$USER ${REMOTE_DIR}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$TAR_FILE" ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

echo "[+] Bootstrapping remote docker..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "bash -s" < deploy/remote_bootstrap.sh

echo "[+] Unpacking and starting containers..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} bash -lc "\
  set -euo pipefail; \
  mkdir -p ${REMOTE_DIR}; \
  tar -xzf /tmp/${TAR_FILE} -C ${REMOTE_DIR}; \
  cd ${REMOTE_DIR}; \
  cp -n .env.example .env || true; \
  docker compose build --no-cache; \
  docker compose up -d; \
  docker compose ps; \
  curl -fsS http://localhost/health || true \
"

echo "[+] Deployed. Visit: http://${REMOTE_HOST}/"

