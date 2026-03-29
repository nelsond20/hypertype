<script lang="ts">
  import { browser } from '$app/environment';
  import { onDestroy, onMount } from 'svelte';
  import { nanoid } from 'nanoid';
  import Modal from './Modal.svelte';
  import StatsBar from './StatsBar.svelte';
  import TextDisplay from './TextDisplay.svelte';
  import { generateCorpusText } from '$lib/shared/corpus';
  import { calculateAccuracy, calculateWpm, deriveScore } from '$lib/shared/scoring';
  import { defaultPreferences, savePreferences } from '$lib/shared/preferences';
  import type { GameSettings, RawKeyEvent, ScoreRecord } from '$lib/shared/types';

  export let settings: GameSettings = defaultPreferences;

  let seeded = Math.floor(Math.random() * 1_000_000_000);
  let gameId = nanoid();
  let prompt = '';
  let typed = '';
  let previousTyped = '';
  let startedAt = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  let timeLeft: number = settings.durationSeconds;
  let finished = false;
  let submitting = false;
  let shareOpen = false;
  let message = '';
  let rawEvents: RawKeyEvent[] = [];
  let backspaces = 0;
  let combo = 0;
  let bestCombo = 0;
  let submittedAt: string | null = null;
  let inputEl: HTMLTextAreaElement | null = null;
  let error = '';
  let clock = Date.now();
  let correctChars = 0;

  function resetGame(nextSettings = settings) {
    settings = nextSettings;
    savePreferences(settings);
    seeded = Math.floor(Math.random() * 1_000_000_000);
    gameId = nanoid();
    const generated = generateCorpusText({
      difficulty: settings.difficulty,
      language: settings.language,
      seed: seeded,
      textLength: settings.textLength
    });
    prompt = generated.text;
    typed = '';
    previousTyped = '';
    startedAt = 0;
    timeLeft = settings.durationSeconds;
    finished = false;
    submitting = false;
    shareOpen = false;
    message = '';
    error = '';
    rawEvents = [];
    backspaces = 0;
    combo = 0;
    bestCombo = 0;
    submittedAt = null;
    clock = Date.now();
    if (inputEl) {
      inputEl.value = '';
      inputEl.focus();
    }
  }

  function startTimer() {
    if (timer) return;
    startedAt = Date.now();
    timer = setInterval(() => {
      if (!startedAt) return;
      clock = Date.now();
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      timeLeft = Math.max(0, settings.durationSeconds - elapsedSeconds);
      if (timeLeft <= 0) {
        finish();
      }
    }, 250);
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function prefixMatches(source: string, target: string) {
    let count = 0;
    for (let index = 0; index < source.length; index += 1) {
      if (source[index] !== target[index]) break;
      count += 1;
    }
    return count;
  }

  function onTypingInput() {
    if (finished) return;
    if (!startedAt) startTimer();

    const current = inputEl?.value ?? '';
    const now = Date.now();
    const isDeletion = current.length < previousTyped.length;
    const added = current.length > previousTyped.length ? current.slice(previousTyped.length) : '';

    if (isDeletion) {
      backspaces += previousTyped.length - current.length;
      combo = 0;
      rawEvents.push({ key: 'Backspace', ts: now, type: 'backspace' });
    } else if (added) {
      for (const [index, key] of [...added].entries()) {
        rawEvents.push({ key, ts: now, type: 'input' });
        const promptIndex = previousTyped.length + index;
        if (key === prompt[promptIndex]) {
          combo += 1;
          bestCombo = Math.max(bestCombo, combo);
        } else {
          combo = 0;
        }
      }
    }

    typed = current.slice(0, prompt.length);
    previousTyped = current;
    clock = now;
    if (typed === prompt || timeLeft === 0) {
      finish();
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    stopTimer();
    if (!startedAt) startedAt = Date.now();
    const elapsedMs = Math.max(1000, Date.now() - startedAt);
    const correctChars = prefixMatches(typed, prompt);
    const keystrokes = typed.length + backspaces;
    const wrongChars = Math.max(0, keystrokes - correctChars);
    const score = {
      gameId,
      userName: settings.playerName || 'Guest123',
      durationMs: elapsedMs,
      correctChars,
      wrongChars,
      keystrokes,
      difficulty: settings.difficulty,
      language: settings.language,
      seed: seeded,
      ...deriveScore({ correctChars, keystrokes, durationMs: elapsedMs })
    };
    submittedAt = new Date().toISOString();
    if (browser) {
      sessionStorage.setItem('hypertype:lastScore', JSON.stringify({ ...score, prompt }));
    }
  }

  async function submitScore() {
    if (!finished || submitting) return;
    submitting = true;
    error = '';
    const payload: ScoreRecord = {
      gameId,
      userName: settings.playerName || 'Guest123',
      durationMs: Math.max(1000, Date.now() - startedAt),
      correctChars: prefixMatches(typed, prompt),
      wrongChars: Math.max(0, typed.length + backspaces - prefixMatches(typed, prompt)),
      keystrokes: typed.length + backspaces,
      difficulty: settings.difficulty,
      language: settings.language,
      seed: seeded,
      ...deriveScore({
        correctChars: prefixMatches(typed, prompt),
        keystrokes: typed.length + backspaces,
        durationMs: Math.max(1000, Date.now() - startedAt)
      })
    };

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          rawEvents
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? 'Unable to submit score');
      }
      message = 'Score saved to the leaderboard.';
      submittedAt = new Date().toISOString();
      shareOpen = true;
      if (browser) {
        sessionStorage.setItem('hypertype:lastScore', JSON.stringify({ ...payload, prompt }));
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unable to submit score';
    } finally {
      submitting = false;
    }
  }

  function retry() {
    resetGame(settings);
    if (inputEl) inputEl.focus();
  }

  async function shareResult() {
    const text = `HyperType: ${settings.difficulty} / ${settings.language} - WPM ${liveWpm.toFixed(1)} at ${liveAccuracy.toFixed(1)}% accuracy.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'HyperType score',
          text
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        message = 'Score copied to clipboard.';
      }
    } catch {
      message = 'Share cancelled.';
    }
  }

  let liveWpm = 0;
  let liveAccuracy = 100;
  let progress = 0;

  $: correctChars = prefixMatches(typed, prompt);
  $: liveWpm = calculateWpm(correctChars, Math.max(1000, startedAt ? clock - startedAt : 1000));
  $: liveAccuracy = calculateAccuracy(correctChars, Math.max(1, typed.length + backspaces));
  $: progress = prompt ? correctChars / prompt.length : 0;

  onMount(() => {
    const stored = browser ? sessionStorage.getItem('hypertype:lastSettings') : null;
    if (stored) {
      try {
        settings = { ...settings, ...JSON.parse(stored) };
      } catch {
        // ignore malformed saved settings
      }
    }
    resetGame(settings);
    const handler = () => inputEl?.focus();
    window.addEventListener('pointerdown', handler);
    return () => window.removeEventListener('pointerdown', handler);
  });

  onDestroy(() => stopTimer());
</script>

<div class="game-grid">
  <div class="stack">
    <StatsBar wpm={liveWpm} accuracy={liveAccuracy} {timeLeft} {combo} {progress} />
    <TextDisplay target={prompt} {typed} />
    <textarea
      bind:this={inputEl}
      aria-label="Type the code shown above"
      class="capture"
      autocapitalize="off"
      autocomplete="off"
      spellcheck="false"
      rows="8"
      on:input={onTypingInput}
      placeholder="Start typing..."></textarea>
    <div class="actions">
      <button class="button primary" type="button" on:click={() => inputEl?.focus()}>Focus typing area</button>
      <button class="button ghost" type="button" on:click={retry}>Retry</button>
      <button class="button ghost" type="button" on:click={shareResult} disabled={!finished}>Share</button>
    </div>
  </div>

  <aside class="side panel">
    <h3>Session</h3>
    <p class="subtle">Language <span class="mono">{settings.language}</span></p>
    <p class="subtle">Difficulty <span class="mono">{settings.difficulty}</span></p>
    <p class="subtle">Length <span class="mono">{settings.textLength}</span></p>
    <p class="subtle">Seed <span class="mono">{seeded}</span></p>

    {#if finished}
      <div class="result">
        <strong>{liveWpm.toFixed(1)} WPM</strong>
        <p class="subtle">{liveAccuracy.toFixed(1)}% accuracy</p>
        <div class="buttons">
      <button class="button primary" type="button" on:click={submitScore} disabled={submitting}>Submit score</button>
          <button class="button ghost" type="button" on:click={retry}>Retry</button>
        </div>
        {#if message}
          <p class="subtle">{message}</p>
        {/if}
        {#if error}
          <p class="error">{error}</p>
        {/if}
      </div>
    {:else}
      <div class="help">
        <h4>How to play</h4>
        <ol>
          <li>Click or tap the typing area.</li>
          <li>Type the code as shown, including punctuation.</li>
          <li>Fix mistakes with backspace before time runs out.</li>
        </ol>
      </div>
    {/if}
  </aside>
</div>

<Modal bind:open={shareOpen} title="Share your score" onClose={() => (shareOpen = false)}>
  <p class="subtle">Share your result or copy it to your clipboard.</p>
  <div class="modal-actions">
    <button class="button primary" type="button" on:click={shareResult}>Share</button>
    <button class="button ghost" type="button" on:click={() => (shareOpen = false)}>Close</button>
  </div>
</Modal>

<style>
  .game-grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(280px, 0.9fr);
    gap: 1rem;
    padding: 0.5rem 0 2rem;
  }

  .stack {
    display: grid;
    gap: 1rem;
  }

  .capture {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    opacity: 0;
  }

  .actions,
  .buttons,
  .modal-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .side {
    padding: 1.1rem;
    align-self: start;
    position: sticky;
    top: 1rem;
  }

  h3,
  h4 {
    margin: 0 0 0.8rem;
  }

  .side p,
  .side ol {
    margin: 0 0 0.75rem;
  }

  .help ol {
    padding-left: 1.2rem;
    color: var(--muted);
  }

  .result {
    display: grid;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--line);
  }

  .result strong {
    font-size: 2rem;
    font-family: var(--mono);
  }

  .error {
    color: var(--danger);
  }

  @media (max-width: 920px) {
    .game-grid {
      grid-template-columns: 1fr;
    }

    .side {
      position: static;
    }
  }
</style>
