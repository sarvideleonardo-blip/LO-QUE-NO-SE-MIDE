#!/usr/bin/env bash
set -euo pipefail

if ! command -v codex >/dev/null 2>&1; then
  echo "ERROR: codex no está instalado en PATH." >&2
  echo "Instala Codex CLI y vuelve a ejecutar este script." >&2
  exit 1
fi

codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=nqoinrvvggbatopmtcgu&features=account%2Cfunctions%2Cdevelopment%2Cdebugging%2Cbranching%2Cdatabase%2Cdocs"

mkdir -p "$HOME/.codex"
CONFIG_FILE="$HOME/.codex/config.toml"
touch "$CONFIG_FILE"

if ! grep -q "^\[mcp\]" "$CONFIG_FILE"; then
  {
    echo ""
    echo "[mcp]"
    echo "remote_mcp_client_enabled = true"
  } >> "$CONFIG_FILE"
else
  if grep -q "^remote_mcp_client_enabled" "$CONFIG_FILE"; then
    sed -i 's/^remote_mcp_client_enabled.*/remote_mcp_client_enabled = true/' "$CONFIG_FILE"
  else
    awk '
      BEGIN { in_mcp=0; done=0 }
      /^\[mcp\]/ { print; in_mcp=1; next }
      /^\[/ {
        if (in_mcp && !done) {
          print "remote_mcp_client_enabled = true"
          done=1
        }
        in_mcp=0
      }
      { print }
      END {
        if (in_mcp && !done) print "remote_mcp_client_enabled = true"
      }
    ' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
  fi
fi

codex mcp login supabase

echo "Verifica dentro de Codex con: /mcp"
