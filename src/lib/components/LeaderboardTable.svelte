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

  type Tier = {
    label: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
    className: string;
  };

  const languageDisplayName: Record<Language, string> = {
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    python: 'Python',
    rust: 'Rust',
    sql: 'SQL',
    go: 'Go'
  };

  const tierThresholds: Array<{ label: Tier['label']; className: string; minWpm: number; minAcc: number }> = [
    { label: 'Diamond', className: 'tier-diamond', minWpm: 65, minAcc: 96 },
    { label: 'Platinum', className: 'tier-platinum', minWpm: 50, minAcc: 94 },
    { label: 'Gold', className: 'tier-gold', minWpm: 35, minAcc: 91 },
    { label: 'Silver', className: 'tier-silver', minWpm: 30, minAcc: 84 },
    { label: 'Bronze', className: 'tier-bronze', minWpm: 20, minAcc: 78 }
  ];

  function getTier(wpm: number, accuracy: number): Tier {
    for (const rule of tierThresholds) {
      if (wpm >= rule.minWpm && accuracy >= rule.minAcc) {
        return { label: rule.label, className: rule.className };
      }
    }
    return { label: 'Bronze', className: 'tier-bronze' };
  }

  function isNewTierGroup(index: number) {
    if (index === 0) return true;
    const current = getTier(rows[index].wpm, rows[index].accuracy).label;
    const previous = getTier(rows[index - 1].wpm, rows[index - 1].accuracy).label;
    return current !== previous;
  }

  function getBoardTitle(language: Language | 'all') {
    if (language === 'all') return 'all languages';
    return languageDisplayName[language];
  }

  function getLanguageToneClass(language: Language | 'all') {
    if (language === 'all') return 'tone-all';
    return `tone-${language}`;
  }

  function getRangeRules() {
    return tierThresholds.map((rule) => ({
      label: rule.label,
      className: rule.className,
      rule: `WPM >= ${rule.minWpm} and ACC >= ${rule.minAcc}%`
    }));
  }
</script>

