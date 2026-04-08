<script lang="ts">
  import Modal from './Modal.svelte';
  import type { LeaderboardItem } from '$lib/domain/game/types';

  export let rows: LeaderboardItem[] = [];
  export let page = 1;
  export let totalPages = 1;
  export let onPageChange: (next: number) => void = () => {};
  export let loading = false;
  let rangesOpen = false;

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

  type Tier = {
    label: 'Bronze' | 'Silver' | 'Oro' | 'Platinum' | 'Diamond';
    className: string;
  };

  const tierLegend: Array<{ label: Tier['label']; rule: string; className: string }> = [
    { label: 'Bronze', rule: 'WPM >= 20 and ACC >= 78%', className: 'tier-bronze' },
    { label: 'Silver', rule: 'WPM >= 30 and ACC >= 84%', className: 'tier-silver' },
    { label: 'Oro', rule: 'WPM >= 35 and ACC >= 91%', className: 'tier-gold' },
    { label: 'Platinum', rule: 'WPM >= 50 and ACC >= 94%', className: 'tier-platinum' },
    { label: 'Diamond', rule: 'WPM >= 65 and ACC >= 96%', className: 'tier-diamond' }
  ];

  function getTier(wpm: number, accuracy: number): Tier {
    if (wpm >= 65 && accuracy >= 96) return { label: 'Diamond', className: 'tier-diamond' };
    if (wpm >= 50 && accuracy >= 94) return { label: 'Platinum', className: 'tier-platinum' };
    if (wpm >= 35 && accuracy >= 91) return { label: 'Oro', className: 'tier-gold' };
    if (wpm >= 30 && accuracy >= 84) return { label: 'Silver', className: 'tier-silver' };
    return { label: 'Bronze', className: 'tier-bronze' };
  }

  function isNewTierGroup(index: number) {
    if (index === 0) return true;
    const current = getTier(rows[index].wpm, rows[index].accuracy).label;
    const previous = getTier(rows[index - 1].wpm, rows[index - 1].accuracy).label;
    return current !== previous;
  }
</script>

<section class="leaderboard panel">
  <div class="head">
    <div>
      <h2>Leaderboard</h2>
      <p class="subtle">Top scores by difficulty and language.</p>
      <button class="button ghost about-ranges" type="button" on:click={() => (rangesOpen = true)}>
        About ranges
      </button>
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

<Modal bind:open={rangesOpen} title="About ranges" onClose={() => (rangesOpen = false)}>
  <p class="subtle">
    Ranges are assigned by combining speed and accuracy. A higher WPM only counts if accuracy also
    meets the threshold.
  </p>
  <div class="range-rules">
    {#each tierLegend as item}
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

  .about-ranges {
    margin-top: 0.6rem;
    padding: 0.55rem 0.85rem;
    font-size: 0.82rem;
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
    grid-template-columns: 0.5fr 1.1fr 0.7fr 0.85fr 0.8fr 0.95fr 0.85fr;
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
    text-transform: uppercase;
    letter-spacing: 0.09em;
  }

  .loading-block {
    display: grid;
    gap: 0.5rem;
  }

  .skeleton-row {
    display: grid;
    grid-template-columns: 0.5fr 1.1fr 0.7fr 0.85fr 0.8fr 0.95fr 0.85fr;
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

  .tier-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.76rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
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

    .range-rule {
      grid-template-columns: 1fr;
      gap: 0.35rem;
    }
  }
</style>
