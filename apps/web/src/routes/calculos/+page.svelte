<script>
  import { onMount } from 'svelte';
  import { library } from '$lib/team-store.js';
  import { mutate, statLabels, sprite } from '$lib/api.js';
  import { Swords, ArrowLeftRight, Sparkles, ShieldAlert } from '@lucide/svelte';
  const training=value=>Object.fromEntries(Object.keys(statLabels).map(key=>[key,value]));
  const initial=pokemon=>({name:'Comparação',pokemon,context_id:'gen9ou',level:100,nature:'Serious',ability:'',item:'',moves:['Tackle'],evs:training(0),ivs:training(31),tera_type:'',role:'physical-attacker',strategy:'',visibility:'private'});
  let ready=$state(false);
  let attacker=$state(initial('Garchomp')),defender=$state(initial('Corviknight')), context=$state('gen9ou'), move=$state('Earthquake'),weather=$state(''),terrain=$state(''),critical=$state(false),result=$state(null),previous=$state(null),message=$state(''),busy=$state(false),species=$state([]),members=$state([]),attackerOptions=$state(null),defenderOptions=$state(null);
  async function options(side){const build=side==='attacker'?attacker:defender;const response=await fetch('/api/v1/options?'+new URLSearchParams({pokemon:build.pokemon,context_id:context}));if(!response.ok)throw Error('Não foi possível carregar o Pokémon.');const data=await response.json();if(side==='attacker')attackerOptions=data;else defenderOptions=data;if(!data.abilities?.includes(build.ability))build.ability=data.abilities?.[0]||'';}
  onMount(()=>{(async()=>{try{members=(await library()).teams.flatMap(t=>t.members.map(m=>({...m,team_name:t.name})));species=await fetch('/api/v1/species').then(r=>r.json());await Promise.all([options('attacker'),options('defender')]);}catch(e){message=e.message;}finally{ready=true;}})();});
  async function choose(side,value){try{if(value!==''){const member=structuredClone(members[Number(value)]);delete member.team_name;member.context_id=context;if(side==='attacker')attacker=member;else defender=member;}await options(side);}catch(e){message=e.message;}}
  async function calculate(){busy=true;message='';try{attacker.context_id=context;defender.context_id=context;previous=result;result=await mutate('/damage',{attacker:$state.snapshot(attacker),defender:$state.snapshot(defender),move,weather,terrain,critical});}catch(e){message=e.message;}finally{busy=false;}}
  async function changeContext(){attacker.context_id=context;defender.context_id=context;try{await Promise.all([options('attacker'),options('defender')]);}catch(e){message=e.message;}}
  function swapSides() {
    const temp = $state.snapshot(attacker);
    const tempOpts = attackerOptions;
    attacker = $state.snapshot(defender);
    defender = temp;
    attackerOptions = defenderOptions;
    defenderOptions = tempOpts;
  }
  function applyEvPreset(side, preset) {
    const target = side === 'attacker' ? attacker : defender;
    target.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...preset };
  }
  function parsePercentRange(desc, range) {
    if (!desc) return { min: 0, max: 0 };
    const match = desc.match(/\(([\d.]+)\s*-\s*([\d.]+)%\)/);
    if (match) return { min: Math.min(100, Number(match[1])), max: Math.min(100, Number(match[2])) };
    if (range?.[0] === 0 && range?.[1] === 0) return { min: 0, max: 0 };
    return { min: 25, max: 45 };
  }
