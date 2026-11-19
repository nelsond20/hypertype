<!-- Bento grid: 3 columns on desktop, one on mobile. Cells place themselves with `class`. -->
<script lang="ts">
  let className = '';
  export { className as class };
</script>

<div class="bento {className}">
  <slot />
</div>

<style>
  .bento {
    display: grid;
    width: 100%;
    gap: 1rem;
    grid-template-columns: 1fr;
    grid-auto-rows: minmax(15rem, auto);
  }

  @media (min-width: 900px) {
    .bento {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-auto-rows: 15rem;
    }
  }
</style>
