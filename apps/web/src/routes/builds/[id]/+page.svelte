<script>
  import { onMount } from 'svelte';
  import { library, toggleFavorite } from '$lib/team-store.js';
  import MoveChip from "$lib/components/MoveChip.svelte";
  import EntityIcon from "$lib/components/EntityIcon.svelte";
  import ShareBuild from "$lib/components/ShareBuild.svelte";
  import { sprite, roles, statLabels, mutate } from "$lib/api.js";
  let { data } = $props();
  let b = $derived(data.build);
  let c = $derived(b.configuration);
  let message = $state("");
  let voted = $state(false);
  let saved = $state(false);
  onMount(() => { voted = !!data.build.visitor_reactions?.vote; library().then(state => saved=state.favorites.includes(data.build.public_id)).catch(e=>message=e.message); });
  async function react(kind) {
    try {
      if (kind === 'favorite') { const favorites=await toggleFavorite(b.public_id); saved=favorites.includes(b.public_id); message=saved?'Build guardada nos seus favoritos.':'Favorito removido.'; return; }
      await mutate(
        "/builds/" + b.public_id + "/reaction",
        { kind, active: kind === "vote" ? !voted : !saved },
        "PUT",
      );
      if (kind === "vote") voted = !voted;
      else saved = !saved;
      message = "Preferência atualizada.";
    } catch (e) {
      message = e.message;
    }
  }
</script>

<svelte:head><title>{b.pokemon} / {b.name} — illke</title></svelte:head>
<div class="page-header">
  <div class="breadcrumbs">
    <a href="/builds">Builds</a><span>/</span>{b.pokemon}
  </div>
  <h1>{b.pokemon} / {b.name}</h1>
  <p>
    {roles[c.role]} · {b.context_id} · {b.source_name ||
      b.author_name ||
      "Comunidade"}
  </p>
</div>
<div class="detail-grid">
  <aside>
    <img
      class="detail-art"
      src={sprite(b.pokemon)}
      alt={b.pokemon}
      width="280"
      height="260"
      style="image-rendering:pixelated"
    /><a class="button full" href={"/builder?build=" + b.public_id}
      >Usar no builder</a
    >
    <div class="actions">
      <button class="button secondary small" onclick={() => react("vote")}
        >{voted ? "Remover voto" : "Apoiar build"}</button
      ><button class="button secondary small" onclick={() => react("favorite")}
        >{saved ? "Remover favorito" : "Favoritar"}</button
      >
    </div>
    {#if message}<p class="notice" role="status">{message}</p>{/if}<ShareBuild
      build={c}
    />
  </aside>
  <div>
    <div class="content-panel" style="margin-top:0">
      <h2>Por que esta build existe</h2>
      <p style="white-space:pre-wrap">
        {c.strategy || "O autor ainda não descreveu a estratégia."}
      </p>
      <dl class="detail-data">
        <div>
          <dt>Item</dt>
          <dd class="inline-asset">
            {#if c.item}<EntityIcon
                kind="item"
                name={c.item}
                size={32}
              />{/if}{c.item || "Sem item"}
          </dd>
        </div>
        <div>
          <dt>Habilidade</dt>
          <dd class="inline-asset">
            <EntityIcon
              kind="ability"
              name={c.ability}
              size={28}
            />{c.ability || "Não se aplica"}
          </dd>
        </div>
        <div>
          <dt>Nature</dt>
          <dd>{c.nature}</dd>
        </div>
        <div>
          <dt>Nível</dt>
          <dd>{c.level}</dd>
        </div>
        {#if c.tera_type}<div>
            <dt>Tera</dt>
            <dd>{c.tera_type}</dd>
          </div>{/if}
      </dl>
      <h3 style="margin-top:25px">Golpes</h3>
      {#each c.moves as move}<MoveChip name={move} />{/each}
      <h3 style="margin-top:20px">Treinamento</h3>
      <div>
        {#each Object.entries(c.evs) as [stat, value]}{#if value}<span
              class="chip">{value} {statLabels[stat]}</span
            >{/if}{/each}
      </div>
    </div>
    <div class="notice">
      {b.legality === "legal"
        ? "Conjunto legal no formato do simulador."
        : "Este conjunto precisa de revisão de legalidade."} A taxa de sucesso exige
      avaliação com uma equipe e adversários definidos.
    </div>
    {#if b.validation_issues?.length}<details class="notice"><summary>Por que esta referência precisa de revisão?</summary><ul>{#each b.validation_issues as issue}<li>{issue}</li>{/each}</ul></details>{/if}
    {#if b.alternatives}<details class="content-panel">
        <summary>Alternativas registradas na fonte</summary>
        {#each Object.entries(b.alternatives).filter(([key])=>['moves','item','ability','nature','teratypes'].includes(key)) as [key,value]}
          <h3>{{moves:'Golpes',item:'Itens',ability:'Habilidades',nature:'Natures',teratypes:'Tipos Tera'}[key]}</h3>
          {#if key==='moves'}{#each Array.isArray(value)?value:[] as choices,slot}<p>Posição {slot+1}: {#each [choices].flat() as choice}<a class="chip" href={'/builder?build='+b.public_id+'&move_'+slot+'='+encodeURIComponent(choice)}>{choice} — usar</a>{/each}</p>{/each}
          {:else}<div class="actions">{#each [value].flat() as choice}<a class="chip" href={'/builder?build='+b.public_id+'&'+(key==='teratypes'?'tera_type':key)+'='+encodeURIComponent(choice)}>{choice} — usar</a>{/each}</div>{/if}
        {/each}
      </details>{/if}{#if b.source_url}<p class="help">
        Referência: <a
          class="text-link"
          href={b.source_url}
          rel="noreferrer">{b.source_name}</a
        >. Explicação do illke; sets pertencem aos respectivos contribuidores.
      </p>{/if}<a class="text-link" href={"/comunidade?build=" + b.id}
      >Discutir esta build</a
    >
  </div>
</div>
