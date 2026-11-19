<!--
  Segmented control: a recessed tray with one raised key under the chosen
  option. The key glides to the new choice (with a little overshoot, like a
  key bottoming out) instead of the highlight jumping.
  Behaves as a radio group: arrow keys move the choice, Tab leaves the group.
-->
<script lang="ts">
  import { onMount, tick } from 'svelte';

  type Option = { value: string | number; label: string };

  export let options: Option[] = [];
  export let value: string | number;
  export let onChange: (next: string | number) => void = () => {};
  export let ariaLabel = '';

  let group: HTMLDivElement;
  let thumb = { x: 0, y: 0, w: 0, h: 0, show: false };
  // The first placement must not animate in from 0,0.
  let animated = false;

  function measure() {
    const el = group?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!el) {
      thumb = { ...thumb, show: false };
      return;
    }
    thumb = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight, show: true };
  }

  // Re-place the key whenever the choice or the options change.
  $: if (group) {
    void value;
    void options;
    tick().then(measure);
  }

  onMount(() => {
    measure();
    document.fonts?.ready.then(measure);
    // Wrapping and font loading move the buttons; follow them.
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    requestAnimationFrame(() => requestAnimationFrame(() => (animated = true)));
    return () => observer.disconnect();
  });

  function pick(next: string | number) {
    if (next !== value) onChange(next);
  }

  function onKeydown(event: KeyboardEvent) {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const at = Math.max(0, options.findIndex((o) => o.value === value));
    let to = at;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') to = (at + 1) % options.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') to = (at - 1 + options.length) % options.length;
    if (event.key === 'Home') to = 0;
    if (event.key === 'End') to = options.length - 1;
    pick(options[to].value);
    queueMicrotask(() => group?.querySelectorAll<HTMLElement>('[role="radio"]')[to]?.focus());
  }
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div class="tray" role="radiogroup" aria-label={ariaLabel} bind:this={group} on:keydown={onKeydown}>
  <span
    class="thumb"
    class:animated
    aria-hidden="true"
    style="transform:translate({thumb.x}px,{thumb.y - 1}px);width:{thumb.w}px;height:{thumb.h}px;opacity:{thumb.show ? 1 : 0}"
  ></span>
  {#each options as option}
    {@const on = option.value === value}
    <button
      type="button"
      role="radio"
      aria-checked={on}
      tabindex={on ? 0 : -1}
      class:on
      on:click={() => pick(option.value)}
    >
      {option.label}
    </button>
  {/each}
</div>

<style>
  .tray {
    position: relative;
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    padding: 0.3rem;
    border-radius: 14px;
    background: #05060b;
    box-shadow:
      inset 0 2px 6px rgba(0, 0, 0, 0.6),
      0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .thumb {
    position: absolute;
    left: 0;
    top: 0;
    border-radius: 10px;
    background: linear-gradient(180deg, #4d5cf7, #2633d4);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.32),
      0 2px 0 #121a80,
      0 8px 18px -8px rgba(38, 51, 212, 0.7);
    pointer-events: none;
  }

  .thumb.animated {
    transition:
      transform 440ms cubic-bezier(0.34, 1.45, 0.5, 1),
      width 320ms cubic-bezier(0.3, 1.2, 0.5, 1),
      height 320ms ease,
      opacity 160ms ease;
  }

  button {
    position: relative;
    z-index: 1;
    min-height: 2.3rem;
    padding: 0.35rem 0.95rem;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--muted);
    font-weight: 600;
    cursor: pointer;
    transition:
      color 200ms ease,
      transform 90ms ease;
  }

  button:hover {
    color: var(--text);
  }

  button:active {
    transform: scale(0.95);
  }

  button.on {
    color: #fff;
  }

  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
