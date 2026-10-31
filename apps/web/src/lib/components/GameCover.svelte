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
  .game-cover {height:220px;display:grid;place-items:center;position:relative;background:var(--bg);border:1px solid var(--border);border-radius:8px;margin:0 0 18px;padding:16px 16px 32px;overflow:hidden;}
  .game-cover img {display:block;width:100%;height:100%;min-height:0;max-height:170px;max-width:100%;object-fit:contain;}
  .game-cover>span {position:absolute;inset:auto 0 0;padding:6px 10px;border-top:1px solid var(--border);background:var(--surface2);color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.06em;text-align:center;}
  .game-cover.unavailable>span {position:static;border:0;background:none;text-transform:none;font-size:12px;max-width:150px;line-height:1.6;}
</style>
