<script>
  import { onMount, untrack, tick } from "svelte";
  import { replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import {
    Plus,
    Check,
    Trash2,
    Download,
    Upload,
    Shield,
    Swords,
    Save,
  } from "@lucide/svelte";
  import EntityIcon from "$lib/components/EntityIcon.svelte";
  import TypeIcon from "$lib/components/TypeIcon.svelte";
  import { moveIconData } from "$lib/icons.js";
  import ShareBuild from "$lib/components/ShareBuild.svelte";
  import { mutate, sprite, statLabels, roles } from "$lib/api.js";
  import { library, createTeam, saveTeam, getTeam } from '$lib/team-store.js';
  import { emptyBuild, referenceBuilds } from '$lib/builder.js';
  let { data } = $props();
  let draft = $state(untrack(() => structuredClone(data.initial)));
  let options = $state(untrack(() => data.options));
  let members = $state(
    untrack(() => (data.initial?.pokemon ? [structuredClone(data.initial)] : [])),
  );
  let selected = $state(0);
  function signature(builds){return JSON.stringify(builds.map(b=>[b.context_id,b.pokemon,b.level,b.nature,b.ability,b.item,b.tera_type,(b.moves||[]).filter(Boolean),Object.keys(statLabels).map(s=>b.evs?.[s]||0),Object.keys(statLabels).map(s=>b.ivs?.[s]??31)]));}
  let evaluationStale=$derived(!!evaluation?.input?.members && signature(evaluation.input.members)!==signature(members));
  function fieldIssue(path){return analysisStale?'':(analysis?.legality?.issues||[]).filter(issue=>issue.path===path||issue.path?.startsWith(path+'.')).map(issue=>issue.message).join(' ');}
  let teamId = $state(null), saveStatus = $state('Carregando biblioteca…'), pendingReference = $state(null), history = $state([]), analysisStale = $state(false), teamAnalysis = $state(null);
  let saveSerial = 0;
  let mounted = false, pollErrors = 0;
  let liveStats = $state(null), statSerial = 0;
  $effect(() => {
    if(!hydrated || !draft?.pokemon) return;
    const build=$state.snapshot(draft), serial=++statSerial;
    const timer=setTimeout(async()=>{try{const result=await mutate('/stats',{configuration:configuration(build)});if(serial===statSerial)liveStats=result;}catch{if(serial===statSerial)liveStats=null;}},800);
    return ()=>clearTimeout(timer);
  });
  let pickerSlot = $state(null);
  let pokemonSearch = $state("");
  let optionsBusy = $state(false);
  let references = $state(untrack(() => data.references || []));
  let moveSlot = $state(null), moveSearch = $state('');
  let moveCandidates = $derived((options?.moves || []).filter(move => !moveSearch.trim() ||
    (move.name+' '+move.type+' '+move.category).toLowerCase().includes(moveSearch.trim().toLowerCase())));
  let currentReference = $derived(draft?.pokemon ? references.find(reference => signature([reference.configuration]) === signature([draft])) : null);
  let generation = $derived(Number(draft?.context_id?.match(/^gen(\d+)/)?.[1] || 9));
  let candidates = $derived(data.species.filter((p) => p.gen <= generation &&
    (!pokemonSearch || p.name.toLowerCase().includes(pokemonSearch.toLowerCase().trim()) || String(p.num) === pokemonSearch.trim())));
  async function openPicker(slot) {
    pickerSlot = slot; pokemonSearch = "";
    await tick(); document.getElementById("pokemon-search")?.focus();
  }
  async function choosePokemon(pokemon) {
    if (busy) return;
    busy = true;
    try {
      await protect('Trocar ou adicionar Pokémon');
      const slot = pickerSlot;
      const presets = await referenceBuilds(fetch, pokemon, draft.context_id);
      const fresh = { ...emptyBuild(draft.context_id), pokemon, name: 'Build de '+pokemon,
        ...(presets[0]?.configuration || {}), visibility: 'private' };
      members[slot] = fresh; selected = slot; draft = clone(fresh);
      pickerSlot = null; moveSlot = null;
      await refreshOptions();
      if (!presets.length) message = 'Não há build convencional validada para este Pokémon neste formato. Escolha seus golpes abaixo.';
    } catch (error) { message = error.message; }
    finally { busy = false; }
  }
  async function applyReference(id) {
    const reference = references.find(build => build.public_id === id);
    if (!reference) return;
    await action(async () => {
      await protect('Aplicar build convencional');
      draft = { ...emptyBuild(draft.context_id), ...clone(reference.configuration), visibility: 'private' };
      members[selected] = clone(draft);
      moveSlot = null;
    });
  }
  async function openMovePicker(slot) {
    moveSlot = slot; moveSearch = '';
    await tick(); document.getElementById('move-search')?.focus();
  }
  function chooseMove(move) {
    draft.moves[moveSlot] = move;
    moveSlot = null;
  }
  function adaptContext(member, context) {
    const gen = Number(context.match(/^gen(\d+)/)?.[1] || 9);
    return { ...clone(member), context_id: context,
      ...(gen < 3 ? {nature: "Serious", ability: ""} : {}),
      ...(gen < 2 ? {item: ""} : {}),
      ...(gen !== 9 ? {tera_type: ""} : {}) };
  }
  let hydrated = $state(false);
  let busy = $state(false);
  let message = $state("");
  let analysis = $state(null);
  let validation = $state(null);
  let teamName = $state("Minha equipe");
  let evaluation = $state(null);
  let recommendationSlot = $state(0);
  let importText = $state("");
  let showImport = $state(false);
  let requestSerial = 0;
  let polling;
  let capabilities = $derived(data.contexts?.find(c => c.id === draft?.context_id)?.capabilities || {});
  let evTotal = $derived(
    draft
      ? Object.values(draft.evs).reduce((a, b) => a + Number(b || 0), 0)
      : 0,
  );
  const clone = (x) => structuredClone($state.snapshot(x));
  function configuration(b) {
    return {
      ...clone(b),
      moves: b.moves.filter(Boolean),
      evs: Object.fromEntries(
        Object.entries(b.evs).map(([k, v]) => [k, Number(v || 0)]),
      ),
      ivs: Object.fromEntries(
        Object.entries(b.ivs).map(([k, v]) => [k, Number(v ?? 31)]),
      ),
    };
  }
  onMount(() => {
    mounted=true;
    let disposed = false;
    (async () => {
      try {
        const saved = await library();
        const query = new URLSearchParams(window.location.search);
        const existing = saved.teams.find(t => t.id === (query.get('team') || saved.active_id));
        let team = existing;
        if (query.has('new') || !team) team = await createTeam({name:'Minha equipe',context_id:data.initial.context_id,members:!query.has('new') && data.initial.pokemon ? [clone(data.initial)] : []});
        else if (data.explicit && data.initial.pokemon) pendingReference = clone(data.initial);
        if (disposed) return;
        teamId = team.id; teamName = team.name; members = team.members;
        if(!pendingReference) replaceState('/builder?team='+team.id+(query.get('discord')?'&discord='+encodeURIComponent(query.get('discord')):''),page.state);
        draft = clone(members[0] || emptyBuild(team.context_id)); history = team.history;
        await refreshOptions();
        const last = team.evaluations?.at(-1);
        if (last) {
          const response = await fetch('/api/v1/evaluations/'+last.id);
          if(response.ok) { evaluation = await response.json(); poll(); }
        }
        saveStatus = 'Salvo neste navegador';
        hydrated = true;
      } catch(e) { saveStatus = e.message; message = e.message; }
    })();
    return () => { disposed = true; mounted=false; clearTimeout(polling); };
  });
  $effect(() => {
    if (!draft?.pokemon) return;
    const snapshot = $state.snapshot(draft);
    untrack(() => {
      if (hydrated) {
        members[selected] = snapshot;
        analysisStale = !!analysis;
        validation = null;
      }
    });
  });
  $effect(() => {
    if (!hydrated) return;
    const saved = { members: $state.snapshot(members), name: teamName, context_id: draft.context_id };
    untrack(() => {
      const serial = ++saveSerial;
      saveStatus = 'Salvando…';
      saveTeam(teamId, saved).then(() => { if(serial===saveSerial) saveStatus='Salvo neste navegador'; }).catch(e => {saveStatus=e.message;});
    });
  });
  async function protect(reason) {
    if (!teamId) return;
    try {
      if (draft.pokemon) members[selected] = clone(draft);
      const team = await saveTeam(teamId,{name:teamName,members:clone(members),context_id:draft.context_id},reason);
      history = team.history;
    } catch(e) { message=e.message; throw e; }
  }
  async function useReference(asNew) {
    try {
      if (asNew) {
        const team = await createTeam({name:pendingReference.name || 'Nova equipe',members:[clone(pendingReference)]});
        window.location.href='/builder?team='+team.id;
      } else {
        await protect('Adicionar referência');
        members.push(clone(pendingReference)); selected=members.length-1; draft=clone(pendingReference); pendingReference=null; await refreshOptions();
      }
    } catch(e) {message=e.message;}
  }
  async function restoreVersion(version) {
    await protect('Antes de restaurar versão');
    members=clone(version.members); selected=0; teamName=version.name; draft=clone(members[0] || emptyBuild(version.context_id)); await refreshOptions();
  }
  async function diagnoseTeam() {
    await action(async()=>{ teamAnalysis=await mutate('/teams/analyze',{builds:members.map(configuration)}); });
  }
  async function refreshOptions() {
    const serial = ++requestSerial;
    moveSlot = null;
    liveStats = null;
    if (!draft.pokemon) { options = null; references = []; optionsBusy = false; return; }
    optionsBusy = true;
    try {
      const res = await fetch(
        "/api/v1/options?" +
          new URLSearchParams({
            pokemon: draft.pokemon,
            context_id: draft.context_id,
          }),
      );
      if (!res.ok)
        throw Error("Não foi possível carregar as opções deste Pokémon.");
      const [result, presets] = await Promise.all([res.json(), referenceBuilds(fetch, draft.pokemon, draft.context_id)]);
      if (serial !== requestSerial) return;
      options = result;
      references = presets;
      if (!result.supported) throw Error(result.reason);
      if (!result.context.capabilities.ability) draft.ability = "";
      else if (!result.abilities.includes(draft.ability))
        draft.ability = result.abilities[0] || "";
      message = "";
    } catch (e) {
      if (serial === requestSerial) message = e.message;
    } finally {
      if (serial === requestSerial) optionsBusy = false;
    }
  }
  async function changeContext() {
    const checkpoint = saveTeam(teamId, {}, 'Alterar formato');
    const context = draft.context_id;
    if (draft.pokemon) members[selected] = clone(draft);
    members = members.map((m) => adaptContext(m, context));
    draft = clone(members[selected] || emptyBuild(context));
    history = (await checkpoint).history;
    await refreshOptions();
    message =
      "Formato alterado. Confira todos os integrantes e valide novamente.";
  }
  function selectSlot(i) {
    if (i >= members.length) {
      if (members.length >= 6) return;
      openPicker(members.length);
      return;
    }
    selected = i;
    draft = clone(members[i]);
    analysis = null;
    refreshOptions();
  }
  async function removeSlot(index = selected) {
    await action(async () => {
      await protect('Remover integrante');
      const context = draft.context_id;
      members.splice(index, 1);
      selected = index < selected ? selected - 1 : Math.min(selected, members.length - 1);
      selected = Math.max(0, selected);
      draft = clone(members[selected] || emptyBuild(context));
      pickerSlot = null;
      analysis = null; validation = null; liveStats = null;
      await refreshOptions();
    });
  }
  function preset() {
    if (!['wall','physical-attacker','special-attacker'].includes(draft.role)) { message='Escolha uma distribuição manual para esta função. Não há preset genérico revisado.'; return; }
    draft.evs = Object.fromEntries(Object.keys(statLabels).map((s) => [s, 0]));
    if (capabilities.ev_total > 510) {
      draft.evs = Object.fromEntries(
        Object.keys(statLabels).map((s) => [s, 252]),
      );
      return;
    }
    if (draft.role === "wall") {
      draft.evs.hp = 252;
      draft.evs.def = 252;
      draft.evs.spd = 4;
    } else if (draft.role === "special-attacker") {
      draft.evs.spa = 252;
      draft.evs.spe = 252;
      draft.evs.spd = 4;
    } else {
      draft.evs.atk = 252;
      draft.evs.spe = 252;
      draft.evs.spd = 4;
    }
  }
  async function action(fn) {
    busy = true;
    message = "";
    try {
      await fn();
    } catch (e) {
      message = e.message;
    } finally {
      busy = false;
    }
  }
  async function analyze() {
    await action(async () => {
      analysis = await mutate("/analyze", {
        configuration: configuration(draft),
      });
      analysisStale = false;
    });
  }
  async function validate() {
    members[selected] = clone(draft);
    await action(async () => {
      validation = await mutate("/teams/validate", {
        builds: members.map(configuration),
      });
    });
  }
  async function evaluateTeam() {
    await action(async () => {
      evaluation = await mutate("/evaluations", {
        members: members.map(configuration),
        recommendation_slot: Number(recommendationSlot),
      });
      const team = await getTeam(teamId);
      await saveTeam(teamId, {evaluations:[...(team.evaluations || []),{id:evaluation.public_id,at:new Date().toISOString()}].slice(-20)});
      message='Avaliação iniciada. Você pode recarregar a página para continuar acompanhando.';
      poll();
    });
  }
  async function poll() {
    if (!mounted || !evaluation || !["queued", "running"].includes(evaluation.status))
      return;
    polling = setTimeout(async () => {
      try {
        const response = await fetch(
          "/api/v1/evaluations/" + evaluation.public_id,
          { headers: { Accept: "application/json" } },
        );
        if ([403,404].includes(response.status)) {message='A avaliação pertence a uma sessão anterior. Execute novamente para criar uma nova avaliação.';return;}
        if (!response.ok)
          throw Error("Não foi possível consultar a avaliação.");
        evaluation = await response.json();
        pollErrors=0;
        poll();
      } catch (e) {
        message = e.message;
        if(++pollErrors<=5) poll();
      }
    }, 3000);
  }
  function exportTeam() {
    const text = members
      .map(
        (b) =>
          `${b.nickname ? b.nickname + ' (' + b.pokemon + ')' : b.pokemon}${b.item ? " @ " + b.item : ""}\nAbility: ${b.ability}\nLevel: ${b.level}\n${b.tera_type ? "Tera Type: " + b.tera_type + "\n" : ""}EVs: ${Object.entries(
            b.evs,
          )
            .filter(([, v]) => v)
            .map(
              ([s, v]) =>
                v +
                " " +
                {
                  hp: "HP",
                  atk: "Atk",
                  def: "Def",
                  spa: "SpA",
                  spd: "SpD",
                  spe: "Spe",
                }[s],
            )
            .join(" / ")}\n${b.nature} Nature\nIVs: ${Object.entries(b.ivs)
            .map(
              ([s, v]) =>
                v +
                " " +
                {
                  hp: "HP",
                  atk: "Atk",
                  def: "Def",
                  spa: "SpA",
                  spd: "SpD",
                  spe: "Spe",
                }[s],
            )
            .join(" / ")}\n${b.moves
            .filter(Boolean)
            .map((m) => "- " + m)
            .join("\n")}`,
      )
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "illke-team.txt";
    a.click();
    URL.revokeObjectURL(url);
  }
  async function importTeam() {
    await action(async () => {
      const response = await mutate("/teams/import", {
        text: importText,
        context_id: draft.context_id,
      });
      if (!response.length || response.length > 6)
        throw Error("Importe de 1 a 6 Pokémon.");
      await protect('Importar equipe Showdown');
      members = response;
      selected = 0;
      draft = clone(members[0]);
      showImport = false;
      await refreshOptions();
      message = "Equipe importada. Confira a legalidade.";
    });
  }
</script>

<svelte:head><title>Builder de equipes — illke</title></svelte:head>
{#if pendingReference}<section class="content-panel" aria-label="Abrir referência"><h2>Como você quer usar {pendingReference.pokemon}?</h2><p>Sua equipe atual será preservada.</p><div class="actions"><button class="button" onclick={()=>useReference(false)} disabled={members.length>=6 || pendingReference.context_id!==draft.context_id}>Adicionar à equipe atual</button><button class="button secondary" onclick={()=>useReference(true)}>Criar nova equipe</button><button class="text-link" onclick={()=>pendingReference=null}>Cancelar</button></div>{#if pendingReference.context_id!==draft.context_id}<p class="help">A referência usa outro formato. Crie uma nova equipe para manter as regras de cada uma.</p>{/if}</section>{/if}
<div class="page-header split">
  <div>
    <div class="breadcrumbs"><a href="/">illke</a><span>/</span>Builder</div>
    <h1>Criar equipe</h1>
    <p>Edite os golpes, itens, habilidades e atributos de até seis Pokémon.</p>
  </div>
  <div class="actions" style="margin:0">
    <button
      class="button secondary small"
      onclick={() => (showImport = !showImport)}
      ><Upload size={15} /> Importar</button
    ><button
      class="button secondary small"
      onclick={exportTeam}
      disabled={!members.length}><Download size={15} /> Exportar</button
    >
  </div>
</div>
{#if data.error || !draft}<div class="notice error">
    {data.error || "O builder está indisponível."}
  </div>{:else}
  {#if showImport}<div class="content-panel">
      <label for="team-import">Cole uma equipe no formato Showdown</label
      ><textarea
        id="team-import"
        style="width:100%;margin-top:12px"
        bind:value={importText}></textarea><button
        class="button"
        onclick={importTeam}
        disabled={busy || optionsBusy}>Importar equipe</button
      >
    </div>{/if}
  <div class="toolbar">
    <label for="team-name" class="filter-label">Equipe</label><input
      id="team-name"
      bind:value={teamName}
    /><label for="format" class="sr-only">Formato</label><select
      id="format"
      bind:value={draft.context_id}
      onchange={changeContext}
      >{#each data.contexts as c}<option value={c.id}>{c.label}</option
        >{/each}</select
    ><span class="help" role="status">{saveStatus}</span><a class="text-link" href="/equipes">Minhas equipes</a><a class="text-link" href="/builder?new=1">Nova equipe vazia</a>
  </div>
  <div class="team-slots">
    {#each Array.from({ length: 6 }, (_, i) => i) as i}<div class="team-slot-container"><button
        class="team-slot"
        class:selected={selected === i}
        onclick={() => selectSlot(i)}
        disabled={busy || !hydrated}
        aria-label={members[i]
          ? "Editar " + members[i].pokemon
          : "Adicionar integrante " + (i + 1)}
        ><span class="slot-number">{String(i + 1).padStart(2, "0")}</span
        >{#if members[i]}<img
            src={sprite(members[i].pokemon)}
            alt=""
            width="85"
            height="80"
          /><strong>{members[i].pokemon}</strong><small
            >{roles[members[i].role]}</small
          >{:else}<Plus size={24} /><small>Adicionar Pokémon</small
          >{/if}</button
      >{#if members[i]}<button class="danger-link remove-member" disabled={busy || !hydrated} onclick={()=>removeSlot(i)} aria-label={'Remover '+members[i].pokemon+' da equipe'}><Trash2 size={14} /> Remover</button>{/if}</div>{/each}
  </div>
  {#if pickerSlot !== null}
    <section class="content-panel pokemon-picker" aria-label="Selecionar Pokémon">
      <div class="picker-heading"><h2>{pickerSlot >= members.length ? "Adicionar Pokémon" : "Trocar Pokémon"}</h2>
        <button class="button secondary small" onclick={() => pickerSlot = null}>Cancelar</button></div>
      <label for="pokemon-search">Nome, forma ou número — gerações 1 a {generation}</label>
      <input id="pokemon-search" type="search" bind:value={pokemonSearch} placeholder="Buscar Pokémon" />
      <p class="help" aria-live="polite">{candidates.length} opções{candidates.length > 48 ? ". Exibindo as primeiras 48; digite para buscar." : "."}</p>
      <div class="picker-grid">
        {#each candidates.slice(0, 48) as p}<button disabled={busy} onclick={() => choosePokemon(p.name)} aria-label={"Selecionar " + p.name}>
          <img src={sprite(p.name)} alt="" loading="lazy" width="64" height="64" /><span>{p.name}</span><small>#{p.num} · Geração {p.gen}</small>
        </button>{:else}<p>Nenhum Pokémon nesta geração com esse nome.</p>{/each}
      </div>
    </section>
  {/if}
  <p class="context-note">
    {options?.context?.scope || "Escolha um formato para carregar as regras."} Os
    formatos OU são referências competitivas por geração. Regras específicas de cartucho,
    campanha e Legends ainda não estão disponíveis.
  </p>
  {#if message}<div class="notice" role="status">{message}</div>{/if}
  {#if !members.length}<section class="empty-panel"><h2>Sua equipe está vazia</h2><p>Escolha os Pokémon que você quer usar. Nenhum integrante será adicionado automaticamente.</p><button class="button" disabled={busy || !hydrated} onclick={()=>openPicker(0)}><Plus size={16} /> Adicionar primeiro Pokémon</button></section>{/if}
  {#if draft.pokemon}
  <div class="builder-grid">
    <nav class="builder-section-nav" aria-label="Seções do editor"><a href="#configuration">Configuração</a><a href="#training">Treinamento</a><a href="#team-analysis">Análise</a><button type="button" onclick={analyze} disabled={busy||optionsBusy}>Revisar alterações</button></nav>
    <section class="content-panel">
      <div class="builder-pokemon-title">
        <img
          src={sprite(draft.pokemon)}
          alt={draft.pokemon}
          width="75"
          height="75"
        />
        <div>
          <h2>{draft.pokemon}</h2>
          <p>Integrante {selected + 1} / {members.length}</p>
        </div>
        <button
          class="button secondary small"
          style="margin-left:auto"
          onclick={()=>removeSlot()}
          aria-label="Remover integrante"><Trash2 size={16} /> Remover</button
        >
      </div>
      <div class="form-grid">
        <span id="configuration"></span>
        <div class="wide natural-types"><span class="help">Tipagem do Pokémon</span><div class="actions">{#each options?.pokemon_types || [] as type}<span class="natural-type"><TypeIcon {type} size={22} />{type}</span>{/each}</div><small class="help">Definida pela espécie e forma do Pokémon.</small></div>
        {#if references.length}<label class="wide">Build convencional<select value={currentReference?.public_id || ''} onchange={event=>applyReference(event.currentTarget.value)} disabled={busy || optionsBusy}><option value="">Configuração personalizada</option>{#each references as reference}<option value={reference.public_id}>{reference.name}</option>{/each}</select><small class="help">Ao adicionar o Pokémon, usamos a primeira referência validada deste formato. Você pode escolher outra build ou trocar seus golpes.</small>{#if currentReference?.source_url}<a class="text-link" href={currentReference.source_url} target="_blank" rel="noreferrer">Fonte da build</a>{/if}</label>{/if}
        <div class="wide"><span class="help">Pokémon ou forma</span>
          <button class="button secondary" onclick={() => openPicker(selected)}>Trocar Pokémon</button>
        </div><label
          >Nome da build<input bind:value={draft.name} maxlength="100" />{#if !draft.name?.trim()}<small class="field-error">Dê um nome à build.</small>{/if}{#if fieldIssue('name')}<small class="field-error">{fieldIssue('name')}</small>{/if}</label
        ><label>Apelido do Pokémon<input bind:value={draft.nickname} maxlength="18" placeholder="Opcional" /></label
        ><label
          >Função<select bind:value={draft.role}
            >{#each Object.entries(roles) as [value, label]}<option {value}
                >{label}</option
              >{/each}</select
          ></label
        ><label
          >Nível<input
            type="number"
            min="1"
            max="100"
            bind:value={draft.level}
          />{#if !draft.level || draft.level<1 || draft.level>100}<small class="field-error">Use um nível de 1 a 100.</small>{/if}</label
        ><label
          >Nature<select
            bind:value={draft.nature}
            disabled={!capabilities.nature}
            >{#each options?.natures || [] as n}<option value={n.name}
                >{n.name}{n.plus
                  ? " (+" + n.plus + " / −" + n.minus + ")"
                  : ""}</option
              >{/each}</select
          ></label
        ><label
          >Habilidade<span class="input-with-icon"
            ><EntityIcon kind="ability" name={draft.ability} size={24} /><select
              bind:value={draft.ability}
              disabled={!capabilities.ability}
              ><option value="">Sem habilidade</option
              >{#each options?.abilities || [] as ability}<option
                  value={ability}>{ability}</option
                >{/each}</select
            ></span
          >{#if options?.ability_descriptions?.[draft.ability]}<small class="help">{options.ability_descriptions[draft.ability]}</small>{/if}</label
        ><label
          >Item<span class="input-with-icon"
            >{#if draft.item}<EntityIcon
                kind="item"
                name={draft.item}
                size={28}
              />{/if}<input
              list="items"
              bind:value={draft.item}
              disabled={!capabilities.held_item}
            /></span
          >{#if options?.items?.find(item=>item.name.toLowerCase()===draft.item.toLowerCase())?.description}<small class="help">{options.items.find(item=>item.name.toLowerCase()===draft.item.toLowerCase()).description}</small>{/if}</label
        ><datalist id="items"
          >{#each options?.items || [] as item}<option value={item.name}
            ></option>{/each}</datalist
        >
        <div class="wide">
          <h3 style="font-size:16px;margin:10px 0 12px">Golpes</h3>
          <div class="moves-inputs">
            {#each [0, 1, 2, 3] as i}<div class="move-field"
                ><span class="help">Golpe {i + 1}</span><button class="move-picker-button" disabled={busy || optionsBusy} onclick={()=>openMovePicker(i)} aria-label={'Alterar golpe '+(i+1)}
                  >{#if moveIconData(draft.moves[i])}<TypeIcon
                      type={moveIconData(draft.moves[i]).type}
                      size={20}
                    />{/if}<span>{draft.moves[i] || 'Selecionar golpe'}</span></button
                >{#if options?.move_restrictions?.[draft.moves[i]]?.length}<small class="field-error">Opção com restrições: {options.move_restrictions[draft.moves[i]].join(' ')}</small>{/if}{#if draft.moves[i] && draft.moves.filter(m=>m?.toLowerCase()===draft.moves[i].toLowerCase()).length>1}<small class="field-error">Este golpe está repetido.</small>{/if}</div
              >{/each}
          </div>
          {#if moveSlot !== null}<section class="move-picker" aria-label={'Escolher golpe '+(moveSlot+1)}>
            <div class="picker-heading"><h4>Escolher golpe {moveSlot+1}</h4><button class="text-link" onclick={()=>moveSlot=null}>Fechar</button></div>
            <label for="move-search">Pesquisar golpes que {draft.pokemon} aprende</label><input id="move-search" type="search" bind:value={moveSearch} placeholder="Nome, tipo ou categoria" />
            <p class="help" aria-live="polite">{moveCandidates.length} golpes disponíveis nesta geração</p>
            <div class="move-results">{#each moveCandidates as move}<button class="move-result" onclick={()=>chooseMove(move.name)} disabled={draft.moves.some((name,index)=>index!==moveSlot && name===move.name)}><TypeIcon type={move.type} size={20}/><span><strong>{move.name}</strong><small>{move.type} · {move.category} · Poder {move.power || '—'}{options?.move_restrictions?.[move.name]?.length ? ' · Sujeito às regras do formato' : ''}</small></span></button>{:else}<p>Nenhum golpe encontrado no repertório deste Pokémon.</p>{/each}</div>
            <button class="text-link" onclick={()=>chooseMove('')}>Deixar este golpe vazio</button>
          </section>{/if}
          <p class="help">
            Escolha entre os golpes que este Pokémon aprende nesta geração. A validação também confere as restrições do formato e da combinação.
          </p>
        </div>
        <div class="wide">
          <div class="section-heading" style="margin:12px 0">
            <span id="training"></span>
            <h3 style="font-size:16px;margin:0">
              EVs <span class="help"
                >{evTotal} / {capabilities.ev_total || 510}</span
              >
            </h3>
            <button class="button secondary small" onclick={preset} disabled={optionsBusy || !['wall','physical-attacker','special-attacker'].includes(draft.role)}
              >Distribuir pela função</button
            >
          </div>
          <div class="stat-inputs">
            {#each Object.entries(statLabels) as [s, label]}<label
                >{label}<input
                  type="number"
                  min="0"
                  max="252"
                  bind:value={draft.evs[s]}
                /></label
              >{/each}
          </div>
        </div>
        <div class="wide">
          <h3 style="font-size:16px;margin:10px 0 12px">IVs</h3>
          <div class="stat-inputs">
            {#each Object.entries(statLabels) as [s, label]}<label
                >{label}<input
                  type="number"
                  min="0"
                  max="31"
                  bind:value={draft.ivs[s]}
                /></label
              >{/each}
          </div>
          {#if options?.context?.generation <= 2}<p class="help">
              A entrada usa a representação de treinamento do Showdown para esta
              geração.
            </p>{/if}
        </div>
        <label class="wide"
          >Como esta build funciona<textarea
            bind:value={draft.strategy}
            maxlength="20000"
            placeholder="Função, parceiros recomendados e limitações da build."
          ></textarea></label
        >
      </div>
      <div class="actions">
        <button class="button" onclick={analyze} disabled={busy || optionsBusy}
          ><Shield size={16} /> Analisar build</button
        >
      </div>
      <ShareBuild build={configuration(draft)} analysis={analysisStale ? null : analysis} />
      {#if history.length}<details class="content-panel"><summary>Recuperar versão anterior ({history.length})</summary>{#each [...history].reverse() as version}<p>{version.reason} · {new Date(version.at).toLocaleString('pt-BR')} <button class="button secondary small" onclick={()=>restoreVersion(version)}>Restaurar</button></p>{/each}</details>{/if}
    </section>
    <aside class="builder-sidebar">
      <div class="content-panel" style="margin-top:0">
        <span id="team-analysis"></span>
        <h2>Legalidade</h2>
        {#if liveStats}<h3>Atributos atuais</h3><div class="stats">{#each Object.entries(liveStats) as [stat,value]}<div class="stat"><span>{statLabels[stat] || stat}</span><strong>{value}</strong></div>{/each}</div>{/if}
        <p>
          Verifique se os integrantes seguem as regras do formato selecionado.
        </p>
        <button class="button secondary full" onclick={validate} disabled={busy || optionsBusy}
          >Validar equipe</button
        >{#if validation}<div class="notice" role="status">
            {#if validation.issues.length}{#each validation.issues as issue}<p>
                  {issue}
                </p>{/each}{:else}Equipe legal neste formato.{/if}
          </div>{/if}
        {#if analysisStale}<p class="notice">A configuração mudou. A análise abaixo precisa ser atualizada.</p>{/if}
        {#if analysis}<div
            class="notice"
            class:success={analysis.legality.status === "legal"}
            role="status"
          >
            <strong
              >{analysis.legality.status === "legal"
                ? "Conjunto legal"
                : "Revise a build"}</strong
            >{#each analysis.legality.issues as issue}<p>
                {issue.message}
              </p>{/each}
          </div>
          {#if analysis.stats}<div class="stats">
              {#each Object.entries(analysis.stats) as [s, value]}<div
                  class="stat"
                  style="grid-template-columns:90px 1fr"
                >
                  <span>{statLabels[s]}</span><strong>{value}</strong>
                </div>{/each}
            </div>{/if}{#each analysis.evidence || [] as evidence}<p
              class="help"
            >
              {evidence.message}
            </p>{/each}{/if}
      </div>
      <div class="content-panel">
        <h2>Diagnóstico da equipe</h2><p>Cobertura, velocidades e recursos da equipe, sem pontuação inventada.</p><button class="button secondary full" onclick={diagnoseTeam} disabled={busy||optionsBusy}>Analisar equipe</button>
        {#if teamAnalysis}{#each teamAnalysis.observations as observation}<p class="notice"><strong>{observation.title}</strong><br/>{observation.message}</p>{/each}<h3>Velocidades calculadas</h3>{#each teamAnalysis.speed_tiers as member}<p>{member.pokemon}: {member.speed ?? 'não calculada'}</p>{/each}<details><summary>Resistências e cobertura</summary>{#each teamAnalysis.type_profile as type}<p><strong>{type.type}</strong>: {type.weak.length} fracos · {type.resist.length} resistentes · {type.immune.length} imunes</p>{/each}<h3>Golpes super efetivos por tipo puro</h3>{#each teamAnalysis.offensive_coverage as type}<p>{type.type}: {type.super_effective_moves.join(', ')||'nenhum identificado'}</p>{/each}</details><p class="help">{teamAnalysis.limitations?.join(' ')}</p><a class="text-link" href="/calculos">Comparar dano e matchups</a>{/if}
      </div>
      <div class="content-panel">
        <Swords size={22} />
        {#if data.contexts?.find(c=>c.id===draft.context_id)?.availability?.simulation===false}<p class="notice">{data.contexts.find(c=>c.id===draft.context_id).availability.reason}</p>{/if}
        <h2 style="margin-top:12px">Simulação de batalhas</h2>
        <p>
          Simule 1.000 batalhas contra equipes sintéticas de referência, com a
          mesma política automatizada nos dois lados.
        </p>
        <label class="filter-label" for="recommend-slot"
          >Procurar alternativa para</label
        ><select
          id="recommend-slot"
          style="width:100%;margin:12px 0"
          bind:value={recommendationSlot}
          >{#each members as member, i}<option value={i}
              >Slot {i + 1}: {member.pokemon}</option
            >{/each}</select
        ><button
          class="button full"
          onclick={evaluateTeam}
          disabled={busy || optionsBusy || members.length !== 6 || data.contexts?.find(c=>c.id===draft.context_id)?.availability?.simulation===false}
          >Avaliar equipe completa</button
        >
        <p class="help">
          Requer seis integrantes. Não exige cadastro. A estimativa vale para o
          benchmark, não prevê partidas humanas.
        </p>
      </div>
    </aside>
  </div>
  {/if}
  {#if evaluation}<section class="content-panel" aria-live="polite">
      <h2>Avaliação da equipe</h2>
      {#if evaluationStale}<p class="notice">Esta avaliação corresponde à equipe enviada anteriormente. A configuração atual foi alterada; execute outra avaliação para compará-la.</p>{/if}
      {#if evaluation.status==='failed'||evaluation.can_resume}<button class="button" onclick={()=>action(async()=>{evaluation=await mutate('/evaluations',evaluation.input);pollErrors=0;poll();})}>Retomar avaliação original</button>{/if}
      <p class="help">{evaluation.phase || evaluation.status} · {evaluation.progress || 0}% das etapas concluídas</p>
      {#if ['queued','running'].includes(evaluation.status)}<button class="button secondary small" onclick={()=>action(async()=>{evaluation=await mutate('/evaluations/'+evaluation.public_id,undefined,'DELETE');clearTimeout(polling);})}>Cancelar avaliação</button>{/if}
      {#if evaluation.status==='cancelled'}<p>Avaliação cancelada. Sua equipe foi preservada.</p>{/if}
      {#if evaluation.status === "queued" || evaluation.status === "running"}<p>
          Avaliação {evaluation.status === "queued"
            ? "na fila"
            : "em andamento"}. Os resultados aparecerão aqui. A comparação de
          alternativas pode levar alguns minutos.
        </p>{:else if evaluation.status === "failed"}<p class="field-error">
          {evaluation.error}
        </p>{:else if evaluation.status==='completed' && evaluation.result}{@const result = evaluation.result}
        <div class="result-number">
          {(result.win_rate * 100).toFixed(1)}%<small
            >Vitórias neste benchmark · IC 95%: {(
              result.interval_95[0] * 100
            ).toFixed(1)}–{(result.interval_95[1] * 100).toFixed(1)}%</small
          >
        </div>
        <div class="result-metrics">
          <div><strong>{result.wins}</strong>Vitórias</div>
          <div><strong>{result.losses}</strong>Derrotas</div>
          <div><strong>{result.draws}</strong>Empates / limite de turnos</div>
        </div>
        {#each result.limitations as limit}<p class="help">{limit}</p>{/each}
        <h3>Alternativas para o slot {Number(evaluation.input?.recommendation_slot ?? recommendationSlot) + 1}</h3>
        <p>{result.search_summary?.tested ?? 0} alternativas distintas testadas. Comparação pareada, com correção de Holm.</p>
        {#if !result.recommendations.length}<p>
            Nenhuma das alternativas testadas demonstrou melhora suficiente
            neste benchmark.
          </p>{/if}{#each result.recommendations as rec}<div class="notice">
            <strong>{rec.build.pokemon} / {rec.build.name}</strong>
            <p>{rec.reason}</p>
            <p>
              {(rec.comparison.win_rate * 100).toFixed(1)}% de vitórias. Item: {rec
                .build.item}; golpes: {rec.build.moves.join(", ")}.
            </p>
            <button
              class="button secondary"
              onclick={() => {
                selected = rec.slot;
                draft = clone(rec.build);
                refreshOptions();
              }}>Aplicar alternativa</button
            >
          </div>{/each}
        <details>
          <summary>Adversários e método</summary>
          <p>{result.benchmark.description}</p>
          <p class="help">
            Política {result.benchmark.policy} · limite de {result.benchmark
              .max_turns} turnos · {result.samples} batalhas · {result.benchmark
              .hash}
          </p>
          {#each result.benchmark.teams as team, i}<p>
              Equipe {i + 1}: {team.map((p) => p.pokemon).join(", ")}
            </p>{/each}
        </details>{/if}
    </section>{/if}
{/if}

<style>
  .team-slot-container { min-width:0; display:flex; flex-direction:column; gap:8px; }
  .team-slot-container :global(.team-slot) { width:100%; flex:1; }
  .remove-member { display:flex; align-items:center; justify-content:center; gap:5px; padding:5px; }
  .natural-type { display:inline-flex; align-items:center; gap:6px; }
  .move-field { min-width:0; display:flex; flex-direction:column; gap:6px; }
  .move-picker-button { width:100%; display:flex; align-items:center; gap:8px; padding:12px; border:1px solid var(--border); border-radius:7px; background:var(--surface); color:var(--text); text-align:left; cursor:pointer; }
  .move-picker { margin-top:16px; padding:16px; border:1px solid var(--border); border-radius:8px; }
  .move-picker > input { width:100%; margin:8px 0; }
  .move-results { max-height:320px; overflow-y:auto; display:grid; gap:6px; margin:10px 0; }
  .move-result { display:flex; align-items:center; gap:10px; padding:10px; text-align:left; border:1px solid var(--border); border-radius:6px; background:var(--surface); color:var(--text); cursor:pointer; }
  .move-result span { display:flex; flex-direction:column; gap:4px; }
  .move-result small { color:var(--muted); }
  .pokemon-picker { margin-bottom: 20px; }
  .picker-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; }
  .pokemon-picker > input { width:100%; margin:8px 0; }
  .picker-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); max-height:430px; overflow-y:auto; gap:8px; }
  .picker-grid button { display:flex; flex-direction:column; align-items:center; border:1px solid var(--border); background:var(--surface); color:inherit; border-radius:10px; padding:10px; cursor:pointer; }
  .picker-grid button:hover { border-color:var(--accent); }
  .picker-grid small { opacity:.65; margin-top:4px; }
</style>
