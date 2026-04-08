<script lang="ts">
  import { onMount } from 'svelte';
  import { cubicOut, cubicIn } from 'svelte/easing';

  type SelectOption = {
    value: string | number;
    label: string;
  };

  export let value: string | number;
  export let options: SelectOption[] = [];
  export let onChange: (next: string | number) => void = () => {};
  export let ariaLabel = 'Select option';
  export let disabled = false;

  let open = false;
  let activeIndex = 0;
  let rootEl: HTMLDivElement | null = null;
  let triggerEl: HTMLButtonElement | null = null;
  let menuEl: HTMLUListElement | null = null;
  let menuTop = 0;
  let menuLeft = 0;
  let menuWidth = 0;

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        if (node.isConnected) node.remove();
      }
    };
  }

  function updateMenuPosition() {
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    menuTop = rect.bottom + 6;
    menuLeft = rect.left;
    menuWidth = rect.width;
  }

  function getSelectedIndex() {
    const index = options.findIndex((option) => option.value === value);
    return index >= 0 ? index : 0;
  }

  function openMenu() {
    if (disabled) return;
    activeIndex = getSelectedIndex();
    updateMenuPosition();
    open = true;
  }

  function closeMenu() {
    open = false;
  }

  function toggleMenu() {
    if (open) {
      closeMenu();
      return;
    }
    openMenu();
  }

  function selectAt(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    closeMenu();
  }

  function onTriggerKeydown(event: KeyboardEvent) {
    if (disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleMenu();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      activeIndex = (activeIndex + direction + options.length) % options.length;
      return;
    }

    if (event.key === 'Escape') {
      closeMenu();
    }
  }

  function onMenuKeydown(event: KeyboardEvent) {
    if (!open || options.length === 0) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      activeIndex = (activeIndex + direction + options.length) % options.length;
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      selectAt(activeIndex);
    }
  }

  function menuIn(node: Element, { duration = 150 }: { duration?: number } = {}) {
    return {
      duration,
      css: (t: number) => {
        const e = cubicOut(t);
        return `
          opacity: ${e};
          transform: scaleY(${0.94 + 0.06 * e}) translateY(${(1 - e) * -6}px);
          transform-origin: top center;
        `;
      }
    };
  }

  function menuOut(node: Element, { duration = 200 }: { duration?: number } = {}) {
    return {
      duration,
      css: (t: number) => {
        const e = cubicIn(1 - t);
        return `
          opacity: ${t * t};
          transform: scaleY(${0.88 + 0.12 * t}) translateY(${(1 - t) * 10}px);
          transform-origin: top center;
          filter: blur(${(1 - t) * 3}px);
        `;
      }
    };
  }

  onMount(() => {
    const onWindowPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootEl?.contains(target)) return;
      if (menuEl?.contains(target)) return;
      closeMenu();
    };

    const onScroll = () => {
      if (open) updateMenuPosition();
    };

    const onResize = () => {
      if (open) updateMenuPosition();
    };

    window.addEventListener('pointerdown', onWindowPointerDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('pointerdown', onWindowPointerDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  });

  $: selectedLabel = options.find((option) => option.value === value)?.label ?? '';
</script>

<div class:open class="custom-select" bind:this={rootEl}>
  <button
    type="button"
    class="trigger"
    {disabled}
    bind:this={triggerEl}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label={ariaLabel}
    on:click={toggleMenu}
    on:keydown={onTriggerKeydown}>
    <span>{selectedLabel}</span>
    <span class:open class="chevron" aria-hidden="true"></span>
  </button>

  {#if open}
    <ul
      class="custom-select-menu panel"
      role="listbox"
      bind:this={menuEl}
      use:portal
      style="top: {menuTop}px; left: {menuLeft}px; width: {menuWidth}px;"
      on:keydown={onMenuKeydown}
      in:menuIn={{ duration: 150 }}
      out:menuOut={{ duration: 200 }}>
      {#each options as option, index}
        <li role="option" aria-selected={option.value === value}>
          <button
            type="button"
            class:selected={option.value === value}
            class:active={index === activeIndex}
            on:click={() => selectAt(index)}
            on:pointerdown|preventDefault
            on:mouseenter={() => (activeIndex = index)}>
            {option.label}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .custom-select {
    position: relative;
    width: 100%;
  }

  .trigger {
    width: 100%;
    box-sizing: border-box;
    min-height: 3.25rem;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text);
    padding: 0.9rem 0.95rem;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
    cursor: pointer;
    transition:
      border-color 160ms ease,
      background 160ms ease;
  }

  .trigger:hover {
    border-color: rgba(115, 224, 196, 0.35);
    background: rgba(115, 224, 196, 0.08);
  }

  .trigger:focus-visible {
    outline: 2px solid rgba(115, 224, 196, 0.45);
    outline-offset: 2px;
  }

  .trigger:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .chevron {
    width: 0.55rem;
    height: 0.55rem;
    border-right: 2px solid var(--muted);
    border-bottom: 2px solid var(--muted);
    transform: rotate(45deg);
    transition: transform 170ms ease;
    margin-top: -0.2rem;
    flex-shrink: 0;
  }

  .chevron.open {
    transform: rotate(-135deg);
    margin-top: 0.2rem;
  }

  :global(.custom-select-menu) {
    position: fixed;
    z-index: 9999;
    box-sizing: border-box;
    max-height: 17.5rem;
    overflow: auto;
    margin: 0;
    padding: 0.4rem;
    list-style: none;
  }

  :global(.custom-select-menu button) {
    width: 100%;
    text-align: left;
    border: none;
    border-radius: 10px;
    padding: 0.58rem 0.62rem;
    color: var(--text);
    background: transparent;
    cursor: pointer;
    transition: background 140ms ease;
  }

  :global(.custom-select-menu button.active),
  :global(.custom-select-menu button:hover) {
    background: rgba(255, 255, 255, 0.08);
  }

  :global(.custom-select-menu button.selected) {
    background: rgba(115, 224, 196, 0.14);
    color: #d8fff3;
  }
</style>
