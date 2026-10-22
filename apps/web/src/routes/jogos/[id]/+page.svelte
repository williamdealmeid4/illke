<script>
 import { onMount } from 'svelte';
 import { consoles, withGame } from '$lib/games.js';
 import { mapFor, landmarksFor } from '$lib/maps.js';
 import GameGuide from '$lib/components/GameGuide.svelte';
 import ConsoleIcon from '$lib/components/ConsoleIcon.svelte';
 import { MapPin, Search } from '@lucide/svelte';
 let {data}=$props();
 let mounted=$state(false);
 onMount(()=>{mounted=true;});
 let location=$state('');
 let zoom=$state(false);
 let game=$derived(data.game);
 let landmarks=$derived(landmarksFor(game));
 let map=$derived(mapFor(game,location.toLowerCase().replace(/[^a-z0-9]+/g,'-')));
</script>
<svelte:head><title>{game.name}: mapa e pistas — illke</title></svelte:head>
<div class="page-header"><div class="breadcrumbs"><a href="/jogos">Jogos</a><span>/</span>{game.name}</div><div class="game-title"><ConsoleIcon platform={game.consoles[0]} size={58}/><div><h1>{game.name}</h1><p>{game.consoles.map(c=>consoles[c]).join(' / ')} · {game.region}</p></div></div></div>
<section class="guide-target-search" aria-label="Buscar um alvo neste jogo">
 <form method="GET" action={'/jogos/'+game.id} class="guide-target-form"><input type="hidden" name="game" value={game.id}/><label>Procurar<select name="kind" value={data.kind}><option value="pokemon">Pokémon</option><option value="item">Item</option></select></label><label class="target-query">Nome ou número<input name="q" value={data.query} placeholder="Ex.: Pikachu, Leftovers, Rare Candy…" required maxlength="100"/></label><button class="button"><Search size={17}/>Buscar dicas</button></form>
 <p class="help">Escolha o alvo. A dica mostra o acesso, o método de obtenção e o ponto ou a área de procura, conforme os dados desta versão.</p>
 {#if data.message}<p class="notice" role="alert">{data.message}</p>{/if}
 {#if data.matches.length}<div class="target-results">{#each data.matches as entry}<a href={'/jogos/'+game.id+'?'+new URLSearchParams({game:game.id,kind:data.kind,target:entry.slug})+'#onde-encontrar'}>{#if entry.image}<img src={entry.image.url} alt="" width="52" height="52"/>{/if}<span><strong>{entry.name}</strong><small>Ver onde encontrar em {game.name}</small></span><MapPin size={18}/></a>{/each}</div>{:else if data.query&&!data.entry}<p>Nenhum resultado para “{data.query}”. Tente o nome usado no jogo.</p>{/if}
 {#if !data.entry&&!data.query}<div class="guide-examples"><span>Consultar:</span><a href={'/jogos/'+game.id+'?kind=pokemon&target=pikachu&game='+game.id+'#onde-encontrar'}>Pikachu</a><a href={'/jogos/'+game.id+'?kind=item&target=leftovers&game='+game.id+'#onde-encontrar'}>Leftovers</a><a href={'/jogos/'+game.id+'?kind=item&target=rare-candy&game='+game.id+'#onde-encontrar'}>Rare Candy</a></div>{/if}
</section>
{#if data.entry}<GameGuide guide={data.guide}/>{/if}
<details class="region-reference"><summary>Mapa regional e áreas de {game.region}</summary><div class="map-panel">
 {#if map}<div class="map-toolbar"><strong>Mapa de {game.region}</strong><button class="button secondary small" onclick={()=>zoom=!zoom}>{zoom?'Reduzir':'Ampliar'}</button></div>
 {#if landmarks.length}<div class="landmark-picker"><label for="landmark">Destacar local</label><select disabled={!mounted} id="landmark" bind:value={location}><option value="">Visão geral</option>{#each landmarks as point}<option value={point.name}>{point.name}</option>{/each}</select></div>{/if}
 <div class="map-scroll"><div class="region-map" class:zoom style={`aspect-ratio:${map.width}/${map.height}`}><img src={map.image} alt={'Mapa de referência da região '+game.region} width={map.width} height={map.height} style={map.illustration?'image-rendering:auto':''}/>{#if map.point}<span class="map-pin selected" style={`left:${map.point.x/map.width*100}%;top:${map.point.y/map.height*100}%`}><MapPin size={22}/></span>{/if}</div></div>
 <p class="help">Este mapa serve para consultar as áreas. Para procurar um item ou Pokémon específico, use a busca acima.{#if map.illustration} {map.label}. <a href={map.source}>Fonte</a>.{/if}</p>
 {:else}<div class="map-missing"><p>Ainda não há mapa verificado desta região no acervo.</p></div>{/if}
</div></details>
