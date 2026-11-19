<script lang="ts">
  import { onMount } from 'svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import LeaderboardTable from '$lib/components/LeaderboardTable.svelte';
  import { difficulties, languages } from '$lib/domain/game/types';
  import type { LeaderboardItem } from '$lib/domain/game/types';
  type SelectOption = {
    value: string | number;
    label: string;
  };

  let rows: LeaderboardItem[] = [];
  let page = 1;
  let totalPages = 1;
  let difficulty: 'all' | (typeof difficulties)[number] = 'all';
  let language: 'all' | (typeof languages)[number] = 'all';
  let loading = true;
  let error = '';
  const difficultyOptions: SelectOption[] = [
    { value: 'all', label: 'All' },
    ...difficulties.map((difficulty) => ({
      value: difficulty,
      label: difficulty[0]?.toUpperCase() + difficulty.slice(1),
    })),
  ];
  const languageDisplayName: Record<(typeof languages)[number], string> = {
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    python: 'Python',
    rust: 'Rust',
    sql: 'SQL',
    go: 'Go',
  };
  const languageOptions: SelectOption[] = [
    { value: 'all', label: 'All' },
    ...languages.map((currentLanguage) => ({
      value: currentLanguage,
      label: languageDisplayName[currentLanguage],
    })),
  ];

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

  // Second, first, third: the tallest key sits in the middle.
  $: podium = [2, 1, 3]
    .map((place) => ({ place, row: rows[place - 1] }))
    .filter((slot): slot is { place: number; row: LeaderboardItem } => Boolean(slot.row));

  onMount(() => loadData());
</script>

<svelte:head>
  <title>Leaderboard · HyperType</title>
</svelte:head>

<section class="shell board">
  <div class="hero">
    <div>
      <h1>Leaderboard</h1>
      <p class="subtle">The best runs, filtered by difficulty and language.</p>
    </div>
    <div class="filters">
      <div class="group">
        <span class="name">Difficulty</span>
        <Segmented
          value={difficulty}
          options={difficultyOptions}
          ariaLabel="Filter by difficulty"
          onChange={(next) => {
            difficulty = next as typeof difficulty;
            loadData(1);
          }}
        />
      </div>
      <div class="group">
        <span class="name">Language</span>
        <Segmented
          value={language}
          options={languageOptions}
          ariaLabel="Filter by language"
          onChange={(next) => {
            language = next as typeof language;
            loadData(1);
          }}
        />
      </div>
    </div>
  </div>

  {#if error}
    <p class="panel error">{error}</p>
  {/if}

  {#if page === 1 && !loading && podium.length}
    <ol class="podium" aria-label="Top three runs">
      {#each podium as slot}
        <li class="step place-{slot.place}">
          <span class="who-name">{slot.row.userName}</span>
          <strong class="score mono">{slot.row.wpm.toFixed(1)}</strong>
          <span class="unit subtle">WPM · {slot.row.accuracy.toFixed(1)}%</span>
          <span class="cap" aria-hidden="true">{slot.place}</span>
        </li>
      {/each}
    </ol>
  {/if}

  <LeaderboardTable
    {rows}
    {page}
    {totalPages}
    {loading}
    selectedLanguage={language}
    onPageChange={(next) => loadData(next)}
  />
</section>

<style>
  .board {
    padding: 1rem 0 2rem;
    display: grid;
    gap: 1.25rem;
  }

  .hero {
    display: grid;
    gap: 1.1rem;
  }

  h1 {
    margin: 0 0 0.3rem;
    font-size: clamp(2.2rem, 4.4vw, 3.4rem);
    font-weight: 700;
  }

  .hero p {
    margin: 0;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 2rem;
  }

  .group {
    display: grid;
    gap: 0.45rem;
  }

  .name {
    font-size: 0.88rem;
    color: var(--muted);
  }

  .error {
    margin: 0;
    padding: 1rem 1.25rem;
    color: var(--danger);
  }

  /* Podium: three caps standing at different heights; the winner is cobalt. */
  .podium {
    list-style: none;
    margin: 0.5rem 0 0.25rem;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    align-items: end;
  }

  .step {
    --top: #e2e5ed;
    --bottom: #b9bdca;
    --wall: #6c7082;
    --ink: #14162a;
    position: relative;
    display: grid;
    gap: 0.15rem;
    align-content: start;
    padding: 1.1rem 1.3rem 1.3rem;
    border-radius: 18px;
    min-height: 8.5rem;
    background: linear-gradient(180deg, var(--top), var(--bottom));
    color: var(--ink);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.55),
      0 6px 0 var(--wall),
      0 24px 40px -16px rgba(0, 0, 0, 0.8);
  }

  /* The caps pop up one after another, the winner last. */
  .step {
    animation: pop 640ms cubic-bezier(0.3, 1.5, 0.5, 1) both;
  }
  .step.place-3 { animation-delay: 0ms; }
  .step.place-2 { animation-delay: 110ms; }
  .step.place-1 { animation-delay: 220ms; }

  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(46px) scaleY(0.88);
    }
  }

  .step.place-1 {
    --top: #4d5cf7;
    --bottom: #2633d4;
    --wall: #121a80;
    --ink: #fff;
    min-height: 11rem;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.32),
      0 6px 0 var(--wall),
      0 30px 60px -16px rgba(38, 51, 212, 0.7);
  }

  .step.place-3 {
    min-height: 7rem;
  }

  .who-name {
    font-weight: 650;
    font-size: 1rem;
    color: inherit;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .score {
    font-size: clamp(1.9rem, 3.4vw, 2.8rem);
    line-height: 1.1;
    font-weight: 600;
  }

  .unit {
    color: inherit !important;
    opacity: 0.72;
    font-size: 0.9rem;
  }

  .cap {
    position: absolute;
    top: 0.9rem;
    right: 1.2rem;
    font-family: var(--mono);
    font-weight: 700;
    font-size: 1.2rem;
    opacity: 0.5;
  }

  @media (max-width: 640px) {
    .podium {
      grid-template-columns: 1fr;
    }
    .step,
    .step.place-1,
    .step.place-3 {
      min-height: 0;
    }
    .place-1 {
      order: -1;
    }
  }
</style>
