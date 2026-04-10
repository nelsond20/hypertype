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
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.75rem;
    padding: 0.85rem 0.95rem;
    border-radius: var(--radius-sm);
  }

  .label {
    display: block;
    color: var(--muted);
    font-size: 0.74rem;
    margin-bottom: 0.25rem;
    font-family: var(--mono);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  strong {
    font-size: 1.05rem;
    font-family: var(--mono);
  }

  .progress-wrap {
    grid-column: span 1;
  }

  .track {
    height: 0.55rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent-strong));
  }

  @media (max-width: 900px) {
    .stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .progress-wrap {
      grid-column: 1 / -1;
    }
  }
</style>
