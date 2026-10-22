<script>
  import { onMount } from 'svelte';
  import { library } from '$lib/team-store.js';
  import { mutate, statLabels } from '$lib/api.js';
  const training=value=>Object.fromEntries(Object.keys(statLabels).map(key=>[key,value]));
  const initial=pokemon=>({name:'Comparação',pokemon,context_id:'gen9ou',level:100,nature:'Serious',ability:'',item:'',moves:['Tackle'],evs:training(0),ivs:training(31),tera_type:'',role:'physical-attacker',strategy:'',visibility:'private'});
  let ready=$state(false);
  let attacker=$state(initial('Garchomp')),defender=$state(initial('Corviknight')), context=$state('gen9ou'), move=$state('Earthquake'),weather=$state(''),terrain=$state(''),critical=$state(false),result=$state(null),previous=$state(null),message=$state(''),busy=$state(false),species=$state([]),members=$state([]),attackerOptions=$state(null),defenderOptions=$state(null);
  async function options(side){const build=side==='attacker'?attacker:defender;const response=await fetch('/api/v1/options?'+new URLSearchParams({pokemon:build.pokemon,context_id:context}));if(!response.ok)throw Error('Não foi possível carregar o Pokémon.');const data=await response.json();if(side==='attacker')attackerOptions=data;else defenderOptions=data;if(!data.abilities?.includes(build.ability))build.ability=data.abilities?.[0]||'';}
  onMount(()=>{(async()=>{try{members=(await library()).teams.flatMap(t=>t.members.map(m=>({...m,team_name:t.name})));species=await fetch('/api/v1/species').then(r=>r.json());await Promise.all([options('attacker'),options('defender')]);}catch(e){message=e.message;}finally{ready=true;}})();});
  async function choose(side,value){try{if(value!==''){const member=structuredClone(members[Number(value)]);delete member.team_name;member.context_id=context;if(side==='attacker')attacker=member;else defender=member;}await options(side);}catch(e){message=e.message;}}
  async function calculate(){busy=true;message='';try{attacker.context_id=context;defender.context_id=context;previous=result;result=await mutate('/damage',{attacker:$state.snapshot(attacker),defender:$state.snapshot(defender),move,weather,terrain,critical});}catch(e){message=e.message;}finally{busy=false;}}
  async function changeContext(){attacker.context_id=context;defender.context_id=context;try{await Promise.all([options('attacker'),options('defender')]);}catch(e){message=e.message;}}
</script>
<svelte:head><title>Calculadora de dano — illke</title></svelte:head>
<div class="damage-calculator"><div class="page-header"><h1>Calculadora de dano</h1><p>Intervalos de dano sob condições explícitas. Isso não estima a chance de vencer uma partida.</p></div>
<label>Formato<select bind:value={context} onchange={changeContext}>{#each Array.from({length:9},(_,i)=>i+1) as generation}<option value={'gen'+generation+'ou'}>Geração {generation} · Singles OU</option>{/each}</select></label>
{#if message}<p class="notice" role="status">{message}</p>{/if}
<div class="damage-sides">
{#each ['attacker','defender'] as side}{@const build=side==='attacker'?attacker:defender}{@const data=side==='attacker'?attackerOptions:defenderOptions}
<fieldset class="content-panel"><legend>{side==='attacker'?'Atacante':'Defensor'}</legend>
<label>Usar integrante salvo<select onchange={e=>choose(side,e.currentTarget.value)}><option value="">Configuração manual</option>{#each members as member,index}<option value={index}>{member.team_name} / {member.pokemon}</option>{/each}</select></label>
<div class="form-grid"><label>Pokémon<input list="species" bind:value={build.pokemon} onchange={()=>choose(side,'')}/></label><label>Nível<input type="number" min="1" max="100" bind:value={build.level}/></label><label>Habilidade<select bind:value={build.ability}><option value="">Não se aplica</option>{#each data?.abilities||[] as ability}<option>{ability}</option>{/each}</select></label><label>Item<input bind:value={build.item}/></label><label>Nature<select bind:value={build.nature}>{#each data?.natures||[] as nature}<option value={nature.name}>{nature.name}</option>{/each}</select></label><label>Tipo Tera<select bind:value={build.tera_type}><option value="">Não terastalizado</option>{#if context==='gen9ou'}{#each data?.tera_types||[] as type}<option>{type}</option>{/each}{/if}</select></label></div>
<details><summary>Treinamento e atributos</summary><div class="stat-inputs">{#each Object.entries(statLabels) as [stat,label]}<label>{label} EV<input type="number" min="0" max="252" bind:value={build.evs[stat]}/></label><label>{label} IV<input type="number" min="0" max="31" bind:value={build.ivs[stat]}/></label>{/each}</div></details>
</fieldset>{/each}
</div>
<datalist id="species">{#each species.filter(p=>p.gen<=Number(context[3])) as pokemon}<option value={pokemon.name}></option>{/each}</datalist>
<form class="content-panel" onsubmit={e=>{e.preventDefault();calculate();}}><div class="form-grid"><label>Golpe<input bind:value={move} list="damage-moves" required/></label><label>Clima<select bind:value={weather}>{#each ['','Sun','Rain','Sand','Hail','Snow'] as value}<option value={value}>{value||'Sem clima'}</option>{/each}</select></label><label>Terreno<select bind:value={terrain}><option value="">Sem terreno</option>{#each ['Electric','Grassy','Misty','Psychic'] as value}<option>{value}</option>{/each}</select></label><label><input type="checkbox" bind:checked={critical}/> Acerto crítico</label></div><datalist id="damage-moves">{#each attackerOptions?.moves||[] as option}<option value={option.name}></option>{/each}</datalist><div class="actions"><button class="button" disabled={busy || !ready}>{busy?'Calculando…':'Calcular dano'}</button></div></form>
{#if result}<section class="content-panel" aria-live="polite"><h2>Resultado</h2><p class="result-number">{result.range[0]}–{result.range[1]} HP</p><p>{result.description}</p><p class="help">{context} · {move} · {weather||'sem clima'} · {terrain||'sem terreno'}</p>{#if previous}<h3>Comparação anterior</h3><p>{previous.range[0]}–{previous.range[1]} HP</p><p>{previous.description}</p>{/if}</section>{/if}

</div>
