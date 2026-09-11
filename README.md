# Zombies Lunares

Prototipo web de puzzle de rescate con zombies lunares, inspirado por la sensación de los clásicos de estrategia lateral de los 90 sin reutilizar marcas, personajes ni assets originales.

## Cómo usar el juego

### 1. Abrir el prototipo

```bash
npm start
```

Luego abre <http://localhost:4173> en tu navegador.

> No necesitas instalar dependencias: el prototipo usa HTML, CSS, JavaScript y el servidor HTTP incluido con Python.

### 2. Objetivo

Rescata al menos **8 de 14 zombies lunares** llevándolos desde la esclusa de la izquierda hasta el portal verde de la derecha.

### 3. Controles

1. Elige una herramienta en la barra superior.
2. Haz clic sobre un zombie para asignarle esa herramienta.
3. Combina herramientas para crear una ruta segura hasta el portal.
4. Pulsa **Reiniciar** si quieres volver a intentar la misión.

### 4. Herramientas disponibles

| Herramienta | Uso |
| --- | --- |
| Caminante | Devuelve al zombie a su comportamiento normal. |
| Bloqueador | Detiene a un zombie y hace que otros cambien de dirección al tocarlo. |
| Constructor | Crea un puente lunar escalonado delante del zombie. |
| Excavador | Abre túneles en el terreno bajo el zombie. |
| Flotador | Reduce la velocidad de caída para sobrevivir a saltos altos. |

### 5. Consejos rápidos

- Usa bloqueadores para evitar que la horda se vaya hacia un cráter.
- Usa constructores para salvar huecos o llegar a plataformas altas.
- Usa excavadores cuando necesites atravesar una loma lunar.
- Asigna flotador antes de una caída grande: sin flotador, el zombie rebota y puede perder la ruta.

## Validar

```bash
npm run check
```

## Mecánicas incluidas

- Horda autónoma que aparece por una esclusa lunar.
- Terreno destructible a baja resolución para cavar túneles.
- Roles asignables por clic: caminante, bloqueador, constructor, excavador y flotador.
- Objetivo de rescate mediante portal verde.
- Física de baja gravedad y castigo por caídas fuertes sin flotador.

## Configurar Supabase MCP en Codex

Este repositorio incluye `scripts/setup_supabase_mcp.sh` para automatizar la configuración solicitada cuando el binario `codex` esté disponible.

```bash
bash scripts/setup_supabase_mcp.sh
```

El script ejecuta:

```bash
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=nqoinrvvggbatopmtcgu&features=account%2Cfunctions%2Cdevelopment%2Cdebugging%2Cbranching%2Cdatabase%2Cdocs"
```

También asegura que `~/.codex/config.toml` contenga:

```toml
[mcp]
remote_mcp_client_enabled = true
```

Después inicia `codex mcp login supabase`. Al terminar, abre Codex y ejecuta `/mcp` para verificar la autenticación.

### Instalar Agent Skills de Supabase

Opcionalmente puedes instalar las skills de Supabase con:

```bash
npx skills add supabase/agent-skills
```
