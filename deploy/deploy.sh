#!/usr/bin/env bash
# Deploy the repository to a remote host using Docker Compose.
#
# Required environment variables:
#   REMOTE_HOST   Target host/IP (e.g. 124.223.193.139)
#   REMOTE_USER   SSH user on the remote host (e.g. ubuntu)
#   SSH_KEY       Path to a private key with access to the remote host
#
# Optional overrides:
#   REMOTE_DIR         Target directory on the remote server (default: /opt/tradingagents)
#   REMOTE_PORT        SSH port (default: 22)
#   REMOTE_HEALTHCHECK URL curl'ed after deployment (default: http://localhost/health)
#   SKIP_BOOTSTRAP     Set to 1 to skip running deploy/remote_bootstrap.sh
#
# The script packages the repository, uploads it to the remote server, runs the
# bootstrap script (installs Docker & compose if needed), and then performs a
# `docker compose up -d` inside the target directory.

set -euo pipefail

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Environment variable $name is required" >&2
    exit 1
  fi
}

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "File not found: $path" >&2
    exit 1
  fi
}

require_env "REMOTE_HOST"
require_env "REMOTE_USER"
require_env "SSH_KEY"

require_file "$SSH_KEY"

REMOTE_DIR=${REMOTE_DIR:-/opt/tradingagents}
REMOTE_PORT=${REMOTE_PORT:-22}
REMOTE_HEALTHCHECK=${REMOTE_HEALTHCHECK:-http://localhost/health}
SKIP_BOOTSTRAP=${SKIP_BOOTSTRAP:-0}
DEEPSEEK_API_KEY_VALUE=${DEEPSEEK_API_KEY_VALUE:-"sk-e1a7819fc7c543c59ea989063340981a"}

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

echo "[deploy] Packaging repository from $PROJECT_ROOT"
ARCHIVE=$(mktemp -t tradingagents.XXXXXX.tar.gz)
trap 'rm -f "$ARCHIVE"' EXIT

(cd "$PROJECT_ROOT" && tar --exclude-vcs -czf "$ARCHIVE" .)
ARCHIVE_NAME=$(basename "$ARCHIVE")

SSH_OPTIONS=(
  -i "$SSH_KEY"
  -p "$REMOTE_PORT"
  -o StrictHostKeyChecking=no
  -o UserKnownHostsFile=/dev/null
)

SCP_OPTIONS=(
  -i "$SSH_KEY"
  -P "$REMOTE_PORT"
  -o StrictHostKeyChecking=no
  -o UserKnownHostsFile=/dev/null
)

SSH_TARGET="${REMOTE_USER}@${REMOTE_HOST}"

echo "[deploy] Ensuring remote directory $REMOTE_DIR exists"
ssh "${SSH_OPTIONS[@]}" "$SSH_TARGET" "sudo mkdir -p '$REMOTE_DIR' && sudo chown -R \$USER:\$USER '$REMOTE_DIR'"

echo "[deploy] Uploading archive ($ARCHIVE_NAME)"
scp "${SCP_OPTIONS[@]}" "$ARCHIVE" "$SSH_TARGET:/tmp/$ARCHIVE_NAME"

if [[ "$SKIP_BOOTSTRAP" != "1" ]]; then
  echo "[deploy] Running remote bootstrap"
  ssh "${SSH_OPTIONS[@]}" "$SSH_TARGET" "bash -s" < "$SCRIPT_DIR/remote_bootstrap.sh"
else
  echo "[deploy] Skipping remote bootstrap"
fi

echo "[deploy] Extracting archive and starting containers"
ssh "${SSH_OPTIONS[@]}" "$SSH_TARGET" \
  REMOTE_DIR="$REMOTE_DIR" \
  ARCHIVE_NAME="$ARCHIVE_NAME" \
  REMOTE_HEALTHCHECK="$REMOTE_HEALTHCHECK" \
  DEEPSEEK_API_KEY_VALUE="$DEEPSEEK_API_KEY_VALUE" \
  bash -s <<'REMOTE_CMDS'
set -euo pipefail

mkdir -p "$REMOTE_DIR"
tar -xzf "/tmp/${ARCHIVE_NAME}" -C "$REMOTE_DIR"
rm -f "/tmp/${ARCHIVE_NAME}"

cd "$REMOTE_DIR"

[ -f .env.example ] && [ ! -f .env ] && cp .env.example .env
touch .env

if grep -q '^DEEPSEEK_API_KEY=' .env; then
  sed -i.bak "s/^DEEPSEEK_API_KEY=.*/DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY_VALUE}/" .env && rm -f .env.bak
else
  echo "DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY_VALUE}" >> .env
fi

docker compose pull || true
docker compose build --pull
docker compose up -d
docker compose ps

if [ -n "${REMOTE_HEALTHCHECK:-}" ]; then
  curl -fsS "$REMOTE_HEALTHCHECK" || true
fi
REMOTE_CMDS

echo "[deploy] Deployment finished."
