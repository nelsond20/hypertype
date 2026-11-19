<!--
  Bento card. Svelte rewrite of the 21st.dev `bento-grid` card (@manuarora700):
  the title block lifts on hover and a link slides up from the bottom edge.
  The visual goes in the default slot.
-->
<script lang="ts">
  export let name: string;
  export let description: string;
  export let href = '';
  export let cta = '';
  let className = '';
  export { className as class };
</script>

<article class="card {className}">
  <div class="visual"><slot /></div>
  <div class="copy">
    <h3>{name}</h3>
    <p>{description}</p>
  </div>
  {#if href}
    <a class="more" {href}>{cta}</a>
  {/if}
  <div class="veil" aria-hidden="true"></div>
</article>

<style>
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    border-radius: var(--radius);
    background: #07080f;
    border: 1px solid var(--line);
    box-shadow: 0 -20px 80px -20px rgba(120, 130, 255, 0.12) inset;
    transform: translateZ(0);
  }

  .visual {
    position: relative;
    flex: 1;
    min-height: 0;
    padding: 1.1rem 1.25rem 0;
  }

  .copy {
    position: relative;
    z-index: 1;
    padding: 0.9rem 1.25rem 1.25rem;
    transition: transform 300ms ease;
  }

  .copy h3 {
    margin: 0 0 0.25rem;
    font-size: 1.35rem;
  }

  .copy p {
    margin: 0;
    max-width: 38ch;
    color: var(--muted);
    font-size: 0.95rem;
  }

  .more {
    position: absolute;
    left: 1.25rem;
    bottom: 1rem;
    z-index: 2;
    color: var(--accent);
    font-weight: 600;
    opacity: 0;
    transform: translateY(14px);
    transition:
      opacity 300ms ease,
      transform 300ms ease;
  }

  .veil {
    position: absolute;
    inset: 0;
    pointer-events: none;
    transition: background 300ms ease;
  }

  @media (hover: hover) {
    .card:hover .copy,
    .card:focus-within .copy {
      transform: translateY(-1.6rem);
    }
    .card:hover .more,
    .card:focus-within .more {
      opacity: 1;
      transform: none;
    }
    .card:hover .veil {
      background: rgba(255, 255, 255, 0.025);
    }
  }

  @media (hover: none) {
    .more {
      opacity: 1;
      transform: none;
      position: static;
      padding: 0 1.25rem 1.1rem;
    }
  }
</style>
