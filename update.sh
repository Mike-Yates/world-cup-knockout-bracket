#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

: "${YATESCUP_WEB_ROOT:?Set YATESCUP_WEB_ROOT in .env or the environment}"

AUTO_UPDATE_SERVICE="${YATESCUP_AUTO_UPDATE_SERVICE_NAME:-yatescup-auto-update.service}"
AUTO_UPDATE_TIMER="${YATESCUP_AUTO_UPDATE_TIMER_NAME:-yatescup-auto-update.timer}"
AUTO_UPDATE_USER="${YATESCUP_AUTO_UPDATE_USER:-$(id -un)}"
AUTO_UPDATE_HOME="$(getent passwd "$AUTO_UPDATE_USER" | cut -d: -f6)"
SYSTEMD_DIR="${YATESCUP_SYSTEMD_DIR:-/etc/systemd/system}"

render_systemd_template() {
  local source_file="$1"
  local target_file="$2"
  local tmp_file

  tmp_file="$(mktemp)"
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line//__YATESCUP_APP_DIR__/$PWD}"
    line="${line//__YATESCUP_SERVICE_USER__/$AUTO_UPDATE_USER}"
    line="${line//__YATESCUP_SERVICE_HOME__/$AUTO_UPDATE_HOME}"
    printf '%s\n' "$line"
  done < "$source_file" > "$tmp_file"

  if ! sudo cmp -s "$tmp_file" "$target_file"; then
    sudo install -m 0644 "$tmp_file" "$target_file"
    SYSTEMD_UNITS_CHANGED=1
  fi

  rm -f "$tmp_file"
}

ensure_auto_update_timer() {
  local service_template="ops/auto-update/systemd/yatescup-auto-update.service"
  local timer_template="ops/auto-update/systemd/yatescup-auto-update.timer"
  local service_target="$SYSTEMD_DIR/$AUTO_UPDATE_SERVICE"
  local timer_target="$SYSTEMD_DIR/$AUTO_UPDATE_TIMER"

  if [ ! -f "$service_template" ] || [ ! -f "$timer_template" ]; then
    echo "Auto-update systemd templates not found; skipping timer setup."
    return
  fi

  SYSTEMD_UNITS_CHANGED=0
  render_systemd_template "$service_template" "$service_target"
  render_systemd_template "$timer_template" "$timer_target"

  if [ "$SYSTEMD_UNITS_CHANGED" -eq 1 ]; then
    sudo systemctl daemon-reload
  fi

  if ! sudo systemctl is-enabled --quiet "$AUTO_UPDATE_TIMER" || ! sudo systemctl is-active --quiet "$AUTO_UPDATE_TIMER"; then
    sudo systemctl enable --now "$AUTO_UPDATE_TIMER"
  fi
}

git pull --ff-only
npm install
ensure_auto_update_timer
npm run update:results
npm run build
sudo rsync -az --delete dist/ "${YATESCUP_WEB_ROOT%/}/"
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl reload nginx
