<script lang="ts">
  import type { LeaderboardItem } from '$lib/domain/game/types';

  export let rows: LeaderboardItem[] = [];
  export let page = 1;
  export let totalPages = 1;
  export let onPageChange: (next: number) => void = () => {};
  export let loading = false;

  const skeletonRows = Array.from({ length: 6 });
  const languageBadgeByLanguage: Record<string, string> = {
    typescript: 'lang-typescript',
    javascript: 'lang-javascript',
    python: 'lang-python',
    rust: 'lang-rust',
    sql: 'lang-sql',
    go: 'lang-go'
  };

  function getLanguageBadgeClass(language: string) {
    return languageBadgeByLanguage[language] ?? 'lang-default';
  }
</script>

<section class="leaderboard panel">
  <div class="head">
    <div>
      <h2>Leaderboard</h2>
      <p class="subtle">Top scores by difficulty and language.</p>
    </div>
    <div class="pager">
      <button class="button ghost" type="button" on:click={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1 || loading}>Prev</button>
      <span class="mono">Page {page} / {totalPages}</span>
      <button class="button ghost" type="button" on:click={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages || loading}>Next</button>
    </div>
  </div>

  <div class="table" role="table" aria-label="Leaderboard">
    <div class="row head-row" role="row">
      <span>Rank</span>
      <span>Player</span>
      <span>WPM</span>
      <span>Accuracy</span>
      <span>Difficulty</span>
      <span>Language</span>
      <span>When</span>
    </div>

    {#if loading}
      <div class="loading-block" role="status" aria-live="polite" aria-label="Loading leaderboard">
        {#each skeletonRows as _, index}
          <div class="skeleton-row" style={`--sk-delay:${index * 90}ms`}>
            <span class="sk sk-rank"></span>
            <span class="sk sk-player"></span>
            <span class="sk sk-wpm"></span>
            <span class="sk sk-acc"></span>
            <span class="sk sk-difficulty"></span>
            <span class="sk sk-language"></span>
            <span class="sk sk-when"></span>
          </div>
        {/each}
      </div>
    {/if}

    <div class:dim={loading} class="data">
      {#each rows as row, index}
        <div class="row" role="row">
          <span class="mono">#{(page - 1) * 10 + index + 1}</span>
          <span>{row.userName}</span>
          <span class="mono">{row.wpm.toFixed(1)}</span>
          <span class="mono">{row.accuracy.toFixed(1)}%</span>
          <span>{row.difficulty}</span>
          <span>
            <span class={`language-badge ${getLanguageBadgeClass(row.language)}`}>{row.language}</span>
          </span>
          <span class="subtle">{new Date(row.createdAt ?? Date.now()).toLocaleDateString()}</span>
        </div>
      {/each}
      {#if !loading && rows.length === 0}
        <p class="empty subtle">No scores yet. Be the first on this board.</p>
      {/if}
    </div>
  </div>
</section>

<style>
  .leaderboard {
    padding: 1rem;
  }

  .head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
  }

  h2 {
    margin: 0;
  }

  .pager {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .table {
    display: grid;
    gap: 0.5rem;
  }

  .data.dim {
    opacity: 0.72;
  }

  .row {
    display: grid;
    grid-template-columns: 0.55fr 1.1fr 0.7fr 0.85fr 0.9fr 0.95fr 0.8fr;
    gap: 0.75rem;
    align-items: center;
    padding: 0.75rem 0.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .head-row {
    color: var(--muted);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    border-top: none;
  }

  .empty {
    padding: 1rem 0.25rem 0.5rem;
  }

  .loading-block {
    display: grid;
    gap: 0.5rem;
  }

  .skeleton-row {
    display: grid;
    grid-template-columns: 0.55fr 1.1fr 0.7fr 0.85fr 0.9fr 0.95fr 0.8fr;
    gap: 0.75rem;
    align-items: center;
    padding: 0.75rem 0.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .sk {
    height: 1rem;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.04),
      rgba(255, 255, 255, 0.11),
      rgba(255, 255, 255, 0.04)
    );
    background-size: 220% 100%;
    animation: shimmer 1250ms ease-in-out infinite;
    animation-delay: var(--sk-delay, 0ms);
  }

  .sk-rank {
    width: 65%;
  }
  .sk-player {
    width: 85%;
  }
  .sk-wpm {
    width: 60%;
  }
  .sk-acc {
    width: 72%;
  }
  .sk-difficulty {
    width: 92%;
  }
  .sk-language {
    width: 82%;
  }
  .sk-when {
    width: 70%;
  }

  .language-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.22rem 0.52rem;
    border-radius: 999px;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border: 1px solid transparent;
    font-family: var(--mono);
  }

  .lang-typescript {
    background: rgba(49, 120, 198, 0.22);
    border-color: rgba(49, 120, 198, 0.55);
    color: #9eccff;
  }

  .lang-javascript {
    background: rgba(247, 223, 30, 0.18);
    border-color: rgba(247, 223, 30, 0.48);
    color: #ffe88a;
  }

  .lang-python {
    background: rgba(53, 114, 165, 0.2);
    border-color: rgba(255, 212, 59, 0.44);
    color: #c0d9ff;
  }

  .lang-rust {
    background: rgba(206, 111, 54, 0.2);
    border-color: rgba(206, 111, 54, 0.5);
    color: #ffc8a4;
  }

  .lang-sql {
    background: rgba(75, 197, 173, 0.18);
    border-color: rgba(75, 197, 173, 0.46);
    color: #9ef1de;
  }

  .lang-go {
    background: rgba(0, 173, 216, 0.18);
    border-color: rgba(0, 173, 216, 0.45);
    color: #a8f0ff;
  }

  .lang-default {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.18);
    color: var(--text);
  }

  @keyframes shimmer {
    0% {
      background-position: 0% 0%;
    }
    100% {
      background-position: 200% 0%;
    }
  }

  @media (max-width: 900px) {
    .head,
    .row {
      grid-template-columns: 1fr;
      display: grid;
    }

    .skeleton-row {
      grid-template-columns: 1fr;
    }

    .head {
      display: flex;
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
