# HyperType Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rehacer la presentación de todo el sitio con un lenguaje visual nuevo y el Keycap Orb como héroe.

**Architecture:** Se reescriben los tokens globales y el CSS de cada componente. El Keycap Orb se porta de React a un componente Svelte 5 con el motor WebGL sin cambios. Lógica de juego, API y datos no se tocan.

**Tech Stack:** SvelteKit 5, TypeScript, CSS propio, `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/jetbrains-mono`.

**Spec:** `docs/superpowers/specs/2026-11-19-hypertype-redesign-design.md`

## Global Constraints

- Sin Tailwind, React ni shadcn.
- Paleta: `#020206` base, `#2633d4` cobalto, `#1f30ff` brillo, `#b3b7c1` ceniza, `#eceef5` texto, `#9aa53a` lima (solo éxito).
- Tipografía: Bricolage Grotesque (títulos), JetBrains Mono (código y cifras). Sin etiquetas en mayúsculas.
- Una sola animación de entrada (el orb). `prefers-reduced-motion` respetado, foco visible, responsive hasta 360px.
- No cambia el backend, las rutas ni los contratos.

## Review Focus

- WebGL2 no disponible: el héroe muestra el degradado de respaldo y el CTA sigue funcionando.
- Navegar fuera de `/home`: el orb libera contexto y listeners (sin fugas).
- `prefers-reduced-motion`: el orb no gira ni hace ola.
- Móvil de 360px: sin scroll horizontal en ninguna página.
- Ranking vacío o con error: se muestra un mensaje con acción, no una tabla rota.

---

### Task 1: Tokens, fuentes, nav y footer
**Files:** Modify `package.json`, `src/app.css`, `src/routes/+layout.svelte`
**Produces:** variables CSS `--bg --ink --cobalt --glow --ash --text --lime --danger`, y las clases globales `.shell`, `.key` (botón con forma de tecla; `.key.primary`), `.legal-page`.
- [ ] Instalar las dos fuentes `@fontsource-variable/*` e importarlas en `+layout.svelte`.
- [ ] Reescribir `app.css` con los tokens y `.key`; conservar `.shell`, `.field` y `.legal-*` con el nuevo aspecto.
- [ ] Reescribir nav y footer (barra fina, marca y 3 enlaces).
- [ ] Verificar: `npm run check` sin errores.

### Task 2: KeycapOrb.svelte
**Files:** Create `src/lib/components/KeycapOrb.svelte`
**Produces:** componente con props `keys`, `palette`, `background`, `glow`, `rings`, `scale`, `autoRotate`, `speed`, `reflection`, `ripple`, `height`, `onKeyPress` (mismos nombres y valores por defecto que el original).
- [ ] Portar el motor tal cual a `<script lang="ts">`; el efecto de React pasa a `onMount` con limpieza, y las props reactivas se leen cada fotograma.
- [ ] `failed`, `reduced` y `announce` pasan a estado `$state`; regenerar el GL al restaurar el contexto.
- [ ] Verificar: `npm run check`.

### Task 3: Landing
**Files:** Modify `src/routes/home/+page.svelte`; Create `src/lib/components/BentoGrid.svelte`
**Produces:** `BentoGrid` (slot, cuadrícula de 3 columnas) y `BentoCell` por CSS (hover del original).
- [ ] Héroe con orb a pantalla completa, titular a la izquierda, CTA "Jugar" y enlace al ranking.
- [ ] Bento de 5 celdas: fragmento que se escribe solo, métricas, lenguajes, dificultad y vista previa del ranking.
- [ ] Actualizar `e2e/hypertype.spec.ts` al nuevo titular.

### Task 4: Play
**Files:** Modify `src/routes/play/+page.svelte`, `Game.svelte`, `StatsBar.svelte`, `TextDisplay.svelte`, `CustomSelect.svelte`, `Modal.svelte`
- [ ] Solo CSS y marcado; no cambiar lógica ni props exportadas.
- [ ] Área de escritura centrada con modo de enfoque, métricas mínimas, texto en JetBrains Mono.

### Task 5: Leaderboard
**Files:** Modify `src/routes/leaderboard/+page.svelte`, `LeaderboardTable.svelte`
- [ ] Podio top 3 y tabla debajo; filtros como selector de teclas; estados vacío y error con acción.

### Task 6: Result, settings y legales
**Files:** Modify `src/routes/result/+page.svelte`, `settings/+page.svelte`, `privacy`, `terms`, `data-processing`
- [ ] Aplicar el nuevo sistema sin cambiar textos legales.

### Task 7: Verificación
- [ ] `npm run check`, `npm test` y `npm run build` pasan.
- [ ] Capturas en navegador a 1440px y 360px de `/home`, `/play`, `/leaderboard`, `/result`.
- [ ] Commit por tarea.
