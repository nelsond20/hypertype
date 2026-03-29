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
    <a class="brand" href="/">
      <span class="brand-mark">HT</span>
      <span>
        <strong>HyperType</strong>
        <small>code typing arena</small>
      </span>
    </a>
    <nav class="nav">
      <a class:active={$page.url.pathname === '/play'} href="/play">Play</a>
      <a class:active={$page.url.pathname === '/leaderboard'} href="/leaderboard">Leaderboard</a>
      <a class:active={$page.url.pathname === '/settings'} href="/settings">Settings</a>
    </nav>
  </header>
  <main>
    <slot />
  </main>
</div>

<style>
  .app-frame {
    min-height: 100svh;
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
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: linear-gradient(145deg, rgba(115, 224, 196, 0.18), rgba(143, 155, 255, 0.2));
    border: 1px solid rgba(255, 255, 255, 0.12);
    font-family: var(--mono);
    font-weight: 700;
    letter-spacing: 0.08em;
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
</style>
