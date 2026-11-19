<script lang="ts">
  import { onMount } from 'svelte';
  import Segmented from '$lib/components/Segmented.svelte';
  import {
    defaultPreferences,
    loadPreferences,
    savePreferences,
  } from '$lib/application/preferences/local-game-preferences';
  import type { GameSettings } from '$lib/domain/game/types';
  type SelectOption = {
    value: string | number;
    label: string;
  };

  let settings: GameSettings = defaultPreferences;
  let saved = false;
  const difficultyOptions: SelectOption[] = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];
  const languageOptions: SelectOption[] = [
    { value: 'typescript', label: 'TypeScript' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'rust', label: 'Rust' },
    { value: 'sql', label: 'SQL' },
    { value: 'go', label: 'Go' },
  ];
  const lengthOptions: SelectOption[] = [
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'long', label: 'Long' },
  ];
  const durationOptions: SelectOption[] = [
    { value: 30, label: '30s' },
    { value: 45, label: '45s' },
    { value: 60, label: '60s' },
  ];
  const themeOptions: SelectOption[] = [
    { value: 'aurora', label: 'Aurora' },
    { value: 'midnight', label: 'Midnight' },
  ];

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
    <h1>Settings</h1>
    <p class="subtle">These are the defaults for every new run.</p>
  </div>

  <div class="panel form">
    <label class="field">
      <span>Player name</span>
      <input bind:value={settings.playerName} maxlength="32" />
    </label>
    <div class="group">
      <span class="name">Difficulty</span>
      <Segmented
        value={settings.difficulty}
        options={difficultyOptions}
        ariaLabel="Select difficulty"
        onChange={(next) => (settings.difficulty = next as GameSettings['difficulty'])}
      />
    </div>
    <div class="group">
      <span class="name">Language</span>
      <Segmented
        value={settings.language}
        options={languageOptions}
        ariaLabel="Select language"
        onChange={(next) => (settings.language = next as GameSettings['language'])}
      />
    </div>
    <div class="group">
      <span class="name">Length</span>
      <Segmented
        value={settings.textLength}
        options={lengthOptions}
        ariaLabel="Select text length"
        onChange={(next) => (settings.textLength = next as GameSettings['textLength'])}
      />
    </div>
    <div class="group">
      <span class="name">Duration</span>
      <Segmented
        value={settings.durationSeconds}
        options={durationOptions}
        ariaLabel="Select duration"
        onChange={(next) => (settings.durationSeconds = Number(next) as GameSettings['durationSeconds'])}
      />
    </div>
    <div class="group">
      <span class="name">Theme</span>
      <Segmented
        value={settings.theme}
        options={themeOptions}
        ariaLabel="Select theme"
        onChange={(next) => (settings.theme = next as GameSettings['theme'])}
      />
    </div>
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
    padding: 1rem 0 2rem;
    display: grid;
    gap: 1.25rem;
    max-width: 820px;
  }

  h1 {
    margin: 0 0 0.3rem;
    font-size: clamp(2.2rem, 4.4vw, 3.4rem);
  }

  .settings p {
    margin: 0;
  }

  .form {
    padding: 1.5rem;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.4rem 1.5rem;
    align-items: start;
  }

  .group {
    display: grid;
    gap: 0.45rem;
  }

  .name {
    font-size: 0.88rem;
    color: var(--muted);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    grid-column: 1 / -1;
    flex-wrap: wrap;
    padding-top: 1.2rem;
    border-top: 1px solid var(--line);
  }

  @media (max-width: 720px) {
    .form {
      grid-template-columns: 1fr;
    }
  }
</style>
