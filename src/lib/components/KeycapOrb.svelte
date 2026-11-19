<!--
  Keycap Orb — a ball of mechanical keycaps floating over a cobalt floor glow.

  Svelte port of the React `keycap-orb` component by @kedhareswer on 21st.dev.
  Raw WebGL2, no dependencies; the engine lives in ./keycap-orb/engine.ts.
  Drag to spin it, hover to lift a cap, press one for a ripple. Focus it and
  type: the keys you press press the caps that carry them.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { clamp, type Keycap, type KeycapPalette } from './keycap-orb/geometry';
  import { startOrb, type Tuning } from './keycap-orb/engine';

  export let keys: Keycap[] | undefined = undefined;
  export let palette: KeycapPalette | undefined = undefined;
  export let background = '#020206';
  export let glow = '#1f30ff';
  export let rings = 9;
  export let scale = 0.62;
  export let autoRotate = true;
  export let speed = 1;
  export let reflection = true;
  export let ripple = true;
  export let height = '100svh';
  export let onKeyPress: ((key: Keycap, index: number) => void) | undefined = undefined;
  let className = '';
  export { className as class };
  export let ariaLabel =
    'A ball of keycaps. Drag to spin it, press a cap, or focus it and type.';

  let rootEl: HTMLDivElement;
  let canvasEl: HTMLCanvasElement | undefined;
  let failed = false;
  let reduced = false;
  let announce = '';
  let generation = 0;

  // Read every frame, so colours and motion never rebuild the GL state.
  let tuning: Tuning;
  $: tuning = { palette, background, glow, scale, autoRotate, speed, reflection, ripple, reduced, onKeyPress };

  // Only the keys and the ring count change the geometry.
  $: layoutSig = Math.round(clamp(rings, 5, 15)) + '|' + JSON.stringify(keys ?? []);

  let stop: (() => void) | undefined;
  function mount() {
    stop?.();
    if (!canvasEl || !rootEl) return;
    stop = startOrb(canvasEl, rootEl, rings, keys, {
      tuning: () => tuning,
      fail: () => (failed = true),
      contextRestored: () => (generation += 1),
      announce: (message) => (announce = message),
    });
  }

  let ready = false;
  $: if (ready) {
    void layoutSig;
    void generation;
    mount();
  }

  onMount(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => (reduced = mq.matches);
    sync();
    mq.addEventListener('change', sync);
    ready = true;
    return () => {
      mq.removeEventListener('change', sync);
      stop?.();
    };
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={rootEl}
  role="application"
  aria-roledescription="keycap orb"
  aria-label={ariaLabel}
  tabindex="0"
  class="orb {className}"
  style="height:{height};background:{background}"
>
  {#if failed}
    <div
      class="fallback"
      aria-hidden="true"
      style="background:radial-gradient(60% 45% at 55% 100%, {glow} 0%, transparent 70%), radial-gradient(30% 30% at 50% 45%, #15161c 0%, #08080c 60%, transparent 61%)"
    ></div>
  {:else}
    <canvas bind:this={canvasEl} aria-hidden="true"></canvas>
  {/if}
  <span class="sr-only" aria-live="polite">{announce}</span>
</div>

<style>
  .orb {
    position: relative;
    width: 100%;
    overflow: hidden;
    user-select: none;
    outline: none;
    cursor: grab;
    touch-action: pan-y;
  }
  .orb:focus-visible {
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.4);
  }
  canvas,
  .fallback {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    pointer-events: none;
  }
</style>
