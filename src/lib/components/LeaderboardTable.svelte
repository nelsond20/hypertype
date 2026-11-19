<script lang="ts">
  import Modal from './Modal.svelte';
  import { type Language, type LeaderboardItem } from '$lib/domain/game/types';

  export let rows: LeaderboardItem[] = [];
  export let page = 1;
  export let totalPages = 1;
  export let onPageChange: (next: number) => void = () => {};
  export let selectedLanguage: Language | 'all' = 'all';
  export let loading = false;
  let rangesOpen = false;

  const skeletonRows = Array.from({ length: 6 });
  const PAGE_SIZE = 10;

  type TierLabel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

  const languageDisplayName: Record<Language, string> = {
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    python: 'Python',
    rust: 'Rust',
    sql: 'SQL',
    go: 'Go'
  };

  // Highest first: the first rule a run satisfies is its tier.
  const tiers: Array<{ label: TierLabel; minWpm: number; minAcc: number; color: string }> = [
    { label: 'Diamond', minWpm: 65, minAcc: 96, color: '#8fdcff' },
    { label: 'Platinum', minWpm: 50, minAcc: 94, color: '#aab6ff' },
    { label: 'Gold', minWpm: 35, minAcc: 91, color: '#f2c45c' },
    { label: 'Silver', minWpm: 30, minAcc: 84, color: '#c3c7d2' },
    { label: 'Bronze', minWpm: 20, minAcc: 78, color: '#d58f60' }
  ];

  function getTier(wpm: number, accuracy: number) {
    return tiers.find((t) => wpm >= t.minWpm && accuracy >= t.minAcc) ?? tiers[tiers.length - 1];
  }

  function startsTier(index: number) {
    if (index === 0) return true;
    return getTier(rows[index].wpm, rows[index].accuracy).label !== getTier(rows[index - 1].wpm, rows[index - 1].accuracy).label;
  }

  $: maxWpm = Math.max(1, ...rows.map((r) => r.wpm));
  $: boardName = selectedLanguage === 'all' ? 'All languages' : languageDisplayName[selectedLanguage];

  // First, last and the pages around the current one; gaps become an ellipsis.
  $: pageList = (() => {
    const out: Array<number | '…'> = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) out.push(p);
      else if (out[out.length - 1] !== '…') out.push('…');
    }
    return out;
  })();

  const day = (value?: Date | string) =>
    new Date(value ?? Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
</script>

<section class="board panel" aria-label="Leaderboard">
  <header class="head">
    <div>
      <h2>{boardName}</h2>
      <p class="subtle">Runs are grouped by rank. Each rank needs both speed and accuracy.</p>
    </div>
    <button class="key ghost sm" type="button" on:click={() => (rangesOpen = true)}>How ranks work</button>
  </header>

  <div class="cols" aria-hidden="true">
    <span>#</span><span>Player</span><span class="c-diff">Difficulty</span><span class="c-acc">Accuracy</span><span>Speed</span>
  </div>

  {#if loading}
    <div class="list" role="status" aria-live="polite" aria-label="Loading leaderboard">
      {#each skeletonRows as _, index}
        <div class="row" style={`--delay:${index * 90}ms`}>
          <span class="sk w-s"></span><span class="sk w-l"></span><span class="sk w-m c-diff"></span><span class="sk w-m c-acc"></span><span class="sk w-l"></span>
        </div>
      {/each}
    </div>
  {:else if rows.length === 0}
    <p class="empty">No runs on this board yet. Finish a run and submit it to take first place.</p>
  {:else}
    <ol class="list">
      {#each rows as row, index}
        {@const tier = getTier(row.wpm, row.accuracy)}
        {#if startsTier(index)}
          <li class="tier" style={`--tier:${tier.color}`} aria-hidden="true">
            <span class="gem"></span>
            <strong>{tier.label}</strong>
            <span class="need">{tier.minWpm}+ WPM and {tier.minAcc}%+ accuracy</span>
          </li>
        {/if}
        <li class="row" style={`--tier:${tier.color};--fill:${(row.wpm / maxWpm) * 100}%`}>
          <span class="rank mono">{(page - 1) * PAGE_SIZE + index + 1}</span>
          <span class="who">
            <strong>{row.userName}</strong>
            <small>{day(row.createdAt)}</small>
          </span>
          <span class="c-diff tag">{row.difficulty}</span>
          <span class="c-acc mono">{row.accuracy.toFixed(1)}%</span>
          <span class="speed">
            <span><b class="mono">{row.wpm.toFixed(1)}</b> <small>WPM</small></span>
            <span class="meter" aria-hidden="true"><i></i></span>
          </span>
        </li>
      {/each}
    </ol>
  {/if}

  {#if totalPages > 1}
    <nav class="pager" aria-label="Pages">
      <button class="pg arrow" type="button" aria-label="Previous page" on:click={() => onPageChange(page - 1)} disabled={page <= 1 || loading}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
      {#each pageList as p}
        {#if p === '…'}
          <span class="gap" aria-hidden="true">…</span>
        {:else}
          <button class="pg mono" class:on={p === page} type="button" aria-label={`Page ${p}`} aria-current={p === page ? 'page' : undefined} on:click={() => onPageChange(p)} disabled={loading}>{p}</button>
        {/if}
      {/each}
      <button class="pg arrow" type="button" aria-label="Next page" on:click={() => onPageChange(page + 1)} disabled={page >= totalPages || loading}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
    </nav>
  {/if}
</section>

<Modal bind:open={rangesOpen} title="How ranks work" onClose={() => (rangesOpen = false)}>
  <p class="subtle intro">
    Ranks are the same for every language. A run gets the highest rank where it meets both numbers.
  </p>
  <ul class="rules">
    {#each tiers as t}
      <li style={`--tier:${t.color}`}>
        <span class="gem"></span>
        <strong>{t.label}</strong>
        <span class="need">{t.minWpm}+ WPM, {t.minAcc}%+ accuracy</span>
      </li>
    {/each}
  </ul>
</Modal>

<style>
  .board {
    padding: 1.4rem 1.4rem 1.2rem;
  }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.2rem;
  }

  h2 {
    margin: 0 0 0.2rem;
    font-size: clamp(1.4rem, 2.4vw, 1.9rem);
  }

  .head p {
    margin: 0;
    max-width: 52ch;
  }

  /* Shared grid so the header, tier rows and runs line up. */
  .cols,
  .row {
    display: grid;
    grid-template-columns: 3rem minmax(0, 1.6fr) 6.5rem 6rem minmax(9rem, 1.2fr);
    align-items: center;
    gap: 0 1rem;
  }

  .cols {
    padding: 0 1rem 0.5rem;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.35rem;
  }

  /* Rank group header: a gem, the name, and what it takes. */
  .tier {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.8rem;
    padding: 0 1rem;
    color: var(--tier);
  }

  .tier:first-child {
    margin-top: 0;
  }

  .tier strong {
    font-size: 1rem;
  }

  .need {
    margin-left: auto;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .gem {
    width: 0.8rem;
    height: 0.8rem;
    background: var(--tier);
    clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
    flex: none;
  }

  /* A run. Its tier tints the row; the meter is speed against the best run on the page. */
  .row {
    padding: 0.7rem 1rem;
    border-radius: 14px;
    background: color-mix(in srgb, var(--tier, #fff) 7%, #0b0c15);
    box-shadow: inset 3px 0 0 color-mix(in srgb, var(--tier, #fff) 80%, transparent);
  }

  .rank {
    color: var(--muted);
    font-size: 0.95rem;
  }

  .who {
    display: grid;
    min-width: 0;
  }

  .who strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .who small,
  .speed small {
    color: var(--muted);
    font-size: 0.8rem;
  }

  .tag {
    justify-self: start;
    padding: 0.1rem 0.6rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    font-size: 0.85rem;
    text-transform: capitalize;
  }

  .speed {
    display: grid;
    gap: 0.3rem;
  }

  .meter {
    display: block;
    height: 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  .meter i {
    display: block;
    height: 100%;
    width: var(--fill);
    border-radius: 4px;
    background: var(--tier);
  }

  .speed b {
    font-size: 1.25rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .empty {
    margin: 1.5rem 0;
    padding: 2rem 1rem;
    text-align: center;
    color: var(--muted);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.025);
  }

  /* Loading placeholders */
  .sk {
    height: 0.8rem;
    border-radius: 6px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05));
    background-size: 200% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    animation-delay: var(--delay, 0ms);
  }
  .w-s { width: 1.4rem; }
  .w-m { width: 3.4rem; }
  .w-l { width: 70%; }

  @keyframes shimmer {
    to { background-position: -200% 0; }
  }

  /* Pagination: numbered keys, the current page is the lit one. */
  .pager {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 1.4rem;
  }

  .pg {
    min-width: 2.4rem;
    height: 2.4rem;
    display: inline-grid;
    place-items: center;
    padding: 0 0.5rem;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    transition: background 120ms ease, color 120ms ease;
  }

  .pg:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.07);
    color: var(--text);
  }

  .pg.on {
    color: #fff;
    background: linear-gradient(180deg, #4d5cf7, #2633d4);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32), 0 2px 0 #121a80;
  }

  .pg:disabled:not(.on) {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .arrow {
    box-shadow: inset 0 0 0 1px var(--line-strong);
  }

  .gap {
    color: var(--muted);
    padding: 0 0.2rem;
  }

  /* Rank rules in the modal */
  .intro {
    margin: 0 0 1rem;
    font-size: 0.95rem;
  }

  .rules {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.4rem;
  }

  .rules li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.8rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    color: var(--tier);
  }

  @media (max-width: 760px) {
    .cols {
      display: none;
    }

    .row {
      grid-template-columns: 2rem minmax(0, 1fr) auto;
      grid-template-areas:
        'rank who speed'
        'rank diff acc';
      row-gap: 0.15rem;
    }

    .rank { grid-area: rank; }
    .who { grid-area: who; }
    .speed { grid-area: speed; justify-self: end; min-width: 6rem; }
    .c-diff { grid-area: diff; justify-self: start; }
    .c-acc {
      grid-area: acc;
      justify-self: end;
      font-size: 0.85rem;
      color: var(--muted);
    }
    .need { display: none; }
    .head { flex-direction: column; }
  }

  @media (prefers-reduced-motion: reduce) {
    .sk { animation: none; }
  }
</style>
