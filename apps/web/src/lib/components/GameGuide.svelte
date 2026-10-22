<script>
 import { onMount } from 'svelte';
 import { page } from '$app/state';
 import { games, withGame, consoles } from '$lib/games.js';
 import { captureAdvice } from '$lib/capture-advice.js';
 import Walkthrough from './Walkthrough.svelte';
 import ConsoleIcon from './ConsoleIcon.svelte';
 import { MapPin, Map as MapIcon, Search } from '@lucide/svelte';
 let { guide } = $props();
 let stage=$state('opening');
 let night=$state(false);
 let cave=$state(false);
 let mounted=$state(false);
 onMount(()=>{mounted=true;});
 let selected = $state('');
 let filter = $state('');
 let zoom = $state(false);
  $effect(()=>{ const gameId=guide?.game.id; selected=''; filter=''; stage='opening'; night=false; cave=false; zoom=false; });
 let hints = $derived((guide?.hints || []).filter(h=>(h.title+' '+h.method+' '+(h.carrier||'')).toLowerCase().includes(filter.toLowerCase())));
 let active = $derived(hints.find(h=>h.id===selected) || hints[0]);
 let advice=$derived(guide?.pokemon ? captureAdvice({...guide.game,id:guide.game.version || guide.game.id},guide.pokemon,active?{method:active.methodId,location:active.title,area:active.area}:null,{stage,night,cave}):null);
</script>
<section id="onde-encontrar" class="game-guide" aria-label="Onde encontrar">
 <div class="section-heading"><div><h2><MapPin size={24}/> Onde encontrar</h2><p>Locais registrados para o jogo selecionado.</p></div><a class="text-link" href="/jogos">Trocar jogo</a></div>
 {#if !guide}
  <form class="toolbar"><label for="guide-game">Escolha o seu jogo</label><select id="guide-game" name="game" required><option value="">Selecione um jogo</option>{#each games as game}<option value={game.id}>{game.name} — {game.consoles.map(c=>consoles[c]).join(' / ')}</option>{/each}</select><button class="button">Ver pistas</button></form>
 {:else}
  <div class="guide-context"><ConsoleIcon platform={guide.game.consoles[0]} size={38}/><div><strong>{guide.game.name}</strong><span>{guide.game.region} · {guide.game.consoles.map(c=>consoles[c]).join(' / ')}</span></div><a href={withGame(page.url.pathname,guide.game.id)} class="text-link">Atualizar pistas</a></div>
  <p class:field-error={guide.status==='error'} role={guide.status==='error'?'alert':undefined}>{guide.message}</p>
  {#if guide.hints.length}
   <label class="hint-search"><Search size={18}/><span class="sr-only">Filtrar pistas</span><input bind:value={filter} placeholder="Filtrar local ou método…" type="search"/></label>
  {/if}
  <Walkthrough {guide} hint={active} {hints} onSelect={id=>selected=id}/>
   <div class="hint-list guide-alternatives" aria-label="Pistas disponíveis">
    {#each hints as hint,i}<button disabled={!mounted} class="hint-card" class:active={active?.id===hint.id} onclick={()=>selected=hint.id}><span class="hint-index">{i+1}</span><span><strong>{hint.title}</strong><small>{hint.method}</small>{#if hint.min !== undefined}<small>Nível {hint.min}–{hint.max} · {hint.chance}%{hint.conditions.length?' · '+hint.conditions.join(', '):''}</small>{:else}<small>Item no cenário · {hint.tile ? "Coluna "+hint.tile.x+", linha "+hint.tile.y : ""}</small>{/if}{#if hint.carrier}<small>Item com {hint.carrier}: {hint.itemChance}%</small>{/if}</span></button>{/each}
    {#if !hints.length}<p class="help">{filter?'Nenhuma pista corresponde à busca.':'Sem locais confirmados na fonte para esta seleção.'}</p>{/if}
   </div>
  {#if advice}<section class="capture-preparation"><h3>Prepare este encontro</h3>{#if !active}<p class="help">Estas dicas explicam as mecânicas do jogo. Não confirmam um encontro com este Pokémon.</p>{/if}{#if advice.standard}<div class="capture-scenario"><div class="capture-control"><label for="atlas-stage">Momento da tentativa</label><select id="atlas-stage" disabled={!mounted} bind:value={stage}><option value="opening">Primeiro turno</option><option value="prepared">Alvo preparado</option><option value="long">Batalha prolongada</option></select></div><label><input type="checkbox" bind:checked={night}/> É noite</label><label><input type="checkbox" bind:checked={cave}/> Estou em uma caverna</label></div>{/if}{#if advice.best}<p class="notice"><strong>Opção indicada: {advice.best}</strong></p>{/if}{#each advice.balls as ball}<p><strong>{ball.name}</strong> — {ball.reason}</p>{/each}{#if advice.items.length}<ul>{#each advice.items as item}<li>{item}</li>{/each}</ul>{/if}<ul>{#each advice.tips as tip}<li>{tip}</li>{/each}</ul><div class="actions">{#each advice.sources as source}<a class="text-link" href={source.url}>{source.label}</a>{/each}</div></section>{/if}
  {#if guide.held.length}<h3>Pokémon que podem carregar este item</h3><div class="actions">{#each guide.held as p}<a class="chip" href={withGame('/pokemon/'+p.pokemon,guide.game.id)}>{p.pokemon} · {p.chance}%</a>{/each}</div>{/if}
  {#if guide.machines.length}<p>Este item é uma TM/HM registrada para {guide.game.name}. A fonte ainda não indica o ponto de obtenção.</p>{/if}
  {#if guide.partial}<p class="help">O mapa exibe uma amostra de até seis portadores. Alguns locais podem não ter sido carregados; a lista de portadores permanece disponível acima.</p>{/if}
  <p class="help">Dados: <a class="text-link" href={guide.source}>PokéAPI</a>. Mapas e coordenadas: <a class="text-link" href="/fontes#mapas">fontes e créditos</a>.</p>
 {/if}
</section>
