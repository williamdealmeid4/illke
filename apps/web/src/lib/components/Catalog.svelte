<script>
  import { Search, ArrowUpRight, SlidersHorizontal } from "@lucide/svelte";
  import TypeBadge from "./TypeBadge.svelte";
  import EntityIcon from "./EntityIcon.svelte";
  import CategoryBadge from "./CategoryBadge.svelte";
  import Pagination from "./Pagination.svelte";
  import { page } from "$app/state";
  import { withGame } from "$lib/games.js";
  let { data } = $props();
  const links = {
    pokemon: "/pokemon/",
    item: "/item/",
    move: "/golpe/",
    ability: "/habilidade/",
  };
  const types = [
    "normal",
    "fire",
    "water",
    "grass",
    "electric",
    "ice",
    "fighting",
    "poison",
    "ground",
    "flying",
    "psychic",
    "bug",
    "rock",
    "ghost",
    "dragon",
    "dark",
    "steel",
    "fairy",
  ];
</script>

<svelte:head><title>{data.title} — illke</title></svelte:head>
<div class="page-header">
  <div class="breadcrumbs"><a href="/">illke</a><span>/</span>{data.title}</div>
  <h1>{data.title}</h1>
  <p>
    {data.kind === "pokemon"
      ? "Espécies e formas, com filtros por nome, tipo e geração."
      : "Propriedades e efeitos dos registros do catálogo."}
  </p>
</div>
{#if page.data.selectedGame}<div class="catalog-game-note"><strong>{page.data.selectedGame.name}</strong><span>Abra um Pokémon ou item para ver as pistas desta versão. O catálogo abaixo reúne todas as gerações.</span><a class="text-link" href="/jogos">Trocar jogo</a></div>{/if}
<form class="toolbar">
  {#if page.data.selectedGame}<input type="hidden" name="game" value={page.data.selectedGame.id}/>{/if}
  <label class="sr-only" for="q">Pesquisar</label><input
    id="q"
    name="q"
    value={data.query.q || ""}
    placeholder={data.kind === "pokemon"
      ? "Nome, forma ou número da Pokédex"
      : "Pesquisar por nome"}
  />{#if data.kind === "pokemon"}<label class="sr-only" for="generation"
      >Geração de estreia</label
    ><select
      id="generation"
      name="generation"
      onchange={(event) => event.currentTarget.form.requestSubmit()}
      value={data.query.generation || ""}
      ><option value="">Todas as gerações</option
      >{#each Array.from({ length: 9 }, (_, i) => i + 1) as gen}<option
          value={String(gen)}>Geração {gen}</option
        >{/each}</select
    ><label class="sr-only" for="type">Tipo</label><select
      id="type"
      name="type"
      onchange={(event) => event.currentTarget.form.requestSubmit()}
      value={data.query.type || ""}
      ><option value="">Todos os tipos</option>{#each types as type}<option
          value={type}>{type}</option
        >{/each}</select
    >{/if}<button class="button" type="submit"
    ><Search size={16} /> Buscar</button
  >
</form>
{#if data.error}<div class="notice error" role="alert">
    {data.error}
  </div>{:else if !data.catalog?.data?.length}<div class="empty-panel">
    <h3>Nenhum resultado</h3>
    <p>Tente outro nome ou remova algum filtro.</p>
  </div>{:else}
  <p class="help">
    {data.catalog.total.toLocaleString("pt-BR")} registros · {data.kind ===
    "pokemon"
      ? "A geração indica a estreia, não a disponibilidade em um jogo."
      : "Os detalhes descrevem os dados disponíveis na fonte."}
  </p>
  {#if data.kind === "pokemon"}<div class="pokemon-grid">
      {#each data.catalog.data as p}<a
          class="pokemon-card"
          href={withGame(links[data.kind] + p.slug,page.data.selectedGame?.id)}
          ><div class="pokemon-card-top">
            <span>#{String(p.national_number).padStart(4, "0")}</span
            ><ArrowUpRight size={15} />
          </div>
          <div class="pokemon-image">
            <EntityIcon entry={p} size={120} />
          </div>
          <h3>{p.name}</h3>
          <div class="types">
            {#each p.attributes.types || [] as type}<TypeBadge {type} />{/each}
          </div></a
        >{/each}
    </div>
  {:else}<div class="table-wrap">
      <table class="table">
        <thead
          ><tr
            ><th>Nome</th><th
              >{data.kind === "move" ? "Tipo / categoria" : "Efeito"}</th
            >{#if data.kind === "move"}<th>Poder</th><th>Precisão</th><th>PP</th
              >{/if}</tr
          ></thead
        ><tbody
          >{#each data.catalog.data as p}<tr
              ><td
                ><a href={withGame(links[data.kind] + p.slug,page.data.selectedGame?.id)}
                  ><span class="catalog-name"
                    ><EntityIcon entry={p} /><span>{p.name}</span></span
                  ></a
                ></td
              ><td>
                {#if data.kind === "move"}<span class="move-classification"
                    ><TypeBadge type={p.attributes.type} /><CategoryBadge
                      category={p.attributes.category}
                    /></span
                  >{:else}{p.attributes.effect ||
                    "Sem descrição na fonte."}{/if}</td
              >{#if data.kind === "move"}<td>{p.attributes.power ?? "—"}</td><td
                  >{p.attributes.accuracy
                    ? p.attributes.accuracy + "%"
                    : "—"}</td
                ><td>{p.attributes.pp}</td>{/if}</tr
            >{/each}</tbody
        >
      </table>
    </div>{/if}<Pagination pagination={data.catalog} />{/if}
