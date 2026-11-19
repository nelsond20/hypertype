<script lang="ts">
  export let target = '';
  export let typed = '';
  export let lockedError = false;

  function status(index: number) {
    if (index < typed.length) {
      return typed[index] === target[index] ? 'correct' : 'incorrect';
    }
    if (lockedError && index === typed.length) {
      return 'blocked';
    }
    return index === typed.length ? 'cursor' : 'pending';
  }
</script>

<section class="text panel" aria-label="Typing text">
  <p class="mono">
    {#each target.split('') as char, index}
      <span class:correct={status(index) === 'correct'} class:incorrect={status(index) === 'incorrect'} class:blocked={status(index) === 'blocked'} class:cursor={status(index) === 'cursor'}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    {/each}
  </p>
</section>

<style>
  .text {
    padding: 1.6rem 1.8rem;
    min-height: 280px;
    background: #05060c;
  }

  /* A new text is revealed left to right, as if typed in. */
  p {
    -webkit-mask-image: linear-gradient(100deg, #000 calc(var(--reveal) - 14%), transparent var(--reveal));
    mask-image: linear-gradient(100deg, #000 calc(var(--reveal) - 14%), transparent var(--reveal));
    animation: reveal 1000ms cubic-bezier(0.3, 0.7, 0.2, 1) both;
    margin: 0;
    font-size: clamp(1.05rem, 2vw, 1.4rem);
    line-height: 1.9;
    white-space: pre-wrap;
    word-break: break-word;
    color: rgba(179, 183, 193, 0.5);
  }

  .text {
    animation: settle 480ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }

  @keyframes reveal {
    from {
      --reveal: -14%;
    }
    to {
      --reveal: 120%;
    }
  }

  @keyframes settle {
    from {
      opacity: 0;
      transform: translateY(14px) scale(0.99);
    }
  }

  span {
    position: relative;
    border-radius: 4px;
    padding: 0 0.01em;
  }

  span.correct {
    color: var(--text);
  }

  span.incorrect {
    color: var(--danger);
    text-decoration: underline;
    text-decoration-color: rgba(255, 107, 129, 0.85);
    text-underline-offset: 0.17em;
  }

  span.blocked {
    color: var(--danger);
    background: rgba(255, 107, 129, 0.12);
  }

  span.cursor::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -0.1em;
    width: 100%;
    height: 0.16em;
    border-radius: 999px;
    background: var(--accent);
    animation: blink 1s steps(1) infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0.15;
    }
  }
</style>
