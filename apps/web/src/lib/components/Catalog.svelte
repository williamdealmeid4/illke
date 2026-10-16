<script>
  import { Search, ArrowUpRight, SlidersHorizontal } from "@lucide/svelte";
  import Pagination from "./Pagination.svelte";
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
      ? "Cada Pokémon tem um lugar. Encontre o seu próximo parceiro."
      : "Propriedades, efeitos e referências para suas escolhas."}
  </p>
</div>
<form class="toolbar">
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
      value={data.query.generation || ""}
      ><option value="">Todas as gerações</option
      >{#each Array.from({ length: 9 }, (_, i) => i + 1) as gen}<option
          value={gen}>Geração {gen}</option
        >{/each}</select
    ><label class="sr-only" for="type">Tipo</label><select
      id="type"
      name="type"
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
          href={links[data.kind] + p.slug}
          ><div class="pokemon-card-top">
            <span>#{String(p.national_number).padStart(4, "0")}</span
            ><ArrowUpRight size={15} />
          </div>
          <div class="pokemon-image">
            {#if p.image}<img
                src={p.image.url}
                alt={p.name}
                loading="lazy"
                width="120"
                height="120"
              />{:else}<span class="help">Sprite indisponível</span>{/if}
          </div>
          <h3>{p.name}</h3>
          <div class="types">
            {#each p.attributes.types || [] as type}<span
                class="type"
                data-type={type}>{type}</span
              >{/each}
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
                ><a href={links[data.kind] + p.slug}
                  >{#if p.image}<img
                      src={p.image.url}
                      alt=""
                      width="40"
                      height="40"
                      loading="lazy"
                    />{/if}{p.name}</a
                ></td
              ><td
                >{#if data.kind === "move"}<span
                    class="type"
                    data-type={p.attributes.type}>{p.attributes.type}</span
                  > <span class="help">{p.attributes.category}</span>{:else}{p
                    .attributes.effect || "Sem descrição na fonte."}{/if}</td
              >{#if data.kind === "move"}<td>{p.attributes.power ?? "—"}</td><td
                  >{p.attributes.accuracy
                    ? p.attributes.accuracy + "%"
                    : "—"}</td
                ><td>{p.attributes.pp}</td>{/if}</tr
            >{/each}</tbody
        >
      </table>
    </div>{/if}<Pagination pagination={data.catalog} />{/if}
