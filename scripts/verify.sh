#!/bin/sh
set -eu

# Resolve from this file so the command works from either module and paths with spaces.
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

verify_ui() (
  cd "$repo_root/formdesk-ui"
  npm ci
  npm run verify
)

verify_backend() (
  cd "$repo_root"
  if ! docker info >/dev/null 2>&1; then
    printf '%s\n' 'Docker must be running for the PostgreSQL integration tests.' >&2
    exit 1
  fi
  docker compose --profile full config --quiet
  # Docker Desktop may expose only the per-user socket on macOS.
  if [ -z "${DOCKER_HOST:-}" ] && [ -S "$HOME/.docker/run/docker.sock" ]; then
    export DOCKER_HOST="unix://$HOME/.docker/run/docker.sock"
  fi
  cd "$repo_root/formdesk-backend"
  mvn --batch-mode --no-transfer-progress verify
)

case "${1:-all}" in
  ui) verify_ui ;;
  backend) verify_backend ;;
  all) verify_ui; verify_backend ;;
  *)
    printf '%s\n' 'Usage: ./scripts/verify.sh [ui|backend|all]' >&2
    exit 2
    ;;
esac
