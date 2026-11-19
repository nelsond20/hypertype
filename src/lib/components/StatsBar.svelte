<script lang="ts">
  export let wpm = 0;
  export let accuracy = 0;
  export let timeLeft = 0;
  export let combo = 0;
  export let progress = 0;
</script>

<section class="stats panel" aria-label="Live typing statistics">
  <div>
    <span class="label">WPM</span>
    <strong>{wpm.toFixed(1)}</strong>
  </div>
  <div>
    <span class="label">Accuracy</span>
    <strong>{accuracy.toFixed(1)}%</strong>
  </div>
  <div>
    <span class="label">Time</span>
    <strong>{timeLeft}s</strong>
  </div>
  <div>
    <span class="label">Combo</span>
    <strong>{combo}</strong>
  </div>
  <div class="progress-wrap">
    <span class="label">Progress</span>
    <div class="track" aria-hidden="true">
      <div class="fill" style={`width:${Math.min(100, Math.max(0, progress * 100))}%`}></div>
    </div>
  </div>
</section>

<style>
  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.6rem;
    padding: 0;
    background: none;
    border: 0;
    box-shadow: none;
    backdrop-filter: none;
    border-radius: 0;
  }

  .stats > div:not(.progress-wrap) {
    padding: 0.55rem 0.9rem 0.65rem;
    border: 1px solid var(--line-strong);
    border-bottom: 4px solid #05060c;
    border-radius: 11px;
    background: linear-gradient(180deg, #1b1d2d, #12131f);
  }

  .label {
    display: block;
    color: var(--muted);
    font-size: 0.78rem;
    margin-bottom: 0.1rem;
  }

  strong {
    font-size: 1.5rem;
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
  }

  .progress-wrap {
    grid-column: 1 / -1;
  }

  .progress-wrap .label {
    display: none;
  }

  .track {
    height: 0.4rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: var(--cobalt);
    transition: width 120ms linear;
  }

  @media (max-width: 700px) {
    .stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
