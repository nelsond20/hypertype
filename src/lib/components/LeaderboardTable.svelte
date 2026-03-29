<script lang="ts">
  import type { LeaderboardItem } from '$lib/shared/types';

  export let rows: LeaderboardItem[] = [];
  export let page = 1;
  export let totalPages = 1;
  export let onPageChange: (next: number) => void = () => {};
  export let loading = false;
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
      <span>Mode</span>
      <span>When</span>
    </div>
    {#each rows as row, index}
      <div class="row" role="row">
        <span class="mono">#{(page - 1) * 10 + index + 1}</span>
        <span>{row.userName}</span>
        <span class="mono">{row.wpm.toFixed(1)}</span>
        <span class="mono">{row.accuracy.toFixed(1)}%</span>
        <span>{row.difficulty} / {row.language}</span>
        <span class="subtle">{new Date(row.createdAt ?? Date.now()).toLocaleDateString()}</span>
      </div>
    {/each}
    {#if rows.length === 0}
      <p class="empty subtle">No scores yet. Be the first on this board.</p>
    {/if}
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

  .row {
    display: grid;
    grid-template-columns: 0.55fr 1.2fr 0.7fr 0.85fr 1fr 0.8fr;
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

  @media (max-width: 900px) {
    .head,
    .row {
      grid-template-columns: 1fr;
      display: grid;
    }

    .head {
      display: flex;
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
