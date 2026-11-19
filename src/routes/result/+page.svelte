<script lang="ts">
  import { onMount } from 'svelte';
  import type { ScoreRecord } from '$lib/domain/game/types';

  let score: (ScoreRecord & { prompt?: string }) | null = null;
  let ready = false;

  onMount(() => {
    const raw = sessionStorage.getItem('hypertype:lastScore');
    if (raw) {
      try {
        score = JSON.parse(raw);
      } catch {
        score = null;
      }
    }
    ready = true;
  });
</script>

<svelte:head>
  <title>Result · HyperType</title>
</svelte:head>

<section class="shell result">
  <h1>Run complete</h1>

  {#if !ready}
    <p class="subtle">Loading your last session...</p>
  {:else if score}
    <div class="panel card">
      <div><span>WPM</span><strong>{score.wpm.toFixed(1)}</strong></div>
      <div><span>Accuracy</span><strong>{score.accuracy.toFixed(1)}%</strong></div>
      <div><span>Errors</span><strong>{score.wrongChars}</strong></div>
      <div><span>Duration</span><strong>{Math.round(score.durationMs / 1000)}s</strong></div>
    </div>
    <div class="actions">
      <a class="button primary" href="/play">Retry</a>
      <a class="button ghost" href="/leaderboard">Leaderboard</a>
    </div>
  {:else}
    <p class="subtle">No local score found. Start a new run first.</p>
    <a class="button primary" href="/play">Play</a>
  {/if}
</section>

<style>
  .result {
    padding: 1rem 0 2rem;
    display: grid;
    gap: 1rem;
  }


  h1 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 4rem);
    letter-spacing: -0.05em;
  }

  .card {
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }

  .card span {
    display: block;
    color: var(--muted);
    font-size: 0.8rem;
    margin-bottom: 0.4rem;
  }

  .card strong {
    font-family: var(--mono);
    font-size: 1.7rem;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  @media (max-width: 720px) {
    .card {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
