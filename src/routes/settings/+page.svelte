<script lang="ts">
  import { onMount } from 'svelte';
  import {
    defaultPreferences,
    loadPreferences,
    savePreferences,
  } from '$lib/application/preferences/local-game-preferences';
  import type { GameSettings } from '$lib/domain/game/types';

  let settings: GameSettings = defaultPreferences;
  let saved = false;

  onMount(() => {
    settings = loadPreferences();
  });

  function persist() {
    savePreferences(settings);
    sessionStorage.setItem('hypertype:lastSettings', JSON.stringify(settings));
    saved = true;
    setTimeout(() => (saved = false), 1400);
  }
</script>

<svelte:head>
  <title>Settings · HyperType</title>
</svelte:head>

<section class="shell settings">
  <div>
    <p class="eyebrow mono">Preferences</p>
    <h1>Settings</h1>
    <p class="subtle">Choose the corpus style, duration, and theme you want before a run.</p>
  </div>

  <div class="panel form">
    <label class="field">
      <span>Player name</span>
      <input bind:value={settings.playerName} maxlength="32" />
    </label>
    <label class="field">
      <span>Difficulty</span>
      <select bind:value={settings.difficulty}>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </label>
    <label class="field">
      <span>Language</span>
      <select bind:value={settings.language}>
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
      <select bind:value={settings.textLength}>
        <option value="short">Short</option>
        <option value="medium">Medium</option>
        <option value="long">Long</option>
      </select>
    </label>
    <label class="field">
      <span>Duration</span>
      <select bind:value={settings.durationSeconds}>
        <option value={30}>30s</option>
        <option value={45}>45s</option>
        <option value={60}>60s</option>
      </select>
    </label>
    <label class="field">
      <span>Theme</span>
      <select bind:value={settings.theme}>
        <option value="aurora">Aurora</option>
        <option value="midnight">Midnight</option>
      </select>
    </label>
    <div class="actions">
      <button class="button primary" type="button" on:click={persist}>Save settings</button>
      <a class="button ghost" href="/play">Go to play</a>
    </div>
    {#if saved}
      <p class="subtle">Saved locally.</p>
    {/if}
  </div>
</section>

<style>
  .settings {
    padding: 0.5rem 0 2rem;
    display: grid;
    gap: 1rem;
    max-width: 820px;
  }

  .eyebrow {
    margin: 0;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.8rem;
  }

  h1 {
    margin: 0.35rem 0 0.6rem;
    font-size: clamp(2.2rem, 4vw, 4rem);
    letter-spacing: -0.05em;
  }

  .form {
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    grid-column: 1 / -1;
    flex-wrap: wrap;
  }

  @media (max-width: 720px) {
    .form {
      grid-template-columns: 1fr;
    }
  }
</style>
