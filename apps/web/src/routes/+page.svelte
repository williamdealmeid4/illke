<script>
  import TypeBadge from '$lib/components/TypeBadge.svelte';
  import ConsoleIcon from '$lib/components/ConsoleIcon.svelte';
  import { page } from '$app/state';
  import { games, consoles } from '$lib/games.js';
  import { mapFor } from '$lib/maps.js';
  import { Search, ArrowRight, ArrowUpRight, MapPin } from '@lucide/svelte';
  let { data } = $props();
  let selected=$derived(page.data.selectedGame || games.find(g=>g.id==='firered'));
  let region=$derived(mapFor(selected));
</script>
<svelte:head><title>illke — Pokédex, mapas e equipes</title><meta name="description" content="Consulte Pokémon e itens por jogo, veja locais de encontro no mapa e monte equipes."/></svelte:head>
{#if data.error}<div class="notice error" role="alert">{data.error}</div>{/if}
<div class="desk-heading"><div><h1>Pokédex e mapas</h1><p>Locais de encontro, itens e equipes por jogo.</p></div></div>
<div class="home-desk">
  <section class="dex-lookup" aria-label="Consultar Pokémon">
    <form class="global-search" action="/pokedex"><Search size={22}/><label class="sr-only" for="search">Pesquisar por nome ou número</label><input id="search" name="q" placeholder="Nome ou número da Pokédex"/><button type="submit" aria-label="Pesquisar"><ArrowRight size={20}/></button></form>
    <div class="lookup-links"><a href="/pokemon/pikachu"><img src="/api/v1/sprite/Pikachu" alt="" width="64" height="64"/>Pikachu</a><a href="/pokemon/garchomp"><img src="/api/v1/sprite/Garchomp" alt="" width="64" height="64"/>Garchomp</a><a href="/pokemon/eevee"><img src="/api/v1/sprite/Eevee" alt="" width="64" height="64"/>Eevee</a></div>
    <div class="desk-counts"><a href="/pokedex"><strong>{data.summary?.counts?.pokemon?.toLocaleString('pt-BR') || '—'}</strong> Pokémon e formas</a><a href="/itens"><strong>{data.summary?.counts?.item?.toLocaleString('pt-BR') || '—'}</strong> itens</a><a href="/builds"><strong>{data.summary?.builds?.toLocaleString('pt-BR') || '—'}</strong> builds</a></div>
    <div class="lookup-shortcuts"><a href="/itens">Buscar item</a><a href="/golpes">Consultar golpe</a><a href="/calculos">Calcular dano</a></div>
  </section>
  <section class="home-region" aria-label="Mapa do jogo"><div class="region-caption"><ConsoleIcon platform={selected.consoles[0]} size={44}/><div><h2>{selected.name}</h2><span>{selected.region} · {selected.consoles.map(c=>consoles[c]).join(' / ')}</span></div><a href="/jogos" class="text-link">Trocar jogo</a></div><a class="home-map-link" href={'/jogos/'+selected.id+'?game='+selected.id}>{#if region?.image}<img src={region.image} alt={'Mapa de '+selected.region}/>{:else}<span>Consultar mapas disponíveis</span>{/if}<span class="map-link-label"><MapPin size={16}/>Abrir mapa e locais de encontro</span></a></section>
</div>
<section class="home-catalog">
  <div class="section-heading">
    <div>
      <h2>Pokémon</h2>
    </div>
    <a href="/pokedex" class="text-link"
      >Abrir Pokédex <ArrowRight size={16} /></a
    >
  </div>
  {#if data.summary?.pokemon?.length}<div class="pokemon-grid">
      {#each data.summary.pokemon as pokemon}<a
          class="pokemon-card"
          href={"/pokemon/" + pokemon.slug}
          ><div class="pokemon-card-top">
            <span>#{String(pokemon.national_number).padStart(4, "0")}</span
            ><ArrowUpRight size={15} />
          </div>
          <div class="pokemon-image">
            {#if pokemon.image}<img
                src={pokemon.image.url}
                alt={pokemon.name}
                width="150"
                height="150"
                loading="lazy"
              />{:else}<span class="muted">Sem sprite</span>{/if}
          </div>
          <h3>{pokemon.name}</h3>
          <div class="types">
            {#each pokemon.attributes.types as type}<TypeBadge {type} />{/each}
          </div></a
        >{/each}
    </div>{:else}<div class="empty-panel">
      <h3>O catálogo ainda não está disponível</h3>
      <p>{data.error || "A importação está em preparação."}</p>
      <a href="/cobertura">Consultar cobertura</a>
    </div>{/if}
</section>