<section class="leaderboard panel">
  <div class="head">
    <div>
      <h2>
        Leaderboard of
        <span class={`language-tone ${getLanguageToneClass(selectedLanguage)}`}>
          {getBoardTitle(selectedLanguage)}
        </span>
      </h2>
      <p class="subtle">Top scores grouped by performance range.</p>
      <div class="range-controls">
        <button class="button ghost about-ranges btn-link-btn" type="button" on:click={() => (rangesOpen = true)}>
          About ranges
        </button>
      </div>
    </div>
    <div class="pager">
      <button class="button ghost nav-btn" type="button" on:click={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1 || loading}>Prev</button>
      <span class="mono">Page {page} / {totalPages}</span>
      <button class="button ghost nav-btn" type="button" on:click={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages || loading}>Next</button>
    </div>
  </div>

  <div class="table" role="table" aria-label="Leaderboard">
    <div class="row head-row" role="row">
      <span>Rank</span>
      <span>Player</span>
      <span>WPM</span>
      <span>Accuracy</span>
      <span>Difficulty</span>
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
            <span class="sk sk-when"></span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="data">
        {#each rows as row, index}
          {@const tier = getTier(row.wpm, row.accuracy)}
          {#if isNewTierGroup(index)}
            <div class="tier-separator" role="row">
              <span class={`tier-badge ${tier.className}`}>{tier.label}</span>
              <small class="subtle">range group</small>
            </div>
          {/if}
          <div class="row" role="row">
            <span class="mono">#{(page - 1) * 10 + index + 1}</span>
            <span>{row.userName}</span>
            <span class="mono">{row.wpm.toFixed(1)}</span>
            <span class="mono">{row.accuracy.toFixed(1)}%</span>
            <span>{row.difficulty}</span>
            <span class="subtle">{new Date(row.createdAt ?? Date.now()).toLocaleDateString()}</span>
          </div>
        {/each}
        {#if rows.length === 0}
          <p class="empty subtle">No scores yet. Be the first on this board.</p>
        {/if}
      </div>
    {/if}
  </div>
</section>

<Modal bind:open={rangesOpen} title="About ranges" onClose={() => (rangesOpen = false)}>
  <p class="subtle">
    Ranges are global. Score tiers use the same WPM and accuracy thresholds for all languages.
  </p>
  <div class="range-rules">
    {#each getRangeRules() as item}
      <div class="range-rule">
        <span class={`tier-badge ${item.className}`}>{item.label}</span>
        <p class="subtle">{item.rule}</p>
      </div>
    {/each}
  </div>
</Modal>

<style>
  .leaderboard {
    padding: 1rem;
    border-radius: var(--radius-sm);
  }

  .head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  h2 {
    margin: 0;
    font-size: clamp(1.1rem, 1.8vw, 1.35rem);
    letter-spacing: -0.01em;
  }

  .language-tone {
    display: inline-block;
    margin-left: 0.35rem;
    letter-spacing: 0.01em;
  }

  .tone-all {
    color: var(--muted);
  }

  .tone-typescript {
    color: #9eccff;
  }

  .tone-javascript {
    color: #ffe88a;
  }

  .tone-python {
    color: #c0d9ff;
  }

  .tone-rust {
    color: #ffc8a4;
  }

  .tone-sql {
    color: #9ef1de;
  }

  .tone-go {
    color: #a8f0ff;
  }

  .range-controls {
    margin-top: 0.5rem;
    display: flex;
    gap: 0.75rem;
    align-items: end;
    flex-wrap: wrap;
  }

  .about-ranges {
    min-height: auto;
    margin-top: 0;
    padding: 0;
    border: none;
    background: none;
    color: var(--muted);
    font-size: 0.82rem;
    font-family: var(--mono);
    letter-spacing: 0.05em;
    border-bottom: 1px solid transparent;
    border-radius: 0;
  }

  .about-ranges:hover,
  .about-ranges:focus-visible {
    color: var(--text);
    border-bottom-color: var(--muted);
    outline: none;
    transform: none;
  }

  .pager {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    margin-left: auto;
    align-self: flex-start;
  }

  .pager .mono {
    font-size: 0.82rem;
    color: var(--muted);
    letter-spacing: 0.05em;
  }

  .nav-btn {
    min-height: auto;
    padding: 0.45rem 0.7rem;
    border-radius: 10px;
    font-size: 0.8rem;
    font-family: var(--mono);
    letter-spacing: 0.03em;
  }

  .table {
    display: grid;
    gap: 0.5rem;
  }

  .row {
    display: grid;
    grid-template-columns: 0.5fr 1.2fr 0.75fr 0.9fr 0.9fr 0.9fr;
    gap: 0.75rem;
    align-items: center;
    padding: 0.68rem 0.2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 0.92rem;
  }

  .head-row {
    color: var(--muted);
    font-size: 0.8rem;
    border-top: none;
  }

  .empty {
    padding: 1rem 0.25rem 0.5rem;
  }

  .tier-separator {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.85rem 0.25rem 0.35rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }

  .tier-separator small {
    font-size: 0.73rem;
  }

  .loading-block {
    display: grid;
    gap: 0.5rem;
  }

  .skeleton-row {
    display: grid;
    grid-template-columns: 0.5fr 1.2fr 0.75fr 0.9fr 0.9fr 0.9fr;
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
  .sk-when {
    width: 70%;
  }

  .tier-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.76rem;
    border: 1px solid transparent;
    font-family: var(--mono);
    white-space: nowrap;
  }

  .tier-bronze {
    background: rgba(196, 127, 86, 0.2);
    border-color: rgba(196, 127, 86, 0.48);
    color: #f3c7aa;
  }

  .tier-silver {
    background: rgba(169, 186, 206, 0.2);
    border-color: rgba(169, 186, 206, 0.5);
    color: #dde8f6;
  }

  .tier-gold {
    background: rgba(245, 201, 83, 0.22);
    border-color: rgba(245, 201, 83, 0.52);
    color: #ffe9a5;
  }

  .tier-platinum {
    background: rgba(97, 232, 202, 0.2);
    border-color: rgba(97, 232, 202, 0.5);
    color: #b3fff0;
  }

  .tier-diamond {
    background: rgba(123, 168, 255, 0.2);
    border-color: rgba(123, 168, 255, 0.5);
    color: #cde1ff;
  }

  .range-rules {
    display: grid;
    gap: 0.55rem;
    margin: 0.85rem 0;
  }

  .range-rule {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.55rem;
  }

  .range-rule p {
    margin: 0;
    line-height: 1.4;
    font-size: 0.85rem;
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

    .range-controls {
      width: 100%;
    }

    .range-rule {
      grid-template-columns: 1fr;
      gap: 0.35rem;
    }
  }
</style>
