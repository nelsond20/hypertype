<script lang="ts">
  import '@fontsource-variable/bricolage-grotesque';
  import '@fontsource-variable/jetbrains-mono';
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
    padding: 1rem 0;
    position: relative;
    z-index: 5;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    font-size: 1.15rem;
    letter-spacing: -0.02em;
  }

  .brand-mark {
    width: 2.2rem;
    height: 2.2rem;
    display: block;
    object-fit: contain;
    border-radius: 10px;
  }

  .nav {
    display: inline-flex;
    gap: 0.25rem;
  }

  .nav a {
    padding: 0.5rem 0.9rem;
    border-radius: 9px;
    color: var(--muted);
    transition: color 140ms ease;
  }

  .nav a:hover {
    color: var(--text);
  }

  .nav a.active {
    color: var(--text);
    background: rgba(255, 255, 255, 0.06);
    box-shadow: inset 0 -2px 0 var(--cobalt);
  }

  .site-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1.2rem 0 1.6rem;
    border-top: 1px solid var(--line);
    margin-top: 2rem;
  }

  .site-footer p {
    margin: 0;
    font-size: 0.85rem;
  }

  .site-footer nav {
    display: inline-flex;
    gap: 1.1rem;
    flex-wrap: wrap;
  }

  .site-footer a {
    color: var(--muted);
    font-size: 0.85rem;
  }

  .site-footer a:hover {
    color: var(--text);
  }

  @media (max-width: 560px) {
    .brand span {
      display: none;
    }
    .site-footer {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
