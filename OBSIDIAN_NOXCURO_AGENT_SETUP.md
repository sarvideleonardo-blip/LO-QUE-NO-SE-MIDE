# noXcuro en Obsidian: instalación de agente + arquitectura micelio

Este documento convierte tu visión de **noXcuro (micelio cognitivo)** en una implementación concreta dentro de Obsidian, priorizando:

- captura sin fricción,
- clasificación asistida por IA,
- persistencia estable en Markdown,
- exploración por relaciones (no por carpetas rígidas),
- y lectura temporal/intertemporal.

---

## 1) Stack recomendado (MVP realista)

### Base (obligatorio)
- **Obsidian** (fuente de verdad).
- **Vault local** en Markdown.

### Plugins de Obsidian (muy recomendados)
- **QuickAdd**: captura instantánea (texto o dictado transcrito).
- **Templater**: plantillas para frontmatter consistente.
- **Dataview**: consultas por etapa cognitiva, núcleo, recurrencias.
- **Linter**: normalizar metadatos y formato.
- **Omnisearch**: búsqueda semántica local mejorada.

### Visualización tipo micelio
- **Juggl** o **Excalibrain** para navegar conexiones como grafo conceptual.
- Grafo nativo de Obsidian para vista global simple.

### Capa IA (agente)
- Un agente externo (Codex/CLI, script Node/Python o n8n) que:
  1) recibe texto crudo,
  2) clasifica,
  3) propone conexiones con notas previas,
  4) escribe/actualiza archivo `.md` en el vault.

---

## 2) Modelo de datos noXcuro (frontmatter estándar)

Usa este frontmatter para cada nodo:

```yaml
---
id: 2026-04-28T12-00-00Z
created_at: 2026-04-28T12:00:00Z
source: captura-rapida
category: Metodo # Metodo | Cosmogonia | Museo | Escritura | Identidad | Leyes
core_nucleus: "relacion entre caos y estructura"
stage_cognitive: "umbral-2026-q2"
tags:
  - micelio
  - mutacion
  - recurrencia
relations_explicit:
  - "[[2025-11-03 - Leyes del Ritmo]]"
relations_semantic:
  - "[[2024-06-19 - Arquetipo de Centro]]"
recurrence_topics:
  - "origen"
  - "forma"
temporal_anchor:
  period: "2026-Q2"
  mood: "apertura + friccion"
future_letter:
  enabled: true
  review_on: 2026-12-01
---
```

Cuerpo del archivo: texto crudo + (opcional) bloques de relectura posterior.

---

## 3) Estructura mínima de carpetas (sin rigidez semántica)

Aunque tu navegación será por relaciones, conviene una estructura técnica mínima:

```text
noXcuro/
  00_inbox/
  01_nodes/
  02_templates/
  03_reviews/
  99_system/
```

- `00_inbox`: entradas crudas aún no procesadas.
- `01_nodes`: nodos finales curados por el agente.
- `02_templates`: plantillas Templater.
- `03_reviews`: cartas al futuro y relecturas.
- `99_system`: prompts, taxonomía, scripts, logs del agente.

---

## 4) Plantillas clave

### 4.1 Captura rápida (`02_templates/captura_rapida.md`)

```md
---
id: <% tp.date.now("YYYY-MM-DDTHH-mm-ss[Z]") %>
created_at: <% tp.date.now("YYYY-MM-DDTHH:mm:ss[Z]") %>
source: captura-rapida
raw: true
---

# Captura

<% tp.file.cursor() %>
```

### 4.2 Nodo procesado (`02_templates/nodo_noxcuro.md`)

```md
---
id: <% tp.date.now("YYYY-MM-DDTHH-mm-ss[Z]") %>
created_at: <% tp.date.now("YYYY-MM-DDTHH:mm:ss[Z]") %>
source: agente
category:
core_nucleus:
stage_cognitive:
tags: []
relations_explicit: []
relations_semantic: []
recurrence_topics: []
temporal_anchor:
  period:
  mood:
future_letter:
  enabled: false
  review_on:
---

# Nodo

## Texto

## Lectura posterior

## Preguntas persistentes
```

---

## 5) Flujo operativo (tu intención en práctica)

1. **Captura única** en `00_inbox` con QuickAdd.
2. **Agente IA** toma la captura y devuelve:
   - categoría,
   - tags,
   - núcleo,
   - conexiones previas,
   - etapa cognitiva sugerida.
3. **Persistencia**: guarda en `01_nodes` con plantilla estándar.
4. **Visualización**: navegar en Juggl/Excalibrain por densidad y enlaces.
5. **Ritual temporal**:
   - revisión mensual de mutaciones,
   - cartas al futuro con `review_on`,
   - comparación entre etapas.

---

## 6) Consultas Dataview útiles

### 6.1 Mutación de un núcleo en el tiempo

```dataview
TABLE created_at, category, stage_cognitive
FROM "01_nodes"
WHERE core_nucleus = "relacion entre caos y estructura"
SORT created_at ASC
```

### 6.2 Recurrencias por etapa cognitiva

```dataview
TABLE length(rows) as total
FROM "01_nodes"
FLATTEN stage_cognitive
GROUP BY stage_cognitive
SORT total DESC
```

### 6.3 Cartas al futuro vencidas

```dataview
TABLE future_letter.review_on, core_nucleus
FROM "01_nodes"
WHERE future_letter.enabled = true AND date(future_letter.review_on) <= date(today)
SORT future_letter.review_on ASC
```

---

## 7) Integración MCP Supabase para tu agente Codex

Pediste estos pasos:

1. Agregar servidor MCP Supabase.
2. Habilitar `remote_mcp_client_enabled`.
3. Login en Supabase MCP.
4. Verificar con `/mcp`.
5. (Opcional) instalar `supabase/agent-skills`.

### Estado en este entorno
En este contenedor, el binario `codex` no está disponible (`codex: command not found`), por lo que no se pudo ejecutar aquí de forma directa.

Para tu máquina local, ejecuta:

```bash
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=nqoinrvvggbatopmtcgu&features=account%2Cfunctions%2Cdevelopment%2Cdebugging%2Cbranching%2Cdatabase%2Cdocs"
```

```toml
# ~/.codex/config.toml
[mcp]
remote_mcp_client_enabled = true
```

```bash
codex mcp login supabase
```

Luego en Codex, corre:

```text
/mcp
```

Y opcional:

```bash
npx skills add supabase/agent-skills
```

---

## 8) Siguiente paso recomendado (rápido)

Implementar un primer agente de clasificación (MVP) con este contrato JSON de salida:

```json
{
  "category": "Metodo",
  "tags": ["micelio", "patrones"],
  "core_nucleus": "...",
  "stage_cognitive": "...",
  "relations_explicit": ["[[...]]"],
  "relations_semantic": ["[[...]]"],
  "recurrence_topics": ["..."],
  "future_letter": {"enabled": false, "review_on": null}
}
```

Con eso ya puedes automatizar escritura de nodos y comenzar a ver mutaciones reales en semanas.
