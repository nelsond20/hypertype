<script lang="ts">
  const terminalCode = `const prompt = generateCorpusText({
  difficulty: 'medium',
  language: 'typescript',
  seed: 124578,
  textLength: 'medium'
});`;
</script>

<svelte:head>
  <title>HyperType</title>
</svelte:head>

<section class="hero">
  <div class="shell hero-grid">
    <div class="copy">
      <p class="eyebrow mono">Code corpus typing game</p>
      <h1>HyperType turns code into a fast, replayable typing arena.</h1>
      <p class="lede">
        Practice against real code snippets, track live WPM and accuracy, and submit scores to a
        persistent leaderboard powered by MongoDB.
      </p>
      <div class="cta-wrap">
        <div class="cta">
          <a class="btn-primary" href="/play">
            <span>Play now</span>
            <span class="arrow" aria-hidden="true">→</span>
          </a>
          <a class="btn-link" href="/leaderboard">View leaderboard</a>
        </div>
        <p class="cta-note mono">Start a run in one click with your saved settings.</p>
      </div>
      <ul class="meta mono">
        <li>single-player MVP</li>
        <li>difficulty-based code corpus</li>
      </ul>
    </div>

    <div class="visual panel">
      <div class="terminal">
        <div class="terminal-head">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        <pre><code>{terminalCode}</code></pre>
        <div class="terminal-footer">
          <div>
            <span class="label">WPM</span>
            <strong>82.4</strong>
          </div>
          <div>
            <span class="label">Accuracy</span>
            <strong>96.1%</strong>
          </div>
          <div>
            <span class="label">Combo</span>
            <strong>38</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="shell sections">
  <div class="section-copy">
    <p class="eyebrow mono">Why it matters</p>
    <h2>Built for the MVP you described.</h2>
    <p class="subtle">
      The first release focuses on a polished game loop, deterministic text generation, score
      submission, and a public leaderboard that can scale without changing the UI.
    </p>
  </div>

  <div class="grid">
    <article>
      <h3>Game feel</h3>
      <p>Live WPM, error highlighting, combo feedback, timer pressure, and responsive capture.</p>
    </article>
    <article>
      <h3>Code corpus</h3>
      <p>Difficulty and language both matter. The prompt generator uses seeded code snippets for reproducibility.</p>
    </article>
    <article>
      <h3>Persistence</h3>
      <p>Scores go through serverless API routes and land in MongoDB with leaderboard pagination.</p>
    </article>
  </div>
</section>

<style>
  .hero {
    padding: 0.85rem 0 1.25rem;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    gap: 1.25rem;
    align-items: center;
    min-height: clamp(24rem, 68svh, 36rem);
  }

  .copy h1 {
    font-size: clamp(1.75rem, 2.6vw, 2.25rem);
    line-height: 1.24;
    letter-spacing: -0.025em;
    margin: 0.4rem 0 1rem;
    max-width: 28ch;
    font-weight: 700;
  }

  .lede {
    max-width: 52ch;
    font-size: 0.92rem;
    line-height: 1.72;
    color: var(--muted);
    margin: 0 0 1.1rem;
  }

  .eyebrow {
    margin: 0;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.8rem;
  }

  .cta-wrap {
    display: grid;
    gap: 0.7rem;
    margin-bottom: 1rem;
    justify-items: start;
  }

  .cta {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.95rem 0.55rem 0.85rem;
    font-size: 0.88rem;
    font-weight: 600;
    font-family: var(--mono);
    letter-spacing: 0.02em;
    background: var(--accent);
    color: #04101e;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    text-decoration: none;
    transition:
      background 140ms ease,
      transform 130ms ease;
  }

  .btn-primary:hover,
  .btn-primary:focus-visible {
    background: #93ffe5;
    transform: translateY(-1px);
    outline: none;
  }

  .btn-primary .arrow {
    display: inline-block;
    transition: transform 130ms ease;
  }

  .btn-primary:hover .arrow {
    transform: translateX(3px);
  }

  .btn-link {
    display: inline-flex;
    align-items: center;
    font-size: 0.88rem;
    font-family: var(--mono);
    color: var(--muted);
    text-decoration: none;
    position: relative;
    padding-bottom: 1px;
  }

  .btn-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 1px;
    background: var(--muted);
    transition: width 180ms ease;
  }

  .btn-link:hover,
  .btn-link:focus-visible {
    color: var(--text);
    outline: none;
  }

  .btn-link:hover::after,
  .btn-link:focus-visible::after {
    width: 100%;
  }

  .cta-note {
    margin: 0;
    color: var(--muted);
    letter-spacing: 0.04em;
    font-size: 0.78rem;
  }

  .meta {
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .meta li {
    font-size: 0.78rem;
    color: var(--muted);
    padding: 0;
    border: none;
    border-radius: 0;
    background: none;
  }

  .meta li::before {
    content: '// ';
    color: var(--accent);
    opacity: 0.65;
  }

  .visual {
    padding: 1rem;
    border-radius: 30px;
  }

  .terminal {
    border-radius: 22px;
    padding: 1rem;
    background: linear-gradient(180deg, rgba(6, 11, 20, 0.8), rgba(14, 25, 42, 0.82));
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .terminal-head {
    display: flex;
    gap: 0.45rem;
    margin-bottom: 1rem;
  }

  .terminal-head .dot {
    all: unset;
    width: 12px;
    height: 12px;
    min-width: 12px;
    min-height: 12px;
    max-width: 12px;
    max-height: 12px;
    aspect-ratio: 1 / 1;
    flex: 0 0 12px;
    display: block;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    font-family: var(--mono);
    font-size: 0.92rem;
    line-height: 1.7;
    color: #d9eeff;
  }

  .terminal-footer {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .terminal-footer .label {
    display: block;
    color: var(--muted);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 0.25rem;
  }

  .terminal-footer strong {
    font-family: var(--mono);
    font-size: 1.2rem;
  }

  .sections {
    padding: 1rem 0 2rem;
  }

  .section-copy {
    margin-bottom: 1rem;
  }

  .section-copy h2 {
    margin: 0.3rem 0 0.65rem;
    font-size: clamp(1.35rem, 2.2vw, 1.75rem);
    letter-spacing: -0.025em;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .grid article {
    padding: 1rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.02);
  }

  .grid h3 {
    margin: 0 0 0.5rem;
    font-size: 0.82rem;
    font-family: var(--mono);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent);
  }

  .grid p {
    margin: 0;
    font-size: 0.88rem;
    color: var(--muted);
    line-height: 1.7;
  }

  @media (max-width: 980px) {
    .hero-grid,
    .grid {
      grid-template-columns: 1fr;
      display: grid;
    }

    .hero-grid {
      min-height: auto;
    }
  }

  @media (max-width: 640px) {
    .cta {
      width: 100%;
    }

    .cta :global(.button) {
      width: 100%;
    }
  }
</style>
