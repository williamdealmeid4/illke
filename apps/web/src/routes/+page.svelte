<script>
  import {
    Search,
    ArrowUpRight,
    ArrowRight,
    Plus,
    Swords,
    Shield,
    ChevronRight,
    MessageSquare,
  } from "@lucide/svelte";
  let { data } = $props();
</script>

<svelte:head
  ><title>illke — Seu próximo time começa aqui</title><meta
    name="description"
    content="Explore Pokémon, compare builds por formato e monte sua próxima equipe com a comunidade illke."
  /></svelte:head
>
<section class="arena-intro">
  <div class="intro-copy">
    <div class="season-tag"><Swords size={15} /> Laboratório de batalha</div>
    <h1>Conheça seu time.<br />Mude o jogo.</h1>
    <p>
      Dos primeiros parceiros às escolhas competitivas.<br
        class="desktop-only"
      /> Explore Pokémon, entenda suas builds e encontre seu jeito de jogar.
    </p>
    <form class="global-search" action="/pokedex">
      <Search size={20} /><label class="sr-only" for="search"
        >Buscar Pokémon</label
      ><input
        id="search"
        name="q"
        placeholder="Qual Pokémon vai para o seu time?"
      /><button type="submit" aria-label="Pesquisar"
        ><ArrowRight size={20} /></button
      >
    </form>
    <div class="search-suggestions">
      <span>Experimente</span><a href="/pokemon/garchomp">Garchomp</a><a
        href="/pokemon/dragapult">Dragapult</a
      ><a href="/pokemon/blastoise">Blastoise</a>
    </div>
  </div>
  <div class="featured-match">
    <div class="match-title">
      <span class="status-dot"></span> Duas funções. Muitas possibilidades.
    </div>
    <div class="match-pokemon">
      <a href="/pokemon/garchomp" class="match-mon ground"
        ><span class="dex-number">#0445</span><img
          src="/api/v1/sprite/Garchomp"
          alt="Garchomp"
          width="220"
          height="220"
        /><strong>Garchomp</strong><span>Pressão ofensiva</span>
        <div class="types">
          <span class="type" data-type="dragon">Dragão</span><span
            class="type"
            data-type="ground">Terra</span
          >
        </div></a
      ><span class="versus">×</span><a
        href="/pokemon/corviknight"
        class="match-mon steel"
        ><span class="dex-number">#0823</span><img
          src="/api/v1/sprite/Corviknight"
          alt="Corviknight"
          width="220"
          height="220"
        /><strong>Corviknight</strong><span>Defesa e suporte</span>
        <div class="types">
          <span class="type" data-type="flying">Voador</span><span
            class="type"
            data-type="steel">Aço</span
          >
        </div></a
      >
    </div>
    <a class="match-footer" href="/builds?context_id=gen9ou"
      >Explore as builds de Scarlet / Violet <ArrowUpRight size={17} /></a
    >
  </div>
</section>
<div class="catalog-ticker">
  <span>Seu campo de pesquisa</span><a href="/pokedex"
    ><strong
      >{data.summary?.counts?.pokemon?.toLocaleString("pt-BR") || "—"}</strong
    > Pokémon e formas</a
  ><a href="/builds"
    ><strong>{data.summary?.builds?.toLocaleString("pt-BR") || "—"}</strong> builds
    de referência</a
  ><a href="/itens"
    ><strong
      >{data.summary?.counts?.item?.toLocaleString("pt-BR") || "—"}</strong
    > itens</a
  ><a href="/cobertura" class="ticker-source"
    >Ver cobertura <ChevronRight size={14} /></a
  >
</div>
<section class="home-catalog">
  <div class="section-heading">
    <div>
      <h2>Peças para a sua estratégia</h2>
      <p>Conheça o Pokémon antes de escolher a build.</p>
    </div>
    <a href="/pokedex" class="text-link"
      >Abrir Pokédex <ArrowRight size={16} /></a
    >
  </div>
  {#if data.summary?.pokemon?.length}<div class="pokemon-grid">
      {#each data.summary.pokemon as pokemon}<a
          class="pokemon-card"
          href={"/pokemon/" + pokemon.slug}
          ><div class="pokemon-card-top">
            <span>#{String(pokemon.national_number).padStart(4, "0")}</span
            ><ArrowUpRight size={15} />
          </div>
          <div class="pokemon-image">
            {#if pokemon.image}<img
                src={pokemon.image.url}
                alt={pokemon.name}
                width="150"
                height="150"
                loading="lazy"
              />{:else}<span class="muted">Sem sprite</span>{/if}
          </div>
          <h3>{pokemon.name}</h3>
          <div class="types">
            {#each pokemon.attributes.types as type}<span
                class="type"
                data-type={type}>{type}</span
              >{/each}
          </div></a
        >{/each}
    </div>{:else}<div class="empty-panel">
      <h3>O catálogo ainda não está disponível</h3>
      <p>{data.error || "A importação está em preparação."}</p>
      <a href="/cobertura">Consultar cobertura</a>
    </div>{/if}
</section>
<section class="workbench-promo">
  <div class="promo-copy">
    <span class="section-kicker"><Swords size={20} /></span>
    <h2>Seis escolhas.<br />Uma estratégia sua.</h2>
    <p>
      Escolha os integrantes, ajuste cada build e veja onde a equipe ganha força
      — ou deixa uma brecha.
    </p>
    <a href="/builder" class="button"><Plus size={17} /> Montar minha equipe</a>
  </div>
  <div class="team-preview" aria-label="Exemplo de composição de equipe">
    <div class="preview-header">
      <span>Na bancada</span><span>Você decide cada slot</span>
    </div>
    <div class="preview-slots">
      {#each ["Blastoise", "Torkoal", "Torterra"] as name}<div>
          <img
            src={"/api/v1/sprite/" + name}
            alt={name}
            width="110"
            height="110"
            loading="lazy"
          /><span>{name}</span>
        </div>{/each}<a href="/builder" aria-label="Adicionar Pokémon à equipe"
        ><Plus size={27} /><span>Sua escolha</span></a
      >
    </div>
    <div class="preview-note">
      <Shield size={16} /><span
        >Resistência, cobertura e legalidade no mesmo lugar.</span
      >
    </div>
  </div>
</section>
<section class="community-promo">
  <div>
    <MessageSquare size={24} />
    <h2>Estratégia também se constrói em conversa.</h2>
    <p>
      Compartilhe uma equipe, tire dúvidas e descubra como outros treinadores
      jogam.
    </p>
  </div>
  <a href="/comunidade" class="button secondary"
    >Entrar na comunidade <ArrowRight size={16} /></a
  >
</section>
