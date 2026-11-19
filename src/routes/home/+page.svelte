<script lang="ts">
  import { onMount } from 'svelte';
  import BentoCard from '$lib/components/BentoCard.svelte';
  import BentoGrid from '$lib/components/BentoGrid.svelte';
  import KeycapOrb from '$lib/components/KeycapOrb.svelte';
  import type { Keycap } from '$lib/components/keycap-orb/geometry';
  import type { LeaderboardItem } from '$lib/domain/game/types';

  // The centre cap faces you; the list reads outward from it.
  const keys: Keycap[] = [
    { label: 'TS', finish: 'cobalt', hotkey: 't' },
    { label: 'JS', finish: 'ink', hotkey: 'j' },
    { icon: 'braces', finish: 'ash' },
    { label: 'Py', finish: 'ink', hotkey: 'p' },
    { icon: 'bolt', finish: 'ash' },
    { label: 'SQL', finish: 'ink', hotkey: 's' },
    { label: 'Rs', finish: 'glass', hotkey: 'r' },
    { icon: 'terminal', finish: 'ink' },
    { icon: 'code', finish: 'ink' },
    { icon: 'check', finish: 'lime' },
    { icon: 'hash', finish: 'ash' },
    { label: 'Go', finish: 'cobalt', hotkey: 'g' },
    { icon: 'search', finish: 'ink' },
    { icon: 'cursor', finish: 'ash' },
    { icon: 'slash', finish: 'ink' },
    { icon: 'layers', finish: 'glass' },
    { icon: 'chevrons', finish: 'ash' },
    { icon: 'none', finish: 'ink' },
    { icon: 'arrow', finish: 'ink' },
    { icon: 'none', finish: 'cobalt' },
  ];

  const snippet = `const prompt = generateCorpusText({
  difficulty: 'medium',
  language: 'typescript',
  seed: 124578,
});`;

  let shown = snippet;
  let top: LeaderboardItem[] = [];
  let boardState: 'loading' | 'ready' | 'empty' | 'error' = 'loading';

  onMount(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!calm) {
      let i = 0;
      shown = '';
      timer = setInterval(() => {
        i += 1;
        shown = snippet.slice(0, i);
        if (i >= snippet.length + 24) i = 0;
      }, 55);
    }

    fetch('/api/leaderboard?page=1&pageSize=5')
      .then((r) => r.json())
      .then((data) => {
        top = data?.items ?? [];
        boardState = top.length ? 'ready' : 'empty';
      })
      .catch(() => (boardState = 'error'));

    return () => timer && clearInterval(timer);
  });

  const langs = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'SQL', 'Go'];
  const levels = [
    { name: 'Easy', note: 'short, forgiving lines' },
    { name: 'Medium', note: 'real functions and types' },
    { name: 'Hard', note: 'dense, symbol-heavy code' },
  ];
</script>

<svelte:head>
  <title>HyperType</title>
</svelte:head>

<section class="hero shell">
  <div class="copy">
    <h1 style="--i:0">HyperType turns code into a fast, replayable typing arena.</h1>
    <p class="lede" style="--i:1">
      Type real snippets in six languages, watch your WPM and accuracy move as you go, and put the
      run on a public leaderboard.
    </p>
    <div class="cta" style="--i:2">
      <a class="key primary" href="/play">Play now</a>
      <a class="key" href="/leaderboard">See the leaderboard</a>
    </div>
    <p class="hint subtle" style="--i:3">Try it: drag the keys, or click the ball and type.</p>
  </div>

  <div class="orb-wrap">
    <KeycapOrb {keys} rings={11} scale={0.78} height="100%" ariaLabel="A ball of keycaps carrying language names. Drag to spin it, press a cap, or focus it and type." />
  </div>
</section>

