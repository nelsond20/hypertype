<script lang="ts">
  import { onMount } from 'svelte';
  import Game from '$lib/components/Game.svelte';
  import { defaultPreferences, loadPreferences, savePreferences } from '$lib/shared/preferences';
  import type { GameSettings } from '$lib/shared/types';

  let settings: GameSettings = defaultPreferences;

  onMount(() => {
    settings = loadPreferences();
    sessionStorage.setItem('hypertype:lastSettings', JSON.stringify(settings));
  });

  function updateSettings(next: Partial<GameSettings>) {
    settings = { ...settings, ...next };
    savePreferences(settings);
    sessionStorage.setItem('hypertype:lastSettings', JSON.stringify(settings));
  }
</script>

<svelte:head>
  <title>Play HyperType</title>
</svelte:head>

<section class="shell play">
  <div class="header">
    <div>
      <p class="eyebrow mono">Focus mode</p>
      <h1>Type code. Chase clean runs. Submit a score.</h1>
      <p class="subtle">The text is seeded, the timer is real, and the leaderboard is public.</p>
    </div>
    <div class="quick panel">
      <a class="button ghost" href="/settings">Open settings</a>
      <a class="button ghost" href="/leaderboard">Leaderboard</a>
    </div>
  </div>

  <div class="controls panel">
    <label class="field">
      <span>Difficulty</span>
      <select bind:value={settings.difficulty} on:change={() => updateSettings({ difficulty: settings.difficulty })}>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </label>
    <label class="field">
      <span>Language</span>
      <select bind:value={settings.language} on:change={() => updateSettings({ language: settings.language })}>
        <option value="typescript">TypeScript</option>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="rust">Rust</option>
        <option value="sql">SQL</option>
        <option value="go">Go</option>
      </select>
    </label>
    <label class="field">
      <span>Length</span>
      <select bind:value={settings.textLength} on:change={() => updateSettings({ textLength: settings.textLength })}>
        <option value="short">Short</option>
        <option value="medium">Medium</option>
        <option value="long">Long</option>
      </select>
    </label>
    <label class="field">
      <span>Timer</span>
      <select bind:value={settings.durationSeconds} on:change={() => updateSettings({ durationSeconds: settings.durationSeconds })}>
        <option value={5}>5s</option>
        <option value={45}>45s</option>
        <option value={60}>60s</option>
      </select>
    </label>
    <label class="field">
      <span>Player name</span>
      <input bind:value={settings.playerName} on:input={() => updateSettings({ playerName: settings.playerName })} maxlength="32" />
    </label>
  </div>

  {#key `${settings.difficulty}:${settings.language}:${settings.textLength}:${settings.durationSeconds}:${settings.playerName}`}
    <Game {settings} />
  {/key}
</section>

<style>
  .play {
    padding: 0.5rem 0 2rem;
    display: grid;
    gap: 1rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: end;
  }

  .eyebrow {
    margin: 0;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.8rem;
  }

  h1 {
    margin: 0.35rem 0 0.7rem;
    font-size: clamp(2rem, 4.5vw, 3.6rem);
    letter-spacing: -0.05em;
    max-width: 14ch;
  }

  .controls {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.75rem;
    padding: 1rem;
  }

  .quick {
    display: flex;
    gap: 0.6rem;
    padding: 0.9rem;
    flex-wrap: wrap;
  }

  .field span {
    font-size: 0.88rem;
    color: var(--muted);
  }

  @media (max-width: 980px) {
    .header,
    .controls {
      grid-template-columns: 1fr;
      display: grid;
    }

    .header {
      align-items: start;
    }
  }
</style>
