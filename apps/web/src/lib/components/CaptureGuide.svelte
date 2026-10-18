<script>
  import { untrack } from 'svelte';
  import { captureAdvice } from '$lib/capture-advice.js';
  let { guide, initialGame = null } = $props();
  let selectedGame = $state(untrack(()=>guide.games?.some(game=>game.id===initialGame) ? initialGame : guide.pokemon?.encounters[0]?.game || guide.games?.[0]?.id || ''));
  let selectedEncounter = $state(0), stage = $state('opening'), night = $state(false), cave = $state(false), locationSearch = $state(''), shown = $state(20);
  let game = $derived(guide.games?.find(game=>game.id===selectedGame));
  let encounters = $derived((guide.pokemon?.encounters || []).filter(encounter=>encounter.game===selectedGame));
  let filtered = $derived(encounters.map((encounter,index)=>({...encounter,index})).filter(encounter=>
    (encounter.location+' '+encounter.area+' '+encounter.method_label+' '+encounter.conditions.join(' ')).toLowerCase().includes(locationSearch.trim().toLowerCase())));
  let advice = $derived(game ? captureAdvice(game,guide.pokemon,encounters[selectedEncounter],{stage,night,cave}) : null);
  function changeGame() { selectedEncounter=0; stage='opening'; night=false; cave=false; locationSearch=''; shown=20; }
</script>

<section class="content-panel capture-guide" id="captura" aria-label="Guia de captura por jogo">
  <h2>Onde capturar e como se preparar</h2>
  {#if !guide.available}<p class="notice">{guide.reason}</p>
  {:else}
    <p>Escolha a versão exata. Os locais e condições abaixo pertencem ao jogo selecionado.</p>
    <div class="capture-control"><label for="capture-game">Jogo</label><select id="capture-game" bind:value={selectedGame} onchange={changeGame}>{#each guide.games as option}<option value={option.id}>{option.label}{guide.pokemon.encounters.some(row=>row.game===option.id)?' · há registros para este Pokémon':''}</option>{/each}</select></div>
    {#if encounters.length}
      <p class="help">{encounters.length} registros de encontro nesta versão. A frequência se refere ao encontro com as condições indicadas; não é a chance de a Poké Bola capturar.</p>
      <label>Pesquisar local ou condição<input type="search" bind:value={locationSearch} oninput={()=>shown=20} placeholder="Rota, região, método ou condição"/></label>
      <div class="capture-locations">{#each filtered.slice(0,shown) as encounter}<article class="capture-location" class:chosen={selectedEncounter===encounter.index}>
        <h3>{encounter.location}</h3>{#if encounter.area!==encounter.location}<p>{encounter.area}</p>{/if}
        <p>{encounter.method_label} · Nível {encounter.min_level}{encounter.max_level!==encounter.min_level?'–'+encounter.max_level:''}{encounter.encounter_rate!==null?' · Frequência registrada: '+encounter.encounter_rate+'%':''}</p>
        {#if encounter.conditions.length}<ul>{#each encounter.conditions as condition}<li>{condition}</li>{/each}</ul>{:else}<p class="help">Nenhuma condição adicional descrita neste registro.</p>{/if}
        <button class="button secondary small" aria-pressed={selectedEncounter===encounter.index} onclick={()=>selectedEncounter=encounter.index}>Preparar este encontro</button>
      </article>{:else}<p>Nenhum local corresponde à busca.</p>{/each}</div>
      {#if filtered.length>shown}<button class="text-link" onclick={()=>shown+=20}>Mostrar mais locais ({filtered.length-shown})</button>{/if}
    {:else}
      <div class="notice"><strong>Nenhum local confirmado nesta fonte para este jogo.</strong><p>{game?.generation<guide.pokemon.generation?'Esta espécie ou forma foi introduzida depois desta versão.':game?.records===0?'A fonte ainda não fornece encontros para esta versão.':'Pode haver obtenção por evolução, troca, presente ou evento não registrado aqui.'} A ausência de registros não comprova que o Pokémon seja impossível de obter.</p></div>
    {/if}
    {#if advice}
      <h3>Preparação{encounters[selectedEncounter]?' para '+encounters[selectedEncounter].location:''}</h3>
      {#if !encounters.length}<p class="help">As dicas abaixo são sobre as mecânicas do jogo. Elas não confirmam um encontro com este Pokémon.</p>{/if}
      {#if advice.standard}<div class="capture-scenario">
        <div class="capture-control"><label for="capture-stage">Momento da tentativa</label><select id="capture-stage" bind:value={stage}><option value="opening">Primeiro turno</option><option value="prepared">Alvo já preparado</option><option value="long">Batalha prolongada</option></select></div>
        <label class="capture-checkbox"><input type="checkbox" bind:checked={night}/> É noite</label>
        <label class="capture-checkbox"><input type="checkbox" bind:checked={cave}/> Estou em uma caverna</label>
      </div>{/if}
      {#if advice.best}<p class="notice"><strong>Opção indicada neste cenário: {advice.best}</strong></p>{/if}
      {#each advice.balls as ball}<p><strong>{ball.name}</strong> — {ball.reason}</p>{/each}
      {#if advice.items.length}<h4>Itens e recursos úteis</h4><ul>{#each advice.items as item}<li>{item}</li>{/each}</ul>{/if}
      <ul>{#each advice.tips as tip}<li>{tip}</li>{/each}</ul>
      {#each advice.sources as source}<a class="text-link source-link" href={source.url} target="_blank" rel="noreferrer">{source.label}</a>{/each}
    {/if}
    <p class="help">Locais e condições mantêm os nomes em inglês da fonte. Cobertura parcial: {guide.games.filter(game=>game.records).length}/{guide.games.length} versões com algum registro no acervo, não necessariamente para este Pokémon. <a href={guide.source} target="_blank" rel="noreferrer">PokéAPI · revisão {guide.revision.slice(0,12)}</a>.</p>
  {/if}
</section>

<style>
  .capture-guide { margin-top:30px; }
  .capture-guide > label { display:flex; flex-direction:column; gap:8px; margin:16px 0; }
  .capture-control { display:flex; flex-direction:column; gap:8px; margin:16px 0; min-width:0; }
  .capture-locations { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr)); gap:12px; margin:16px 0; }
  .capture-location { border:1px solid var(--border); border-radius:8px; padding:16px; min-width:0; }
  .capture-location.chosen { border-color:var(--accent); }
  .capture-location h3 { margin-top:0; font-size:17px; }
  .capture-location p, .capture-location li { font-size:13px; }
  .capture-scenario { display:flex; flex-wrap:wrap; align-items:center; gap:18px; margin:16px 0; }
  .capture-scenario > label { display:flex; flex-direction:column; gap:6px; }
  .capture-scenario > .capture-checkbox { flex-direction:row; align-items:center; }
  .capture-checkbox input { width:auto; }
  .source-link { display:inline-block; margin-right:16px; margin-bottom:12px; }
  li { margin:8px 0; }
</style>