<section class="shell bento-section" aria-label="What you get">
  <BentoGrid>
    <BentoCard
      class="b-snippet"
      name="Real code, seeded"
      description="Every run is generated from a seed, so a score can be replayed and compared fairly."
      href="/play"
      cta="Start a run"
    >
      <pre class="code" aria-hidden="true"><code>{shown}<span class="caret"></span></code></pre>
    </BentoCard>

    <BentoCard
      class="b-board"
      name="Public leaderboard"
      description="Top runs by difficulty and language."
      href="/leaderboard"
      cta="Open the board"
    >
      {#if boardState === 'ready'}
        <ol class="rows">
          {#each top as row, i}
            <li>
              <span class="pos mono">{i + 1}</span>
              <span class="who">{row.userName}</span>
              <span class="wpm mono">{row.wpm.toFixed(0)}</span>
            </li>
          {/each}
        </ol>
      {:else if boardState === 'loading'}
        <p class="subtle">Loading scores…</p>
      {:else if boardState === 'empty'}
        <p class="subtle">No scores yet. Yours could be the first.</p>
      {:else}
        <p class="subtle">The board could not load. Try again in a moment.</p>
      {/if}
    </BentoCard>

    <BentoCard
      class="b-live"
      name="Live feedback"
      description="WPM, accuracy and combo update on every key."
    >
      <div class="chips">
        <span class="chip"><small>WPM</small><strong class="mono">82.4</strong></span>
        <span class="chip"><small>Accuracy</small><strong class="mono">96.1%</strong></span>
        <span class="chip"><small>Combo</small><strong class="mono">38</strong></span>
      </div>
    </BentoCard>

    <BentoCard
      class="b-langs"
      name="Six languages"
      description="Pick the one you actually write."
    >
      <div class="chips">
        {#each langs as l}<span class="chip small mono">{l}</span>{/each}
      </div>
    </BentoCard>

    <BentoCard
      class="b-levels"
      name="Three difficulties"
      description="From warm-up lines to symbol-heavy code."
    >
      <ul class="levels">
        {#each levels as l}
          <li><strong>{l.name}</strong><span class="subtle">{l.note}</span></li>
        {/each}
      </ul>
    </BentoCard>
  </BentoGrid>
</section>

<style>
  .hero {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    min-height: min(44rem, calc(100svh - 5rem));
  }

  .copy {
    position: relative;
    z-index: 2;
    padding: 2rem 0;
    max-width: 34rem;
  }

  h1 {
    margin: 0 0 1.1rem;
    font-size: clamp(2.4rem, 4.6vw, 4.1rem);
    font-weight: 700;
  }

  .lede {
    max-width: 44ch;
    margin: 0 0 1.8rem;
    font-size: 1.1rem;
    color: var(--ash);
  }

  .cta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .hint {
    margin: 1.4rem 0 0;
    font-size: 0.9rem;
  }

  /* The one entrance on this page: the copy rises in sequence, the ball drops in and settles. */
  .copy > * {
    animation: rise 760ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    animation-delay: calc(var(--i) * 80ms + 120ms);
  }

  .orb-wrap {
    animation: drop 1300ms cubic-bezier(0.2, 0.9, 0.25, 1) 80ms both;
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(26px);
    }
  }

  @keyframes drop {
    from {
      opacity: 0;
      transform: translateY(-36px) scale(0.93);
    }
  }

  /* The orb runs off the right edge of the viewport; its edges fade into the page. */
  .orb-wrap {
    position: absolute;
    top: 0;
    bottom: 0;
    right: calc(50% - 50vw);
    width: min(64vw, 62rem);
    -webkit-mask-image:
      linear-gradient(90deg, transparent 0, #000 22%),
      linear-gradient(0deg, transparent 0, #000 16%),
      linear-gradient(180deg, transparent 0, #000 8%);
    -webkit-mask-composite: source-in;
    mask-image:
      linear-gradient(90deg, transparent 0, #000 22%),
      linear-gradient(0deg, transparent 0, #000 16%),
      linear-gradient(180deg, transparent 0, #000 8%);
    mask-composite: intersect;
  }

  .bento-section {
    padding: 2rem 0 1rem;
  }

  :global(.b-snippet) { grid-column: 1 / -1; }
  :global(.b-board) { grid-column: 1 / -1; }

  @media (min-width: 900px) {
    :global(.b-snippet) { grid-column: 1 / 3; grid-row: 1; }
    :global(.b-board) { grid-column: 3; grid-row: 1 / 4; }
    :global(.b-live) { grid-column: 1; grid-row: 2; }
    :global(.b-langs) { grid-column: 2; grid-row: 2; }
    :global(.b-levels) { grid-column: 1 / 3; grid-row: 3; }
  }

  .code {
    margin: 0;
    font-family: var(--mono);
    font-size: clamp(0.8rem, 1.5vw, 0.98rem);
    line-height: 1.7;
    color: var(--ash);
    white-space: pre-wrap;
  }

  .caret {
    display: inline-block;
    width: 0.55em;
    height: 1.1em;
    margin-left: 1px;
    vertical-align: text-bottom;
    background: var(--accent);
    animation: blink 1s steps(2) infinite;
  }

  @keyframes blink {
    50% { opacity: 0; }
  }

  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.35rem;
  }

  .rows li {
    display: grid;
    grid-template-columns: 1.6rem 1fr auto;
    gap: 0.6rem;
    align-items: center;
    padding: 0.55rem 0.7rem;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.03);
  }

  .rows li:first-child {
    background: rgba(38, 51, 212, 0.22);
  }

  .pos { color: var(--muted); }
  .who { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wpm { color: var(--text); }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .chip {
    display: grid;
    gap: 0.1rem;
    padding: 0.6rem 0.9rem 0.7rem;
    border-radius: 12px;
    background: #05060b;
    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .chip small { color: var(--muted); font-size: 0.78rem; }
  .chip strong { font-size: 1.35rem; }
  .chip.small { padding: 0.4rem 0.8rem 0.5rem; font-size: 0.85rem; }

  .levels {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.5rem;
  }

  .levels li {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 0.9rem;
    align-items: baseline;
  }

  @media (max-width: 899px) {
    .hero {
      min-height: 0;
    }
    .orb-wrap {
      position: relative;
      order: -1;
      right: auto;
      width: auto;
      height: 24rem;
      margin: 0 calc(50% - 50vw);
    }
    .copy {
      padding-top: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .caret { animation: none; }
  }
</style>
