<script>
 import covers from '$lib/game-covers.json';
 import { onMount } from 'svelte';
 import { games, consoles, withGame } from '$lib/games.js';
 import { page } from '$app/state';
 import { mapFor } from '$lib/maps.js';
 import ConsoleIcon from '$lib/components/ConsoleIcon.svelte';
 import GameCover from '$lib/components/GameCover.svelte';
 import { Search, Map, ArrowUpRight, Check } from '@lucide/svelte';
 let mounted=$state(false);
 onMount(()=>{mounted=true;});
 let query=$state('');
 let platform=$state('');
 let category=$state('');
 let filtered=$derived(games.filter(g=>(!platform||g.consoles.includes(platform))&&(!category||g.category===category)&&(g.name+' '+g.region).toLowerCase().includes(query.toLowerCase())));
</script>
<svelte:head><title>Jogos e mapas Pokémon — illke</title><meta name="description" content="Escolha seu jogo Pokémon e console para consultar pistas, mapas e locais de encontro específicos por versão."/></svelte:head>
<div class="page-header atlas-heading"><div><span class="atlas-symbol"><Map size={28}/></span><h1>Jogos e mapas</h1><p>Selecione a versão para consultar Pokémon, itens e locais de encontro.</p></div><a href="/pokedex" class="button secondary">Explorar Pokédex</a></div>
<fieldset class="game-filters" disabled={!mounted} aria-label="Filtrar jogos"><label class="hint-search"><Search size={19}/><span class="sr-only">Buscar jogo ou região</span><input type="search" bind:value={query} placeholder="Busque um jogo ou uma região…"/></label><div><label class="sr-only" for="game-platform">Console</label><select id="game-platform" bind:value={platform}><option value="">Todos os consoles</option>{#each Object.entries(consoles) as [id,name]}<option value={id}>{name}</option>{/each}</select></div><div><label class="sr-only" for="game-category">Categoria</label><select id="game-category" bind:value={category}><option value="">Toda a franquia</option><option>Série principal</option><option>Derivados e aplicativos</option></select></div></fieldset>
<p class="help">{filtered.length} títulos no catálogo. Plataformas indicam edições nativas; retrocompatibilidade e relançamentos variam. A disponibilidade de pistas é indicada em cada jogo.</p>
{#each ['Série principal','Derivados e aplicativos'] as group}
 {#if filtered.some(g=>g.category===group)}<section class="game-section"><div class="section-heading"><h2>{group}</h2></div><div class="game-grid">
 {#each filtered.filter(g=>g.category===group) as game}<a class="game-card" class:chosen={page.data.selectedGame?.id===game.id} href={withGame('/jogos/'+game.id,game.id)}>
  <div class="game-card-top"><div class="console-stack">{#each game.consoles as c}<span title={consoles[c]}><ConsoleIcon platform={c} size={36}/></span>{/each}</div>{#if page.data.selectedGame?.id===game.id}<Check size={20}/>{:else}<ArrowUpRight size={18}/>{/if}</div>
  <GameCover cover={covers[game.id]} name={game.name}/>
  <h3>{game.name}</h3><p>{game.consoles.map(c=>consoles[c]).join(' / ')}</p><div class="game-card-bottom"><span>{game.region}</span><span class="coverage-tag" class:available={!!game.map}>{game.status==='announced'?'Anunciado · 2027':game.map?'Mapa e pistas':mapFor(game)?'Mapa regional':game.version?'Pistas parciais':'Sem pistas na fonte'}</span></div>
 </a>{/each}</div></section>{/if}
{/each}
{#if !filtered.length}<div class="empty-panel"><h2>Nenhum jogo encontrado</h2><p>Tente outro nome ou limpe os filtros.</p><button class="button secondary" onclick={()=>{query='';platform='';category='';}}>Limpar filtros</button></div>{/if}
<p class="help">Expansões listadas separadamente quando a fonte possui uma versão própria. Dados de encontros não estão completos para todos os títulos. <a class="text-link" href="/fontes#jogos">Consultar fontes do catálogo</a>.</p>
