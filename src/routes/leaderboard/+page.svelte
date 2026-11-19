<script lang="ts">
  import { onMount } from 'svelte';
  import CustomSelect from '$lib/components/CustomSelect.svelte';
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
    <div class="filters panel">
      <label class="field">
        <span>Difficulty</span>
        <CustomSelect
          value={difficulty}
          options={difficultyOptions}
          ariaLabel="Filter leaderboard difficulty"
          onChange={(next) => {
            difficulty = next as typeof difficulty;
            loadData(1);
          }}
        />
      </label>
      <label class="field">
        <span>Language</span>
        <CustomSelect
          value={language}
          options={languageOptions}
          ariaLabel="Filter leaderboard language"
          onChange={(next) => {
            language = next as typeof language;
            loadData(1);
          }}
        />
      </label>
    </div>
  </div>

  {#if error}
    <p class="panel error">{error}</p>
  {/if}

  {#if page === 1 && !loading && podium.length}
    <ol class="podium" aria-label="Top three runs">
      {#each podium as slot}
        <li class="step place-{slot.place}">
          <span class="name">{slot.row.userName}</span>
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
    padding: 1rem 0 1.6rem;
    display: grid;
    gap: 1rem;
  }

  .hero {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: end;
    flex-wrap: wrap;
  }

  h1 {
    margin: 0 0 0.3rem;
    font-size: clamp(2rem, 4vw, 3.2rem);
    font-weight: 700;
  }

  .hero p {
    margin: 0;
  }

  .filters {
    display: flex;
    gap: 0.75rem;
    padding: 0.9rem;
    flex-wrap: wrap;
    border-radius: var(--radius-sm);
    box-shadow: none;
  }

  .filters .field {
    min-width: 12rem;
  }

  .filters .field span {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .error {
    margin: 0;
    padding: 1rem;
    color: var(--danger);
  }

  /* Podium: three keycaps, the winner's standing tallest. */
  .podium {
    list-style: none;
    margin: 0.5rem 0 0.25rem;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    align-items: end;
  }

  .step {
    position: relative;
    display: grid;
    gap: 0.15rem;
    align-content: start;
    padding: 1rem 1.1rem 1.2rem;
    border: 1px solid var(--line-strong);
    border-bottom: 6px solid #05060c;
    border-radius: 14px;
    background: linear-gradient(180deg, #1b1d2d, #12131f);
    min-height: 8.5rem;
  }

  .step.place-1 {
    min-height: 11rem;
    background: linear-gradient(180deg, #3441e8, var(--cobalt));
    border-color: rgba(140, 150, 255, 0.5);
    border-bottom-color: #0f1668;
  }

  .step.place-3 {
    min-height: 7rem;
  }

  .name {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .score {
    font-size: clamp(1.6rem, 3vw, 2.4rem);
    line-height: 1.1;
  }

  .place-1 .unit {
    color: rgba(255, 255, 255, 0.78);
  }

  .cap {
    position: absolute;
    top: 0.8rem;
    right: 1rem;
    font-family: var(--mono);
    font-weight: 700;
    font-size: 1.1rem;
    opacity: 0.55;
  }

  @media (max-width: 560px) {
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
