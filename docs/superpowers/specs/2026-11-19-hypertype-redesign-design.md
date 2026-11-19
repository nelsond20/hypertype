# HyperType: rediseño completo

## Intención
HyperType se ve desactualizado y generado por IA (tema oscuro genérico, gradientes azul y verde, tarjetas redondeadas iguales, etiquetas en monoespaciada). Se rehace el lenguaje visual de todo el sitio, inspirado en componentes de 21st.dev, adaptados a Svelte 5.

## Objetivos
- Un solo lenguaje visual en `/home`, `/play`, `/result`, `/leaderboard`, `/settings` y las páginas legales.
- Un momento memorable: el **Keycap Orb** (WebGL) como héroe de la landing.
- Sensación de teclado mecánico en todo el sitio, sin recurrir a plantillas de SaaS.
- Responsive hasta móvil, foco de teclado visible y `prefers-reduced-motion` respetado.

## No objetivos
- No se toca el backend, la API, MongoDB, el scoring ni el corpus.
- No se instala React ni Tailwind. No se migra de framework.
- No se cambian rutas ni contratos de datos.

## Anti-objetivos
- Fondo crema con serif y acento terracota.
- Negro con un solo verde ácido.
- Tarjetas idénticas con la misma sombra gris.
- Etiquetas en mayúsculas sobre cada título, enumeraciones "01 / 02 / 03" y flechas "→" en todos los botones.

## Restricciones
- Los componentes de 21st son React, Tailwind y shadcn. No corren en SvelteKit, así que se **reescriben en Svelte con CSS propio** y se ven igual.
  - `keycap-orb`: port fiel del código que pasó el usuario (motor WebGL2 idéntico, envoltorio Svelte). Licencia no verificada, se deja crédito al autor.
  - `bento-grid`: se reimplementa en CSS Grid, con el hover del original.
  - `leaderboard-card`: su código no está accesible (requiere API key de 21st), así que se diseña uno propio con la misma intención (ranking con medallas y movimiento).
- `Game.svelte` (775 líneas) y `LeaderboardTable.svelte` conservan su lógica. Solo se reemplaza la presentación.

## Approaches
1. **Port a Svelte con CSS propio (elegido por el usuario).** El orb es raw WebGL, así que el port es casi 1:1.
2. Migrar a React/Next: se descartó por costo y riesgo sin beneficio de producto.
3. Islas de React dentro de SvelteKit: se descartó porque no tiene soporte limpio y complica el build.

## Dirección visual (mi propuesta)
- **Color:** negro tinta `#020206` (base), cobalto `#2633d4` con brillo `#1f30ff` (acento), ceniza `#b3b7c1` (texto secundario y teclas claras), blanco hueso `#eceef5` (texto), lima `#9aa53a` (solo éxito y la tecla destacada). Sale de la paleta del orb, así que sitio y héroe son una sola pieza.
- **Tipografía:** Bricolage Grotesque para títulos (con carácter, ancho variable) y JetBrains Mono para código y cifras. Se autoalojan con `@fontsource`. Sin etiquetas en mayúsculas.
- **Layout de la landing:** orb a pantalla completa, titular alineado a la izquierda encima, un CTA "Jugar" y un enlace al ranking. Debajo, un bento de 5 celdas con contenido real: un fragmento que se escribe solo, WPM y precisión en vivo, lenguajes, vista previa del ranking y niveles de dificultad.
- **Sistema:** los chips de métricas y botones parecen teclas (relieve, bisel, se hunden al pulsar). Una sola animación de entrada, la del orb. Sin fade-up por sección.
- **`/play`:** área de escritura centrada, sin cromo alrededor. Las métricas pasan a una barra mínima y el texto usa JetBrains Mono grande.
- **`/leaderboard`:** podio top 3 y debajo la tabla, con filtros como selector de teclas.
- **Nav y footer:** barra superior fina con marca y 3 enlaces. Footer legal compacto.

## Decisiones que quedan al implementador
- Valores exactos de espaciado y radio, siempre que respeten la escala de la dirección visual.
- Qué teclas y legados (`label` o `icon`) lleva el orb: propongo CSS, TS, `{}`, `</>`, WPM, Esc y el resto de lenguajes soportados.
- Fallback del orb cuando WebGL2 no está disponible: degradado CSS, como en el original.

## Fases
1. Tokens globales, fuentes, nav y footer (`app.css`, `+layout.svelte`).
2. `KeycapOrb.svelte` y la landing con el bento.
3. `/play` y `Game.svelte`, `StatsBar` y `TextDisplay`.
4. `/leaderboard` y `LeaderboardTable`.
5. `/result`, `/settings`, legales, `Modal` y `CustomSelect`.
6. Verificación en el navegador (escritorio y móvil), `npm run check` y los tests existentes.
