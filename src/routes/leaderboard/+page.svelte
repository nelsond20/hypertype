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
    padding: 0.7rem 0 1.6rem;
    display: grid;
    gap: 0.9rem;
  }

  .hero {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
  }

  .eyebrow {
    margin: 0;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.8rem;
  }

  h1 {
    margin: 0.4rem 0 0.65rem;
    font-size: clamp(1.75rem, 2.6vw, 2.25rem);
    line-height: 1.24;
    letter-spacing: -0.025em;
    font-weight: 700;
  }

  .filters {
    display: flex;
    gap: 0.75rem;
    padding: 0.9rem;
    flex-wrap: wrap;
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.02);
  }

  .filters .field {
    min-width: 12rem;
  }

  .filters .field span {
    font-size: 0.78rem;
    font-family: var(--mono);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
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
