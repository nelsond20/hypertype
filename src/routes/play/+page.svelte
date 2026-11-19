<script lang="ts">
  import { onMount } from 'svelte';
  import CustomSelect from '$lib/components/CustomSelect.svelte';
  import Game from '$lib/components/Game.svelte';
  import {
    defaultPreferences,
    loadPreferences,
    savePreferences,
  } from '$lib/application/preferences/local-game-preferences';
  import type { GameSettings, SessionLength } from '$lib/domain/game/types';
  type SelectOption = {
    value: string | number;
    label: string;
  };

  let settings: GameSettings = defaultPreferences;
  let gameSessionKey = `${settings.difficulty}:${settings.language}:${settings.textLength}:${settings.durationSeconds}`;
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
  const timerOptions: SelectOption[] = [
    { value: 30, label: '30s' },
    { value: 45, label: '45s' },
    { value: 60, label: '60s' },
  ];

  onMount(() => {
    settings = loadPreferences();
    refreshGameSession();
    sessionStorage.setItem('hypertype:lastSettings', JSON.stringify(settings));
  });

  function updateSettings(next: Partial<GameSettings>) {
    settings = { ...settings, ...next };
    savePreferences(settings);
    sessionStorage.setItem('hypertype:lastSettings', JSON.stringify(settings));
  }

  function refreshGameSession() {
    gameSessionKey = `${settings.difficulty}:${settings.language}:${settings.textLength}:${settings.durationSeconds}`;
  }
</script>

<svelte:head>
  <title>Play HyperType</title>
</svelte:head>

<section class="shell play">
  <div class="header">
    <div>
      <h1>Type the code. Beat the clock.</h1>
    </div>
    <!-- <div class="quick panel">
      <a class="button ghost" href="/settings">Open settings</a>
      <a class="button ghost" href="/leaderboard">Leaderboard</a>
    </div> -->
  </div>

  <div class="controls panel">
    <label class="field">
      <span>Difficulty</span>
      <CustomSelect
        value={settings.difficulty}
        options={difficultyOptions}
        ariaLabel="Select difficulty"
        onChange={(next) => {
          updateSettings({ difficulty: next as GameSettings['difficulty'] });
          refreshGameSession();
        }}
      />
    </label>
    <label class="field">
      <span>Language</span>
      <CustomSelect
        value={settings.language}
        options={languageOptions}
        ariaLabel="Select language"
        onChange={(next) => {
          updateSettings({ language: next as GameSettings['language'] });
          refreshGameSession();
        }}
      />
    </label>
    <label class="field">
      <span>Length</span>
      <CustomSelect
        value={settings.textLength}
        options={lengthOptions}
        ariaLabel="Select text length"
        onChange={(next) => {
          updateSettings({ textLength: next as GameSettings['textLength'] });
          refreshGameSession();
        }}
      />
    </label>
    <label class="field">
      <span>Timer</span>
      <CustomSelect
        value={settings.durationSeconds}
        options={timerOptions}
        ariaLabel="Select timer length"
        onChange={(next) => {
          updateSettings({ durationSeconds: Number(next) as SessionLength });
          refreshGameSession();
        }}
      />
    </label>
    <label class="field">
      <span>Player name</span>
      <input bind:value={settings.playerName} on:input={() => updateSettings({ playerName: settings.playerName })} maxlength="32" />
    </label>
  </div>

  {#key gameSessionKey}
    <Game {settings} />
  {/key}
</section>

<style>
  .play {
    padding: 1rem 0 1.6rem;
    display: grid;
    gap: 1rem;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.8rem, 3vw, 2.6rem);
    font-weight: 700;
  }

  .controls {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.75rem;
    padding: 0.9rem;
    border-radius: var(--radius-sm);
    box-shadow: none;
  }

  .field span {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .controls .field input {
    min-height: 2.9rem;
    border-radius: 10px;
    padding: 0.6rem 0.8rem;
    font-family: var(--mono);
    font-size: 0.9rem;
  }

  @media (max-width: 980px) {
    .controls {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 520px) {
    .controls {
      grid-template-columns: 1fr;
    }
  }
</style>
