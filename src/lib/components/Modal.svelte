<script lang="ts">
  import { fade, scale } from 'svelte/transition';

  export let open = false;
  export let title = '';
  export let onClose: () => void = () => {};

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose();
  }
</script>

<svelte:window on:keydown={open ? onKeydown : undefined} />

{#if open}
  <div
    class="backdrop"
    role="presentation"
    on:click={onClose}
    transition:fade={{ duration: 180 }}
  ></div>
  <div
    class="modal panel"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    transition:scale={{ duration: 200, start: 0.97 }}
  >
    <header>
      <h2>{title}</h2>
      <button class="close-btn" type="button" on:click={onClose} aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M1.5 1.5L12.5 12.5M12.5 1.5L1.5 12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </button>
    </header>
    <slot />
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 19;
    background: rgba(2, 2, 6, 0.8);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }

  .modal {
    position: fixed;
    inset: 0;
    z-index: 20;
    width: min(560px, calc(100% - 2rem));
    height: fit-content;
    max-height: calc(100dvh - 4rem);
    overflow-y: auto;
    margin: auto;
    padding: 1.6rem;
    background: linear-gradient(180deg, #11131f, #0a0b13);
    border: 1px solid var(--line-strong);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 40px 120px rgba(0, 0, 0, 0.75);
  }

  header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--line);
  }

  h2 {
    margin: 0;
    font-size: 1.4rem;
  }

  .close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--muted);
    cursor: pointer;
    transition:
      color 150ms ease,
      border-color 150ms ease,
      background 150ms ease,
      transform 150ms ease;
  }

  .close-btn:hover,
  .close-btn:focus-visible {
    color: var(--text);
    border-color: rgba(255, 107, 129, 0.5);
    background: rgba(255, 107, 129, 0.1);
    transform: rotate(90deg);
    outline: none;
  }
</style>
