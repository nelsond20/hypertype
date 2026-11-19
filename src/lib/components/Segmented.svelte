<!--
  Segmented control: a recessed tray where the chosen option rises as a key.
  Behaves as a radio group: arrow keys move the choice, Tab leaves the group.
-->
<script lang="ts">
  type Option = { value: string | number; label: string };

  export let options: Option[] = [];
  export let value: string | number;
  export let onChange: (next: string | number) => void = () => {};
  export let ariaLabel = '';

  let group: HTMLDivElement;

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
    // Wait for the new selection to render, then move focus to it.
    queueMicrotask(() => group?.querySelectorAll<HTMLElement>('[role="radio"]')[to]?.focus());
  }
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div class="tray" role="radiogroup" aria-label={ariaLabel} bind:this={group} on:keydown={onKeydown}>
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

  button {
    min-height: 2.3rem;
    padding: 0.35rem 0.95rem;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--muted);
    font-weight: 600;
    cursor: pointer;
    transition:
      color 120ms ease,
      background 120ms ease;
  }

  button:hover {
    color: var(--text);
    background: rgba(255, 255, 255, 0.05);
  }

  button.on {
    color: #fff;
    background: linear-gradient(180deg, #4d5cf7, #2633d4);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.32),
      0 2px 0 #121a80,
      0 8px 18px -8px rgba(38, 51, 212, 0.7);
    transform: translateY(-1px);
  }

  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    button {
      transition: none;
    }
  }
</style>
