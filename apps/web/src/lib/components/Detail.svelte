<script>
  import { ArrowRight, Plus } from "@lucide/svelte";
  import TypeBadge from "./TypeBadge.svelte";
  import EntityIcon from "./EntityIcon.svelte";
  import CategoryBadge from "./CategoryBadge.svelte";
  import BuildList from "./BuildList.svelte";
  let { data } = $props();
  let entry = $derived(data.entry);
  let a = $derived(entry.attributes);
  const stats = {
    hp: "HP",
    attack: "Ataque",
    defense: "Defesa",
    "special-attack": "At. especial",
    "special-defense": "Def. especial",
    speed: "Velocidade",
  };
</script>

<svelte:head><title>{entry.name} — illke</title></svelte:head>
<div class="page-header">
  <div class="breadcrumbs">
    <a href="/">illke</a><span>/</span><a
      href={entry.kind === "pokemon"
        ? "/pokedex"
        : entry.kind === "item"
          ? "/itens"
          : entry.kind === "move"
            ? "/golpes"
            : "/habilidades"}>Catálogo</a
    ><span>/</span>{entry.name}
  </div>
  <h1>{entry.name}</h1>
  <div class="types">
    {#each a.types || [] as type}<TypeBadge {type} />{/each}
  </div>
</div>
{#if entry.kind === "pokemon"}<div class="detail-grid">
    <aside>
      <div class="detail-portrait">
        <EntityIcon
          entry={{ ...entry, image: a.sprites?.artwork || entry.image }}
          size={240}
          decorative={false}
        />
      </div>
      <div class="actions">
        {#if a.sprites?.shiny}<a
            class="text-link"
            href={a.sprites.shiny.url}
            rel="noreferrer">Ver sprite shiny</a
          >{/if}
      </div>
      <p class="help">
        Imagem genérica do acervo PokéAPI. Pode não corresponder à aparência de
        um jogo específico.
      </p>
    </aside>
    <div>
      <div class="content-panel" style="margin-top:0">
        <h2>Atributos base</h2>
        <div class="stats">
          {#each Object.entries(a.stats || {}) as [stat, value]}<div
              class="stat"
            >
              <span>{stats[stat] || stat}</span><strong>{value}</strong>
              <div class="stat-track">
                <span
                  style={"width:" +
                    Math.min(100, (Number(value) / 255) * 100) +
                    "%"}
                ></span>
              </div>
            </div>{/each}
        </div>
        <p class="help" style="margin:20px 0 0">
          Valores da fonte atual. Os cálculos do builder usam as regras da
          geração selecionada.
        </p>
      </div>
      <dl class="detail-data">
        <div>
          <dt>Pokédex nacional</dt>
          <dd>#{String(entry.national_number).padStart(4, "0")}</dd>
        </div>
        <div>
          <dt>Estreia</dt>
          <dd>Geração {entry.generation}</dd>
        </div>
        <div>
          <dt>Altura</dt>
          <dd>{a.height} m</dd>
        </div>
        <div>
          <dt>Peso</dt>
          <dd>{a.weight} kg</dd>
        </div>
        <div>
          <dt>Habilidades</dt>
          <dd>
            {#each a.abilities || [] as ability}<a
                class="chip ability-chip"
                href={"/habilidade/" + ability.name}
                ><EntityIcon
                  kind="ability"
                  name={ability.name}
                  size={20}
                />{ability.name}{ability.hidden ? " · oculta" : ""}</a
              >{/each}
          </dd>
        </div>
        <div>
          <dt>Evolução</dt>
          <dd>
            {#if a.evolves_from}<a
                class="text-link"
                href={"/pokemon/" + a.evolves_from}>{a.evolves_from}</a
              >{/if}{#each a.evolves_to || [] as target}<a
                class="text-link"
                href={"/pokemon/" + target}>{target}</a
              >{/each}{#if !a.evolves_from && !a.evolves_to?.length}Sem evolução
              registrada{/if}
          </dd>
        </div>
      </dl>
      {#if a.evolution_steps?.length}<section class="content-panel"><h3>Condições de evolução registradas</h3>{#each a.evolution_steps as step}<p><a class="text-link" href={'/pokemon/'+step.to}>{step.to}</a></p><ul>{#each step.conditions as condition}<li>{condition}</li>{/each}</ul>{/each}<p class="help">Alternativas registradas em diferentes versões. As condições não comprovam disponibilidade no jogo selecionado.</p></section>{/if}
      <div class="actions">
        <a
          class="button"
          href={"/builder?pokemon=" + encodeURIComponent(entry.name)+'&context_id='+(data.context_id || 'gen9ou')}
          ><Plus size={16} /> Criar build</a
        ><a
          class="button secondary"
          href={"/builds?q=" + encodeURIComponent(entry.name)+'&context_id='+(data.context_id || 'gen9ou')}
          >Ver builds por formato</a
        >
      </div>
    </div>
  </div>
  <section style="margin:40px 0">
    <div class="section-heading">
      <div>
        <h2>Builds de referência</h2>
        <form><label>Formato das referências<select name="context_id" value={data.context_id || 'gen9ou'} onchange={event=>event.currentTarget.form.requestSubmit()}>{#each data.contexts || [] as context}<option value={context.id}>{context.label}</option>{/each}</select></label></form>
      </div>
    </div>
    <BuildList builds={data.builds?.data || []} />
  </section>
{:else}<div class="content-panel">
    <div class="entry-heading">
      <EntityIcon {entry} size={64} decorative={false} />
      <div>
        <h2>{entry.name}</h2>
        {#if entry.kind === "move"}<div class="move-classification">
            <TypeBadge type={a.type} /><CategoryBadge category={a.category} />
          </div>{/if}
      </div>
    </div>
    <h3>Propriedades</h3>
    <p>{a.effect || "Descrição indisponível na fonte."}</p>
    <dl class="detail-data">
      {#each Object.entries(a).filter(([k, v]) => k !== "effect" && !["type", "category"].includes(k) && v !== null && typeof v !== "object") as [key, value]}<div
        >
          <dt>
            {{
              power: "Poder",
              accuracy: "Precisão",
              pp: "PP",
              priority: "Prioridade",
              category: "Categoria",
              type: "Tipo",
              cost: "Preço de referência",
              showdown: "Nome no simulador",
            }[key] || key}
          </dt>
          <dd>{String(value)}</dd>
        </div>{/each}
    </dl>
  </div>{/if}
<p class="help">
  Fonte: <a
    class="text-link"
    href="https://github.com/PokeAPI/pokeapi"
    rel="noreferrer">PokéAPI</a
  >
  · revisão {entry.revision?.slice(0, 12)}
</p>
