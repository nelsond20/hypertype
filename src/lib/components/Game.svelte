<script lang="ts">
  import { browser } from '$app/environment';
  import { onDestroy, onMount } from 'svelte';
  import { nanoid } from 'nanoid';
  import Modal from './Modal.svelte';
  import StatsBar from './StatsBar.svelte';
  import TextDisplay from './TextDisplay.svelte';
  import {
    defaultPreferences,
    savePreferences,
  } from '$lib/application/preferences/local-game-preferences';
  import { getCorpusText } from '$lib/application/game/get-corpus-text';
  import {
    calculateAccuracy,
    calculateWpm,
    deriveScore,
  } from '$lib/domain/game/scoring';
  import type {
    GameSettings,
    RawKeyEvent,
    ScoreRecord,
  } from '$lib/domain/game/types';

  export let settings: GameSettings = defaultPreferences;

  function buildPrompt(nextSettings: GameSettings, seed: number) {
    return getCorpusText({
      difficulty: nextSettings.difficulty,
      language: nextSettings.language,
      textLength: nextSettings.textLength,
      seed,
    }).text;
  }

  let seeded = Math.floor(Math.random() * 1_000_000_000);
  let gameId = nanoid();
  let prompt = buildPrompt(settings, seeded);
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
  let error = '';
  let clock = Date.now();
  let correctChars = 0;
  let isCaptureActive = false;

  function focusCapture() {
    isCaptureActive = true;
  }

  function applyVirtualKey(key: string) {
    if (finished) return;
    const previous = typed;
    let current = typed;

    if (key === 'Backspace') {
      current = current.slice(0, -1);
    } else if (key === 'Enter') {
      current = `${current}\n`;
    } else if (key.length === 1) {
      current = `${current}${key}`;
    } else {
      return;
    }

    onTypingInput(previous, current.slice(0, prompt.length));
  }

  function onGlobalKeydown(event: KeyboardEvent) {
    if (finished || event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    const isEditableTarget =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable);

    if (isEditableTarget) return;

    if (event.key === 'Tab') {
      event.preventDefault();
      focusCapture();
      return;
    }

    if (!isCaptureActive) {
      if (event.key === 'Backspace' || event.key === 'Enter' || event.key.length === 1) {
        event.preventDefault();
        focusCapture();
        applyVirtualKey(event.key);
      }
      return;
    }

    if (event.key === 'Escape') {
      isCaptureActive = false;
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Enter' || event.key.length === 1) {
      event.preventDefault();
      applyVirtualKey(event.key);
    }
  }

  function onPromptAreaKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || (event.key === ' ' && !isCaptureActive)) {
      event.preventDefault();
      focusCapture();
    }
  }

  function resetGame(nextSettings = settings) {
    settings = nextSettings;
    savePreferences(settings);
    seeded = Math.floor(Math.random() * 1_000_000_000);
    gameId = nanoid();
    prompt = buildPrompt(settings, seeded);
    typed = '';
    previousTyped = '';
    startedAt = 0;
    timeLeft = settings.durationSeconds;
    finished = false;
    submitting = false;
    shareOpen = false;
    message = '';
    error = '';
    isCaptureActive = false;
    rawEvents = [];
    backspaces = 0;
    combo = 0;
    bestCombo = 0;
    submittedAt = null;
    clock = Date.now();
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

  function onTypingInput(previous = typed, current = typed) {
    if (finished) return;
    if (!startedAt) startTimer();
    const now = Date.now();
    const isDeletion = current.length < previous.length;
    const added = current.length > previous.length ? current.slice(previous.length) : '';

    if (isDeletion) {
      backspaces += previous.length - current.length;
      combo = 0;
      rawEvents.push({ key: 'Backspace', ts: now, type: 'backspace' });
    } else if (added) {
      for (const [index, key] of [...added].entries()) {
        rawEvents.push({ key, ts: now, type: 'input' });
        const promptIndex = previous.length + index;
        if (key === prompt[promptIndex]) {
          combo += 1;
          bestCombo = Math.max(bestCombo, combo);
        } else {
          combo = 0;
        }
      }
    }

    typed = current.slice(0, prompt.length);
    previousTyped = typed;
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
    focusCapture();
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
    const handler = () => {
      if (isCaptureActive) {
        focusCapture();
      }
    };
    window.addEventListener('pointerdown', handler);
    window.addEventListener('keydown', onGlobalKeydown);
    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', onGlobalKeydown);
    };
  });

  $: if (!prompt) {
    prompt = buildPrompt(settings, seeded);
  }

  onDestroy(() => stopTimer());
</script>

<div class="game-grid">
  <div class="stack">
    <StatsBar wpm={liveWpm} accuracy={liveAccuracy} {timeLeft} {combo} {progress} />
    <div
      class:ready={isCaptureActive}
      class="prompt-area"
      role="button"
      tabindex="0"
      aria-label="Focus the typing area"
      on:click={focusCapture}
      on:keydown={onPromptAreaKeydown}>
      <div class="capture-status">
        <strong>{isCaptureActive ? 'Keyboard ready' : 'Press any key or click here to start typing'}</strong>
        <span class="subtle">
          {isCaptureActive
            ? 'Your keystrokes are being captured now. Press Esc to pause.'
            : 'The first key will arm the session and start the timer.'}
        </span>
      </div>
      <TextDisplay target={prompt} {typed} />
    </div>
    <div class="actions">
      <button class="button primary" type="button" on:click={focusCapture}>
        {isCaptureActive ? 'Typing active' : 'Start typing'}
      </button>
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

  .prompt-area {
    display: grid;
    gap: 0.8rem;
    border-radius: var(--radius);
    outline: none;
  }

  .prompt-area:focus-visible {
    box-shadow: 0 0 0 2px rgba(115, 224, 196, 0.45);
  }

  .capture-status {
    display: grid;
    gap: 0.2rem;
    padding: 0.9rem 1rem;
    border: 1px dashed rgba(159, 176, 204, 0.32);
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.02);
  }

  .prompt-area.ready .capture-status {
    border-color: rgba(115, 224, 196, 0.45);
    background: rgba(115, 224, 196, 0.08);
  }

  .capture-status strong {
    font-size: 0.95rem;
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
