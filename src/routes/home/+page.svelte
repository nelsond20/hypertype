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
          <a class="button primary play-now" href="/play">Play now</a>
          <a class="button ghost" href="/leaderboard">View leaderboard</a>
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
          <span></span>
          <span></span>
          <span></span>
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
    padding: 1.5rem 0 2rem;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    gap: 1.25rem;
    align-items: center;
    min-height: calc(100svh - 7rem);
  }

  .copy h1 {
    font-size: clamp(3rem, 7vw, 6rem);
    line-height: 0.94;
    letter-spacing: -0.06em;
    margin: 0.3rem 0 1rem;
    max-width: 11ch;
  }

  .lede {
    max-width: 60ch;
    font-size: 1.08rem;
    line-height: 1.7;
    color: var(--muted);
    margin: 0 0 1.25rem;
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

  .play-now {
    padding: 1.1rem 1.7rem;
    font-size: 1rem;
    font-weight: 700;
    box-shadow: 0 18px 40px rgba(115, 224, 196, 0.18);
  }

  .cta-note {
    margin: 0;
    color: var(--accent);
    letter-spacing: 0.08em;
    font-size: 0.78rem;
  }

  .meta {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    padding: 0;
    margin: 0;
    list-style: none;
    color: var(--muted);
    font-size: 0.9rem;
  }

  .meta li {
    padding: 0.45rem 0.7rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.03);
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

  .terminal-head span {
    width: 0.7rem;
    height: 0.7rem;
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
    margin: 0.3rem 0 0.75rem;
    font-size: clamp(2rem, 4vw, 3.5rem);
    letter-spacing: -0.05em;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .grid article {
    padding: 1rem;
    border-radius: var(--radius);
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.03);
  }

  .grid h3 {
    margin: 0 0 0.55rem;
  }

  .grid p {
    margin: 0;
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
