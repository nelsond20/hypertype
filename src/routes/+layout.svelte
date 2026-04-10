<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
</script>

<svelte:head>
  <meta
    name="description"
    content="HyperType is a code-powered typing game with live WPM, accuracy tracking, and a persistent leaderboard."
  />
</svelte:head>

<div class="app-frame">
  <header class="topbar shell">
    <a class="brand" href="/home">
      <img class="brand-mark" src="/icon.png" alt="HyperType brand mark" />
      <span>
        <strong>HyperType</strong>
        <small>code typing arena</small>
      </span>
    </a>
    <nav class="nav">
      <a class:active={$page.url.pathname === '/home'} href="/home">Home</a>
      <a class:active={$page.url.pathname === '/play'} href="/play">Play</a>
      <a class:active={$page.url.pathname === '/leaderboard'} href="/leaderboard">Leaderboard</a>
      <!-- <a class:active={$page.url.pathname === '/settings'} href="/settings">Settings</a> -->
    </nav>
  </header>
  <main>
    <slot />
  </main>
  <footer class="site-footer shell">
    <p class="subtle">HyperType legal</p>
    <nav aria-label="Legal links">
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/data-processing">Data Processing</a>
    </nav>
  </footer>
</div>

<style>
  .app-frame {
    min-height: 100svh;
    display: grid;
    grid-template-rows: auto 1fr auto;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 0 0.75rem;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.85rem;
  }

  .brand-mark {
    width: 2.8rem;
    height: 2.8rem;
    display: block;
    object-fit: contain;
    border-radius: 14px;
  }

  .brand strong,
  .brand small {
    display: block;
  }

  .brand small {
    color: var(--muted);
    margin-top: 0.1rem;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }

  .nav {
    display: inline-flex;
    gap: 0.45rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .nav a {
    padding: 0.65rem 0.9rem;
    border-radius: 999px;
    color: var(--muted);
    border: 1px solid transparent;
  }

  .nav a.active {
    color: var(--text);
    border-color: var(--line);
    background: rgba(255, 255, 255, 0.03);
  }

  @media (max-width: 720px) {
    .topbar {
      flex-direction: column;
      align-items: flex-start;
    }
    .nav {
      width: 100%;
      justify-content: flex-start;
    }
  }

  .site-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.8rem 0 1.4rem;
    border-top: 1px solid var(--line);
    margin-top: 1.2rem;
  }

  .site-footer p {
    margin: 0;
    font-size: 0.85rem;
  }

  .site-footer nav {
    display: inline-flex;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .site-footer a {
    color: var(--muted);
    font-size: 0.85rem;
    border-bottom: 1px solid transparent;
  }

  .site-footer a:hover,
  .site-footer a:focus-visible {
    color: var(--text);
    border-bottom-color: var(--accent);
    outline: none;
  }

  @media (max-width: 720px) {
    .site-footer {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
