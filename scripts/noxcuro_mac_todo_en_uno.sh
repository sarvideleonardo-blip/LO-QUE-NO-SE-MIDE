#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "== noXcuro | Todo en uno (Mac) =="

need_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "❌ Falta comando requerido: $cmd"
    exit 1
  fi
}

need_cmd python3
need_cmd codex

if ! command -v node >/dev/null 2>&1; then
  echo "⚠️ node no está instalado. El paso opcional de Agent Skills se omitirá."
  HAS_NODE=0
else
  HAS_NODE=1
fi

echo "✅ python3: $(python3 --version 2>&1)"
echo "✅ codex: $(codex --version 2>&1 || true)"

echo "\n[1/6] Agregando MCP Supabase..."
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=nqoinrvvggbatopmtcgu&features=account%2Cfunctions%2Cdevelopment%2Cdebugging%2Cbranching%2Cdatabase%2Cdocs" || true

echo "\n[2/6] Configurando ~/.codex/config.toml ..."
mkdir -p "$HOME/.codex"
CONFIG_FILE="$HOME/.codex/config.toml"
touch "$CONFIG_FILE"

if ! grep -q "^\[mcp\]" "$CONFIG_FILE"; then
  printf "\n[mcp]\nremote_mcp_client_enabled = true\n" >> "$CONFIG_FILE"
else
  if grep -q "^remote_mcp_client_enabled" "$CONFIG_FILE"; then
    sed -i '' 's/^remote_mcp_client_enabled.*/remote_mcp_client_enabled = true/' "$CONFIG_FILE"
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

echo "✅ Config MCP guardada en $CONFIG_FILE"

echo "\n[3/6] Login de Supabase MCP..."
echo "Se abrirá flujo de autenticación si hace falta."
codex mcp login supabase

echo "\n[4/6] Preparando config local del agente..."
if [ ! -f config.json ]; then
  cp scripts/config.example.json config.json
  echo "✅ config.json creado desde scripts/config.example.json"
else
  echo "✅ config.json ya existe (no se sobrescribe)"
fi

echo "\n[5/6] Preparando API key OpenRouter..."
if [ -z "${OPENROUTER_API_KEY:-}" ]; then
  if [ -f .env ] && grep -q '^OPENROUTER_API_KEY=' .env; then
    echo "✅ Se detectó OPENROUTER_API_KEY en .env"
  else
    read -r -s -p "Pega tu OPENROUTER_API_KEY y presiona Enter: " USER_KEY
    echo
    if [ -z "$USER_KEY" ]; then
      echo "❌ No ingresaste key. Abortando."
      exit 1
    fi
    printf "OPENROUTER_API_KEY=%s\n" "$USER_KEY" > .env
    echo "✅ Guardada en .env"
  fi
else
  echo "✅ OPENROUTER_API_KEY ya existe en entorno"
fi

echo "\n[6/6] Prueba del agente noXcuro..."
python3 scripts/noxcuro_agent.py

echo "\n✅ Proceso completo."
echo "Siguiente verificación manual dentro de Codex: /mcp"

if [ "$HAS_NODE" -eq 1 ]; then
  read -r -p "¿Quieres instalar Agent Skills de Supabase ahora? (s/N): " INSTALL_SKILLS
  if [[ "$INSTALL_SKILLS" =~ ^[sS]$ ]]; then
    npx skills add supabase/agent-skills
  else
    echo "Omitido. Puedes hacerlo luego con: npx skills add supabase/agent-skills"
  fi
fi