</script>
<svelte:head><title>Calculadora de dano — illke</title></svelte:head>
<div class="damage-calculator">
  <div class="page-header split">
    <div>
      <div class="breadcrumbs"><a href="/">illke</a><span>/</span>Calculadora de dano</div>
      <h1>Calculadora de dano</h1>
      <p>Intervalos exatos de dano sob condições explícitas de batalha.</p>
    </div>
    <button type="button" class="button secondary small" onclick={swapSides}>
      <ArrowLeftRight size={16}/> Inverter lados
    </button>
  </div>

  <div class="toolbar calc-context-bar">
    <label class="calc-format-label">
      <span>Formato competitivo</span>
      <select bind:value={context} onchange={changeContext}>
        {#each Array.from({length:9},(_,i)=>i+1) as generation}
          <option value={'gen'+generation+'ou'}>Geração {generation} · Singles OU</option>
        {/each}
      </select>
    </label>
    <div class="calc-vs-pill" aria-hidden="true">
      <strong>{attacker.pokemon || '—'}</strong>
      <span class="vs-badge">VS</span>
      <strong>{defender.pokemon || '—'}</strong>
    </div>
  </div>

  {#if message}<p class="notice error" role="status">{message}</p>{/if}

  <div class="damage-sides">
    {#each ['attacker','defender'] as side}
      {@const build=side==='attacker'?attacker:defender}
      {@const data=side==='attacker'?attackerOptions:defenderOptions}
      <fieldset class="content-panel calc-side-panel" data-side={side}>
        <legend>{side==='attacker'?'Atacante':'Defensor'}</legend>

        <div class="calc-fighter-banner">
          <div class="calc-fighter-avatar">
            <img src={sprite(build.pokemon)} alt="" width="72" height="72"/>
          </div>
          <div class="calc-fighter-meta">
            <div class="calc-fighter-title">
              <strong>{build.pokemon || 'Selecionar'}</strong>
              <span class="chip">Nv. {build.level}</span>
            </div>
            <small>{build.ability || 'Sem habilidade'} · {build.item || 'Sem item'} · {build.nature}</small>
          </div>
        </div>

        <label class="stacked-field" style="margin-bottom:14px">
          <span>Usar integrante salvo</span>
          <select onchange={e=>choose(side,e.currentTarget.value)}>
            <option value="">Configuração manual</option>
            {#each members as member,index}
              <option value={index}>{member.team_name} / {member.pokemon}</option>
            {/each}
          </select>
        </label>

        <div class="form-grid">
          <label>Pokémon<input list="species" bind:value={build.pokemon} onchange={()=>choose(side,'')}/></label>
          <label>Nível<input type="number" min="1" max="100" bind:value={build.level}/></label>
          <label>Habilidade<select bind:value={build.ability}><option value="">Não se aplica</option>{#each data?.abilities||[] as ability}<option>{ability}</option>{/each}</select></label>
          <label>Item<input list="calc-items" bind:value={build.item} placeholder="Ex.: Leftovers, Choice Band"/></label>
          <label>Nature<select bind:value={build.nature}>{#each data?.natures||[] as nature}<option value={nature.name}>{nature.name}</option>{/each}</select></label>
          <label>Tipo Tera<select bind:value={build.tera_type}><option value="">Não terastalizado</option>{#if context==='gen9ou'}{#each data?.tera_types||[] as type}<option>{type}</option>{/each}{/if}</select></label>
        </div>

        <details class="calc-training-details">
          <summary>Treinamento e atributos (EVs / IVs)</summary>
          <div class="calc-ev-presets">
            <button type="button" class="chip" onclick={()=>applyEvPreset(side,{atk:252,spe:252,hp:4})}>252 Atq / 252 Vel</button>
            <button type="button" class="chip" onclick={()=>applyEvPreset(side,{spa:252,spe:252,hp:4})}>252 At.Esp / 252 Vel</button>
            <button type="button" class="chip" onclick={()=>applyEvPreset(side,{hp:252,def:252,spd:4})}>252 HP / 252 Def</button>
            <button type="button" class="chip" onclick={()=>applyEvPreset(side,{hp:252,spd:252,def:4})}>252 HP / 252 Def.Esp</button>
            <button type="button" class="chip" onclick={()=>applyEvPreset(side,{})}>Zerar EVs</button>
          </div>
          <div class="stat-inputs">
            {#each Object.entries(statLabels) as [stat,label]}
              <label>{label} EV<input type="number" min="0" max="252" bind:value={build.evs[stat]}/></label>
              <label>{label} IV<input type="number" min="0" max="31" bind:value={build.ivs[stat]}/></label>
            {/each}
          </div>
        </details>
      </fieldset>
    {/each}
  </div>

  <datalist id="species">{#each species.filter(p=>p.gen<=Number(context[3])) as pokemon}<option value={pokemon.name}></option>{/each}</datalist>
  <datalist id="calc-items">{#each attackerOptions?.items||[] as item}<option value={item.name}></option>{/each}</datalist>

  <form class="content-panel calc-action-panel" onsubmit={e=>{e.preventDefault();calculate();}}>
    <div class="form-grid">
      <label>Golpe<input bind:value={move} list="damage-moves" required/></label>
      <label>Clima<select bind:value={weather}>{#each [['','Sem clima'],['Sun','Sol (Sun)'],['Rain','Chuva (Rain)'],['Sand','Tempestade de Areia (Sand)'],['Hail','Granizo (Hail)'],['Snow','Neve (Snow)']] as [val,label]}<option value={val}>{label}</option>{/each}</select></label>
      <label>Terreno<select bind:value={terrain}><option value="">Sem terreno</option>{#each ['Electric','Grassy','Misty','Psychic'] as value}<option>{value}</option>{/each}</select></label>
      <label><input type="checkbox" bind:checked={critical}/> Acerto crítico</label>
    </div>
    <datalist id="damage-moves">{#each attackerOptions?.moves||[] as option}<option value={option.name}></option>{/each}</datalist>
    <div class="actions" style="margin-top:18px">
      <button class="button" disabled={busy || !ready}><Swords size={16}/> {busy?'Calculando…':'Calcular dano'}</button>
    </div>
  </form>

  {#if result}
    {@const pct = parsePercentRange(result.description, result.range)}
    {@const remainingMin = Math.max(0, 100 - pct.max)}
    <section class="content-panel calc-result-panel" aria-live="polite">
      <div class="calc-result-grid">
        <div class="calc-result-main">
          <div class="calc-result-header">
            <h2>Resultado</h2>
            <span class="chip">{result.range[1] === 0 ? 'Imune (0%)' : pct.max >= 100 ? 'Potencial OHKO' : pct.max >= 50 ? 'Potencial 2HKO' : 'Dano calculado'}</span>
          </div>
          <p class="result-number">{result.range[0]}–{result.range[1]} HP</p>
          <div class="calc-hp-meter" aria-hidden="true">
            <div class="calc-hp-bar-Label">
              <span>HP estimado de {defender.pokemon} após o golpe</span>
              <strong>{remainingMin.toFixed(0)}% – {(100 - pct.min).toFixed(0)}% restante</strong>
            </div>
            <div class="calc-hp-track">
              <span
                class="calc-hp-fill"
                data-state={remainingMin <= 20 ? 'danger' : remainingMin <= 50 ? 'warn' : 'ok'}
                style={`width:${remainingMin}%`}
              ></span>
              <span
                class="calc-hp-roll"
                style={`left:${remainingMin}%;width:${Math.max(0, pct.max - pct.min)}%`}
              ></span>
            </div>
          </div>
          <p class="calc-description">{result.description}</p>
          <p class="help">{context.toUpperCase()} · Golpe: {move} · {weather||'sem clima'} · {terrain||'sem terreno'}{critical ? ' · Crítico' : ''}</p>
        </div>

        {#if previous}
          <div class="calc-previous-box">
            <h3>Comparação anterior</h3>
            <p class="calc-prev-range">{previous.range[0]}–{previous.range[1]} HP</p>
            <p>{previous.description}</p>
          </div>
        {/if}
      </div>
    </section>
  {/if}
</div>
