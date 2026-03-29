<script lang="ts">
  import { onMount } from 'svelte';
  import LeaderboardTable from '$lib/components/LeaderboardTable.svelte';
  import { difficulties, languages } from '$lib/domain/game/types';
  import type { LeaderboardItem } from '$lib/domain/game/types';

  let rows: LeaderboardItem[] = [];
  let page = 1;
  let totalPages = 1;
  let difficulty: 'all' | (typeof difficulties)[number] = 'all';
  let language: 'all' | (typeof languages)[number] = 'all';
  let loading = true;
  let error = '';

  async function loadData(nextPage = page) {
    loading = true;
    error = '';
    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: '10'
    });
    if (difficulty !== 'all') params.set('difficulty', difficulty);
    if (language !== 'all') params.set('language', language);
    try {
      const response = await fetch(`/api/leaderboard?${params.toString()}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.pagination) {
        throw new Error(data?.error ?? 'Unable to load leaderboard');
      }
      rows = data.items;
      page = data.pagination.page;
      totalPages = data.pagination.totalPages;
    } catch (err) {
      rows = [];
      page = 1;
      totalPages = 1;
      error = err instanceof Error ? err.message : 'Unable to load leaderboard';
    } finally {
      loading = false;
    }
  }

  onMount(() => loadData());
</script>

<svelte:head>
  <title>Leaderboard · HyperType</title>
</svelte:head>

<section class="shell board">
  <div class="hero">
    <div>
      <p class="eyebrow mono">Public board</p>
      <h1>Leaderboard</h1>
      <p class="subtle">Top 100 scores, filtered by difficulty and language, with pagination.</p>
    </div>
    <div class="filters panel">
      <label class="field">
        <span>Difficulty</span>
        <select bind:value={difficulty} on:change={() => loadData(1)}>
          <option value="all">All</option>
          {#each difficulties as item}
            <option value={item}>{item}</option>
          {/each}
        </select>
      </label>
      <label class="field">
        <span>Language</span>
        <select bind:value={language} on:change={() => loadData(1)}>
          <option value="all">All</option>
          {#each languages as item}
            <option value={item}>{item}</option>
          {/each}
        </select>
      </label>
    </div>
  </div>

  {#if error}
    <p class="panel error">{error}</p>
  {/if}

  <LeaderboardTable {rows} {page} {totalPages} {loading} onPageChange={(next) => loadData(next)} />
</section>

<style>
  .board {
    padding: 0.5rem 0 2rem;
    display: grid;
    gap: 1rem;
  }

  .hero {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: end;
  }

  .eyebrow {
    margin: 0;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.8rem;
  }

  h1 {
    margin: 0.35rem 0 0.6rem;
    font-size: clamp(2.2rem, 4vw, 4rem);
    letter-spacing: -0.05em;
  }

  .filters {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    flex-wrap: wrap;
  }

  .error {
    margin: 0;
    padding: 1rem;
    color: var(--danger);
  }

  @media (max-width: 920px) {
    .hero {
      display: grid;
    }
  }
</style>
