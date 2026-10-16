<script>
  import { onMount, untrack } from "svelte";
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
  import ShareBuild from "$lib/components/ShareBuild.svelte";
  import { mutate, sprite, statLabels, roles } from "$lib/api.js";
  let { data } = $props();
  let draft = $state(untrack(() => structuredClone(data.initial)));
  let options = $state(untrack(() => data.options));
  let members = $state(
    untrack(() => (data.initial ? [structuredClone(data.initial)] : [])),
  );
  let selected = $state(0);
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
  let capabilities = $derived(options?.context?.capabilities || {});
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
    if (!data.explicit) {
      try {
        const saved = JSON.parse(
          localStorage.getItem("illke-team-v1") || "null",
        );
        if (saved?.members?.length && saved.members.length <= 6) {
          members = saved.members;
          draft = clone(members[0]);
          teamName = saved.name || teamName;
          refreshOptions();
        }
      } catch {}
    }
    hydrated = true;
    return () => clearTimeout(polling);
  });
  $effect(() => {
    if (!draft) return;
    const snapshot = $state.snapshot(draft);
    untrack(() => {
      if (hydrated) {
        members[selected] = snapshot;
        analysis = null;
        validation = null;
        evaluation = null;
        clearTimeout(polling);
      }
    });
  });
  $effect(() => {
    if (!hydrated) return;
    const saved = { members: $state.snapshot(members), name: teamName };
    try {
      localStorage.setItem("illke-team-v1", JSON.stringify(saved));
    } catch {}
  });
  async function refreshOptions() {
    const serial = ++requestSerial;
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
      const result = await res.json();
      if (serial !== requestSerial) return;
      options = result;
      if (!result.supported) throw Error(result.reason);
      if (!result.abilities.includes(draft.ability))
        draft.ability = result.abilities[0] || "";
      message = "";
    } catch (e) {
      if (serial === requestSerial) message = e.message;
    }
  }
  async function changeContext() {
    const context = draft.context_id;
    members = members.map((m) => ({ ...clone(m), context_id: context }));
    await refreshOptions();
    message =
      "Formato alterado. Confira todos os integrantes e valide novamente.";
  }
  function selectSlot(i) {
    if (i >= members.length) {
      if (members.length >= 6) return;
      members.push({ ...clone(data.initial), context_id: draft.context_id });
    }
    selected = i;
    draft = clone(members[i]);
    analysis = null;
    refreshOptions();
  }
  function removeSlot() {
    if (members.length === 1) {
      message = "Mantenha ao menos um integrante no rascunho.";
      return;
    }
    members.splice(selected, 1);
    selected = 0;
    draft = clone(members[0]);
    refreshOptions();
  }
  function preset() {
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
    });
  }
  async function validate() {
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
      poll();
    });
  }
  async function poll() {
    if (!evaluation || !["queued", "running"].includes(evaluation.status))
      return;
    polling = setTimeout(async () => {
      try {
        const response = await fetch(
          "/api/v1/evaluations/" + evaluation.public_id,
          { headers: { Accept: "application/json" } },
        );
        if (!response.ok)
          throw Error("Não foi possível consultar a avaliação.");
        evaluation = await response.json();
        poll();
      } catch (e) {
        message = e.message;
      }
    }, 3000);
  }
  function exportTeam() {
    const text = members
      .map(
        (b) =>
          `${b.pokemon}${b.item ? " @ " + b.item : ""}\nAbility: ${b.ability}\nLevel: ${b.level}\n${b.tera_type ? "Tera Type: " + b.tera_type + "\n" : ""}EVs: ${Object.entries(
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
<div class="page-header split">
  <div>
    <div class="breadcrumbs"><a href="/">illke</a><span>/</span>Builder</div>
    <h1>Sua bancada de batalha.</h1>
    <p>Escolha seis parceiros. Dê uma função a cada um.</p>
  </div>
  <div class="actions" style="margin:0">
    <button
      class="button secondary small"
      onclick={() => (showImport = !showImport)}
      ><Upload size={15} /> Importar</button
    ><button
      class="button secondary small"
      onclick={exportTeam}
      disabled={!draft}><Download size={15} /> Exportar</button
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
        disabled={busy}>Importar equipe</button
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
    ><span class="help">Rascunho salvo neste navegador</span>
  </div>
  <div class="team-slots">
    {#each Array.from({ length: 6 }, (_, i) => i) as i}<button
        class="team-slot"
        class:selected={selected === i}
        onclick={() => selectSlot(i)}
        disabled={i > members.length}
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
      >{/each}
  </div>
  <p class="context-note">
    {options?.context?.scope || "Escolha um formato para carregar as regras."} Os
    formatos OU são referências competitivas por geração. Regras específicas de cartucho,
    campanha e Legends ainda não estão disponíveis.
  </p>
  {#if message}<div class="notice" role="status">{message}</div>{/if}
  <div class="builder-grid">
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
          class="icon-button"
          style="margin-left:auto"
          onclick={removeSlot}
          aria-label="Remover integrante"><Trash2 size={16} /></button
        >
      </div>
      <div class="form-grid">
        <label class="wide"
          >Pokémon ou forma<input
            list="species"
            bind:value={draft.pokemon}
            onchange={refreshOptions}
          /></label
        ><datalist id="species"
          >{#each data.species.filter((p) => p.gen <= (options?.context?.generation || 9)) as p}<option
              value={p.name}
            ></option>{/each}</datalist
        ><label
          >Nome da build<input bind:value={draft.name} maxlength="100" /></label
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
          /></label
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
          >Habilidade<select
            bind:value={draft.ability}
            disabled={!capabilities.ability}
            ><option value="">Sem habilidade</option
            >{#each options?.abilities || [] as ability}<option value={ability}
                >{ability}</option
              >{/each}</select
          ></label
        ><label
          >Item<input
            list="items"
            bind:value={draft.item}
            disabled={!capabilities.held_item}
          /></label
        ><datalist id="items"
          >{#each options?.items || [] as item}<option value={item.name}
            ></option>{/each}</datalist
        >{#if capabilities.tera}<label
            >Tipo Tera<select bind:value={draft.tera_type}
              ><option value="">Sem seleção</option
              >{#each options?.types || [] as type}<option value={type}
                  >{type}</option
                >{/each}</select
            ></label
          >{/if}
        <div class="wide">
          <h3 style="font-size:16px;margin:10px 0 12px">Golpes</h3>
          <div class="moves-inputs">
            {#each [0, 1, 2, 3] as i}<label
                >Golpe {i + 1}<input
                  list="moves"
                  bind:value={draft.moves[i]}
                  placeholder="Selecionar golpe"
                /></label
              >{/each}
          </div>
          <datalist id="moves"
            >{#each options?.moves || [] as move}<option value={move.name}
                >{move.type} · {move.category} · {move.power || "—"}</option
              >{/each}</datalist
          >
          <p class="help">
            A lista inclui candidatos por geração. A validação verifica se a
            combinação é legal.
          </p>
        </div>
        <div class="wide">
          <div class="section-heading" style="margin:12px 0">
            <h3 style="font-size:16px;margin:0">
              EVs <span class="help"
                >{evTotal} / {capabilities.ev_total || 510}</span
              >
            </h3>
            <button class="button secondary small" onclick={preset}
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
            placeholder="Descreva a função, os parceiros e as situações em que ela funciona."
          ></textarea></label
        >
      </div>
      <div class="actions">
        <button class="button" onclick={analyze} disabled={busy}
          ><Shield size={16} /> Analisar build</button
        >
      </div>
      <ShareBuild build={configuration(draft)} {analysis} />
    </section>
    <aside class="builder-sidebar">
      <div class="content-panel" style="margin-top:0">
        <h2>Antes de entrar em campo</h2>
        <p>
          Confira o conjunto e as regras da equipe antes de avaliar o
          desempenho.
        </p>
        <button class="button secondary full" onclick={validate} disabled={busy}
          >Validar equipe</button
        >{#if validation}<div class="notice" role="status">
            {#if validation.issues.length}{#each validation.issues as issue}<p>
                  {issue}
                </p>{/each}{:else}Equipe legal neste formato.{/if}
          </div>{/if}
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
        <Swords size={22} />
        <h2 style="margin-top:12px">Teste sua equipe</h2>
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
          disabled={busy || members.length !== 6}
          >Avaliar equipe completa</button
        >
        <p class="help">
          Requer seis integrantes. Não exige cadastro. A estimativa vale para o
          benchmark, não prevê partidas humanas.
        </p>
      </div>
    </aside>
  </div>
  {#if evaluation}<section class="content-panel" aria-live="polite">
      <h2>Avaliação da equipe</h2>
      {#if evaluation.status === "queued" || evaluation.status === "running"}<p>
          Avaliação {evaluation.status === "queued"
            ? "na fila"
            : "em andamento"}. Os resultados aparecerão aqui. A comparação de
          alternativas pode levar alguns minutos.
        </p>{:else if evaluation.status === "failed"}<p class="field-error">
          {evaluation.error}
        </p>{:else if evaluation.result}{@const result = evaluation.result}
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
        <h3>Alternativas para o slot {Number(recommendationSlot) + 1}</h3>
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
