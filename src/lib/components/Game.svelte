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
  let consentOpen = false;
  let consentChecked = false;
  let message = '';
  let rawEvents: RawKeyEvent[] = [];
  let finalScore: ScoreRecord | null = null;
  let backspaces = 0;
  let combo = 0;
  let bestCombo = 0;
  let submittedAt: string | null = null;
  let error = '';
  let clock = Date.now();
  let correctChars = 0;
  let isCaptureActive = false;
  let invalidInput = false;
  let invalidInputTimer: ReturnType<typeof setTimeout> | null = null;
  let promptAreaEl: HTMLDivElement | null = null;

  function focusCapture() {
    isCaptureActive = true;
  }

  function triggerInvalidInput() {
    invalidInput = true;
    if (invalidInputTimer) {
      clearTimeout(invalidInputTimer);
    }
    invalidInputTimer = setTimeout(() => {
      invalidInput = false;
      invalidInputTimer = null;
    }, 1000);
  }

  function applyVirtualKey(key: string) {
    if (finished) return;
    const previous = typed;
    let current = typed;
    const nextExpected = prompt[typed.length];

    if (key === 'Backspace') {
      current = current.slice(0, -1);
      invalidInput = false;
    } else if (key === 'Enter') {
      if (nextExpected !== '\n') {
        triggerInvalidInput();
        return;
      }
      current = `${current}\n`;
    } else if (key.length === 1) {
      if (key !== nextExpected) {
        triggerInvalidInput();
        return;
      }
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
    if (!isCaptureActive && (event.key === 'Enter' || event.key === ' ')) {
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
    consentOpen = false;
    consentChecked = false;
    message = '';
    error = '';
    finalScore = null;
    isCaptureActive = false;
    invalidInput = false;
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
    const score: ScoreRecord = {
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
    finalScore = score;
    submittedAt = new Date().toISOString();
    if (browser) {
      sessionStorage.setItem('hypertype:lastScore', JSON.stringify({ ...score, prompt }));
    }
  }

  async function submitScore() {
    if (!finished || submitting) return;
    if (!finalScore) return;
    submitting = true;
    error = '';
    const payload: ScoreRecord = { ...finalScore };

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

  function openSubmitConsent() {
    if (!finished || submitting) return;
    consentChecked = false;
    consentOpen = true;
  }

  async function confirmSubmitScore() {
    if (!consentChecked) return;
    consentOpen = false;
    await submitScore();
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
  $: liveWpm = finalScore
    ? finalScore.wpm
    : calculateWpm(correctChars, Math.max(1000, startedAt ? clock - startedAt : 1000));
  $: liveAccuracy = finalScore
    ? finalScore.accuracy
    : calculateAccuracy(correctChars, Math.max(1, typed.length + backspaces));
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
    const handler = (event: PointerEvent) => {
      const target = event.target;
      const clickedInsideGame =
        target instanceof Node && promptAreaEl?.contains(target);

      if (!clickedInsideGame) {
        isCaptureActive = false;
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

  $: if (!startedAt && !finished) {
    timeLeft = settings.durationSeconds;
  }

  onDestroy(() => stopTimer());
  onDestroy(() => {
    if (invalidInputTimer) {
      clearTimeout(invalidInputTimer);
    }
  });
</script>

<div class="game-grid">
  <div class="stack">
    <StatsBar wpm={liveWpm} accuracy={liveAccuracy} {timeLeft} {combo} {progress} />
    <div
      bind:this={promptAreaEl}
      class:ready={isCaptureActive}
      class:invalid={invalidInput}
      class:finished={finished && timeLeft === 0}
      class="prompt-area"
      role="button"
      tabindex="0"
      aria-label="Focus the typing area"
      on:click={focusCapture}
      on:keydown={onPromptAreaKeydown}>
      <div class="capture-status">
        <span class="dot" aria-hidden="true"></span>
        <strong>{isCaptureActive ? 'Keyboard ready' : 'Click here or press any key to start'}</strong>
        <span class="subtle">
          {isCaptureActive
            ? 'Esc pauses.'
            : 'The first key starts the timer.'}
        </span>
      </div>
      <TextDisplay target={prompt} {typed} lockedError={invalidInput} />
      {#if finished && timeLeft === 0}
        <div class="time-up-overlay panel" aria-live="polite">
          <div class="time-up-copy">
            <strong>TIME&apos;S UP</strong>
            <span class="subtle">The run ended. Start a fresh seeded session.</span>
          </div>
          <button
            class="button primary icon-button"
            type="button"
            aria-label="Retry"
            on:click={retry}>
            <span class="play-icon" aria-hidden="true"></span>
          </button>
        </div>
      {/if}
    </div>
    <!-- <div class="actions">
      <button class="button ghost" type="button" on:click={retry}>Retry</button>
    </div> -->
  </div>

  <aside class="side panel">
    <h3>This run</h3>
    <dl class="facts">
      <dt>Language</dt><dd>{settings.language}</dd>
      <dt>Difficulty</dt><dd>{settings.difficulty}</dd>
      <dt>Length</dt><dd>{settings.textLength}</dd>
      <dt>Seed</dt><dd>{seeded}</dd>
    </dl>

    {#if finished}
      <div class="result">
        <strong>{liveWpm.toFixed(1)} WPM</strong>
        <p class="subtle">{liveAccuracy.toFixed(1)}% accuracy</p>
        <div class="buttons">
          <button class="button primary" type="button" on:click={openSubmitConsent} disabled={submitting}>Submit score</button>
          <button class="button ghost" type="button" on:click={shareResult} disabled={!finished}>Share</button>
          <button class="button ghost" type="button" on:click={retry}>Retry</button>
        </div>
        <p class="legal-note subtle">
          By submitting, you agree to the
          <a href="/terms"> Terms of Service</a>,
          <a href="/privacy"> Privacy Policy</a>,
          and <a href="/data-processing"> Data Processing Notice</a>.
        </p>
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

<Modal bind:open={consentOpen} title="Consent Required" onClose={() => (consentOpen = false)}>
  <p class="subtle">
    Before submitting your score, you must accept the legal terms for data processing and public
    leaderboard publication.
  </p>
  <label class="consent-check">
    <input type="checkbox" bind:checked={consentChecked} />
    <span>
      I agree to the
      <a href="/terms">Terms of Service</a>,
      <a href="/privacy">Privacy Policy</a>,
      and <a href="/data-processing">Data Processing Notice</a>.
    </span>
  </label>
  <div class="modal-actions">
    <button class="button primary" type="button" on:click={confirmSubmitScore} disabled={!consentChecked || submitting}>
      {submitting ? 'Submitting...' : 'Accept and submit'}
    </button>
    <button class="button ghost" type="button" on:click={() => (consentOpen = false)}>Cancel</button>
  </div>
</Modal>

<style>
  .game-grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(280px, 0.9fr);
    gap: 1rem;
    padding: 0.2rem 0 1.2rem;
  }

  .stack {
    display: grid;
    gap: 0.8rem;
  }

  .prompt-area {
    display: grid;
    gap: 0.8rem;
    border-radius: var(--radius);
    outline: none;
    position: relative;
    padding: 0.8rem;
    border: 1px solid transparent;
    background: transparent;
    transition:
      border-color 180ms ease,
      box-shadow 180ms ease,
      background 180ms ease;
  }

  .prompt-area:focus-visible {
    box-shadow: 0 0 0 2px rgba(123, 136, 255, 0.45);
  }

  .capture-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.2rem 0.7rem;
    padding: 0 0.25rem;
    font-size: 0.95rem;
  }

  .dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: var(--muted);
    transition: background 160ms ease, box-shadow 160ms ease;
  }

  .prompt-area.ready .dot {
    background: #7b88ff;
    box-shadow: 0 0 0 4px rgba(123, 136, 255, 0.25);
  }


  .prompt-area.invalid {
    animation: shake 300ms ease-in-out;
    border-color: rgba(255, 107, 129, 0.88);
    box-shadow: 0 0 0 1px rgba(255, 107, 129, 0.45);
    background: rgba(255, 107, 129, 0.06);
  }


  .prompt-area.invalid :global(.text.panel) {
    border-color: rgba(255, 107, 129, 0.88);
    box-shadow: none;
  }

  .prompt-area.ready:not(.invalid):not(.finished) {
    border-color: rgba(123, 136, 255, 0.45);
    box-shadow: 0 0 0 1px rgba(123, 136, 255, 0.22);
    background: rgba(123, 136, 255, 0.04);
  }


  .capture-status strong {
    font-size: 0.95rem;
  }

  .time-up-overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    gap: 0.8rem;
    padding: 1.5rem;
    text-align: center;
    background: rgba(2, 2, 6, 0.82);
    backdrop-filter: blur(10px);
    border-radius: var(--radius);
    border: 1px solid rgba(255, 107, 129, 0.42);
    z-index: 2;
  }

  .time-up-copy {
    display: grid;
    gap: 0.45rem;
  }

  .icon-button {
    width: 3.5rem;
    height: 3.5rem;
    padding: 0;
    justify-self: center;
  }

  .play-icon {
    width: 0;
    height: 0;
    margin-left: 0.18rem;
    border-top: 0.55rem solid transparent;
    border-bottom: 0.55rem solid transparent;
    border-left: 0.95rem solid currentColor;
  }

  .time-up-overlay strong {
    font-size: clamp(1.6rem, 4vw, 2.6rem);
  }

  .actions,
  .buttons,
  .modal-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .actions :global(.button),
  .buttons :global(.button),
  .modal-actions :global(.button),
  .time-up-overlay :global(.button) {
    min-height: 2.5rem;
    padding: 0.4rem 1rem 0.5rem;
    font-size: 0.9rem;
  }

  .side {
    padding: 1.25rem;
    align-self: start;
    position: sticky;
    top: 1rem;
  }

  .facts {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem 1rem;
    margin: 0 0 1.2rem;
    font-size: 0.92rem;
  }

  .facts dt {
    color: var(--muted);
  }

  .facts dd {
    margin: 0;
    text-align: right;
    font-family: var(--mono);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  h3,
  h4 {
    margin: 0 0 0.6rem;
    font-size: 1.1rem;
  }

  .side p,
  .side ol {
    margin: 0 0 0.62rem;
    font-size: 0.88rem;
  }

  .help ol {
    padding-left: 1.2rem;
    color: var(--muted);
    display: grid;
    gap: 0.4rem;
  }

  .help {
    padding-top: 1rem;
    border-top: 1px solid var(--line);
  }

  .result {
    display: grid;
    gap: 0.75rem;
    margin-top: 0.7rem;
    padding-top: 0.7rem;
    border-top: 1px solid var(--line);
  }

  .result strong {
    font-size: 1.5rem;
    font-family: var(--mono);
  }

  .legal-note {
    margin: 0;
    font-size: 0.84rem;
    line-height: 1.5;
  }

  .legal-note a {
    color: var(--text);
    border-bottom: 1px solid transparent;
  }

  .legal-note a:hover,
  .legal-note a:focus-visible {
    border-bottom-color: var(--accent);
    outline: none;
  }

  .error {
    color: var(--danger);
  }

  .consent-check {
    display: flex;
    gap: 0.65rem;
    align-items: flex-start;
    margin: 0.8rem 0;
  }

  .consent-check input {
    margin-top: 0.2rem;
  }

  .consent-check a {
    color: var(--text);
    border-bottom: 1px solid transparent;
  }

  .consent-check a:hover,
  .consent-check a:focus-visible {
    border-bottom-color: var(--accent);
    outline: none;
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    20% {
      transform: translateX(-8px);
    }
    40% {
      transform: translateX(7px);
    }
    60% {
      transform: translateX(-5px);
    }
    80% {
      transform: translateX(4px);
    }
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
