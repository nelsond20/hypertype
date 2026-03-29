<script lang="ts">
  import { fade, scale } from 'svelte/transition';

  export let open = false;
  export let title = '';
  export let onClose: () => void = () => {};
</script>

{#if open}
  <dialog class="dialog panel" open aria-label={title} on:click={(event) => event.target === event.currentTarget && onClose()} transition:fade>
    <header>
      <h2>{title}</h2>
      <button class="button ghost" type="button" on:click={onClose}>Close</button>
    </header>
    <slot />
  </dialog>
{/if}

<style>
  .dialog::backdrop {
    position: fixed;
    inset: 0;
    background: rgba(2, 5, 10, 0.68);
  }

  .dialog {
    position: fixed;
    inset: 0;
    z-index: 20;
    width: min(560px, 100%);
    margin: auto;
    padding: 1rem;
    border: 1px solid var(--line);
    background: var(--panel);
  }

  header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
  }

  h2 {
    margin: 0;
    font-size: 1.2rem;
  }
</style>
