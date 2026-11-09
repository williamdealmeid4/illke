<script>
  let { cover, name } = $props();
  let failed = $state(false);
  $effect(() => { cover?.image; failed = false; });
</script>

<div class="game-cover" class:unavailable={!cover || failed}>
  {#if cover && !failed}
    <img src={cover.image} alt={(cover.kind === 'box' ? 'Capa de ' : cover.kind === 'logo' ? 'Logotipo de ' : 'Arte de ') + name} width="240" height="240" loading="lazy" onerror={() => failed = true} />
    <span>{cover.kind === 'box' ? 'Capa original' : cover.kind === 'logo' ? 'Logotipo' : 'Arte oficial'}</span>
  {:else}
    <span>Imagem ainda não disponível</span>
  {/if}
</div>

<style>
  .game-cover {
    height: 220px;
    display: grid;
    place-items: center;
    position: relative;
    background:
      radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.07), transparent 68%),
      linear-gradient(180deg, var(--surface2), var(--bg));
    border: 1px solid var(--border);
    border-radius: 12px;
    margin: 0 0 18px;
    padding: 18px 18px 38px;
    overflow: hidden;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
  .game-cover img {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
    max-height: 162px;
    max-width: 100%;
    object-fit: contain;
    border-radius: 6px;
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.42));
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  }
  :global(.game-card:hover) .game-cover img {
    transform: scale(1.04) translateY(-2px);
  }
  .game-cover > span {
    position: absolute;
    inset: auto 0 0;
    padding: 6px 10px;
    border-top: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface2) 88%, transparent);
    backdrop-filter: blur(8px);
    color: var(--muted);
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-align: center;
  }
  .game-cover.unavailable > span {
    position: static;
    border: 0;
    background: none;
    text-transform: none;
    font-family: var(--sans);
    font-size: 12px;
    max-width: 150px;
    line-height: 1.6;
  }
</style>
