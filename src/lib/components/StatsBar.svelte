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
  /* One readout strip: four numbers split by hairlines, progress along the bottom edge. */
  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding: 0.4rem 0 0;
    overflow: hidden;
  }

  .stats > div:not(.progress-wrap) {
    padding: 0.7rem 1.2rem 0.9rem;
  }

  .stats > div:not(.progress-wrap):not(:first-child) {
    border-left: 1px solid var(--line);
  }

  .label {
    display: block;
    color: var(--muted);
    font-size: 0.85rem;
    margin-bottom: 0.1rem;
  }

  strong {
    font-size: clamp(1.5rem, 2.6vw, 2rem);
    line-height: 1.1;
    font-family: var(--mono);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .progress-wrap {
    grid-column: 1 / -1;
  }

  .progress-wrap .label {
    display: none;
  }

  .track {
    height: 4px;
    background: rgba(255, 255, 255, 0.06);
  }

  .fill {
    height: 100%;
    background: linear-gradient(90deg, var(--cobalt), #7b88ff);
    transition: width 120ms linear;
  }

  @media (max-width: 700px) {
    .stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .stats > div:nth-child(3) {
      border-left: 0;
    }
    .stats > div:nth-child(n + 3):not(.progress-wrap) {
      border-top: 1px solid var(--line);
    }
  }
</style>
