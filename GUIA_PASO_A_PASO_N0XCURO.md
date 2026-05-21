# Guía ultra detallada (sin programar) — noXcuro + Obsidian + Codex MCP + Supabase

Esta guía está escrita para ti si **no sabes programación**. La idea es que solo copies y pegues comandos.

---

## 0) Qué vas a lograr al final

Al terminar:

1. Tendrás Codex conectado a Supabase por MCP.
2. Tendrás el agente noXcuro listo para leer una captura.
3. Se creará una nota `.md` en tu vault de Obsidian automáticamente.

---

## 1) Antes de empezar (5 minutos)

Necesitas en tu Mac:

- Terminal (ya viene en macOS).
- Python 3 instalado.
- Node.js instalado (solo para el paso opcional de skills).
- Codex CLI instalado y funcionando.

### 1.1 Verificar si tienes todo

Abre Terminal y ejecuta:

```bash
python3 --version
node --version
codex --version
```

Si alguno dice `command not found`, no pasa nada: significa que falta instalar ese componente.

---

## 2) Ir a tu carpeta del proyecto

En Terminal:

```bash
cd ~/Desktop/agente_noxcuro
pwd
```

`pwd` debe mostrar algo como `/Users/TU_USUARIO/Desktop/agente_noxcuro`.

---

## 3) Configurar Codex + Supabase MCP (lo que pediste)

### 3.1 Agregar servidor MCP de Supabase

Copia y pega EXACTO:

```bash
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=nqoinrvvggbatopmtcgu&features=account%2Cfunctions%2Cdevelopment%2Cdebugging%2Cbranching%2Cdatabase%2Cdocs"
```

### 3.2 Habilitar cliente remoto MCP en config

Abre/crea `~/.codex/config.toml` y asegúrate que tenga esto:

```toml
[mcp]
remote_mcp_client_enabled = true
```

Forma fácil desde Terminal (si no sabes editar archivos):

```bash
mkdir -p ~/.codex
if ! grep -q "^\[mcp\]" ~/.codex/config.toml 2>/dev/null; then
  printf "\n[mcp]\nremote_mcp_client_enabled = true\n" >> ~/.codex/config.toml
else
  if grep -q "^remote_mcp_client_enabled" ~/.codex/config.toml; then
    sed -i '' 's/^remote_mcp_client_enabled.*/remote_mcp_client_enabled = true/' ~/.codex/config.toml
  else
    printf "\nremote_mcp_client_enabled = true\n" >> ~/.codex/config.toml
  fi
fi
```

### 3.3 Autenticar Supabase MCP

```bash
codex mcp login supabase
```

Se abrirá flujo de login/autorización. Complétalo.

### 3.4 Verificar autenticación

Dentro de Codex ejecuta:

```text
/mcp
```

Debes ver `supabase` activo/conectado.

### 3.5 (Opcional) Instalar Agent Skills

```bash
npx skills add supabase/agent-skills
```

---

## 4) Configurar noXcuro agent para evitar el error 401

Tu error fue:

- `401 Missing Authentication header`

Eso significa: la API key no se estaba mandando bien.

### 4.1 Crear config local

En la carpeta del proyecto:

```bash
cp scripts/config.example.json config.json
```

### 4.2 Poner API key (sin exponerla)

**Recomendado**: variable de entorno.

```bash
export OPENROUTER_API_KEY="TU_API_KEY_REAL"
```

> Importante: no pegues tu API key en archivos públicos, ni en capturas de pantalla.

### 4.3 Primera prueba del agente

```bash
python3 scripts/noxcuro_agent.py
```

Si todo sale bien verás algo como:

- `✅ Nodo creado: .../01nodes/2026-... - nodo.md`

---

## 5) Cómo usarlo día a día (flujo súper simple)

1. Escribe tu texto en `00inbox/captura.md`.
2. Ejecuta:
   ```bash
   python3 scripts/noxcuro_agent.py
   ```
3. Abre Obsidian.
4. Ve a `01nodes` y revisa el nuevo nodo.

Repite. Eso es todo para el MVP.

---

## 6) Errores típicos y solución rápida

### Error A: `codex: command not found`

Significa que Codex CLI no está instalado o no está en PATH.

### Error B: `401 Missing Authentication header`

Casi siempre se arregla haciendo:

```bash
export OPENROUTER_API_KEY="TU_API_KEY_REAL"
python3 scripts/noxcuro_agent.py
```

### Error C: `Inbox vacío`

Debes escribir texto real en el archivo de captura (`00inbox/captura.md`).

### Error D: no aparece nota nueva en Obsidian

- Revisa que `vault_path` en `config.json` sea correcto.
- Revisa que `nodes_folder` exista (si no, el script lo crea).
- Pulsa refrescar en Obsidian o reinicia Obsidian.

---

## 7) Checklist final (marca uno por uno)

- [ ] `codex mcp add supabase ...` ejecutado.
- [ ] `~/.codex/config.toml` con `remote_mcp_client_enabled = true`.
- [ ] `codex mcp login supabase` completado.
- [ ] `/mcp` muestra `supabase` activo.
- [ ] `cp scripts/config.example.json config.json` ejecutado.
- [ ] `export OPENROUTER_API_KEY="..."` ejecutado.
- [ ] `python3 scripts/noxcuro_agent.py` crea nodo.
- [ ] Nodo visible en `01nodes` dentro de Obsidian.

---

## 8) Si quieres, siguiente mejora (sin complicarte)

Cuando esto funcione, el siguiente paso recomendable es crear un botón/atajo que haga:

1. Guardar captura.
2. Ejecutar agente.
3. Abrir el nodo recién creado.

Te lo puedo dejar listo en la siguiente iteración.


## 9) Caso exacto que te pasó (bash-3.2 sin resultados)

Si te aparece algo como:

- `bash-3.2$` y no ves versión de `python3`, `node` o `codex`,

haz esto exactamente:

```bash
exit
zsh
python3 --version
node --version
codex --version
```

Si `codex --version` falla, instala o re-instala Codex CLI antes de continuar.

---

## 10) Forma más segura para la API key (recomendada)

Crea archivo `.env` en la carpeta del proyecto:

```bash
cat > .env << 'EOF'
OPENROUTER_API_KEY=TU_API_KEY_REAL
EOF
```

Luego ejecuta el agente normal:

```bash
python3 scripts/noxcuro_agent.py
```

El agente ya lee `.env` automáticamente.


## 11) Un solo comando (todo en uno)

Si no quieres decidir nada manualmente, ejecuta desde la carpeta del proyecto:

```bash
bash scripts/noxcuro_mac_todo_en_uno.sh
```

Este script hace:

1. Verifica `python3` y `codex`.
2. Ejecuta `codex mcp add supabase ...`.
3. Escribe `remote_mcp_client_enabled = true` en `~/.codex/config.toml`.
4. Ejecuta `codex mcp login supabase`.
5. Crea `config.json` si no existe.
6. Pide o detecta `OPENROUTER_API_KEY`.
7. Corre `python3 scripts/noxcuro_agent.py`.
8. Opcionalmente instala `supabase/agent-skills`.
