<script>
  import { Search, ArrowUpRight, ArrowRight, RotateCcw, BookOpen } from '@lucide/svelte';
  import { page } from '$app/state';
  import { abilityCategories, abilityMeta } from '$lib/abilities.js';
  import { withGame } from '$lib/games.js';
  import AbilitySymbol from '$lib/components/AbilitySymbol.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  let { data } = $props();
  let activeCategory = $derived(abilityCategories.find((category) => category.id === data.query.category) || abilityCategories[0]);
  function categoryLink(id) {
    const params = new URLSearchParams(page.url.searchParams);
    params.delete('page');
    if (id === 'all') params.delete('category'); else params.set('category', id);
    return '/habilidades' + (params.size ? '?' + params : '');
  }
  let clearLink = $derived(withGame('/habilidades', page.data.selectedGame?.id));
  let filtered = $derived(!!(data.query.q || data.query.generation || data.query.category && data.query.category !== 'all'));
</script>

<svelte:head><title>Habilidades — illke</title><meta name="description" content="Explore habilidades Pokémon por efeito, categoria e geração. Encontre imunidades, vantagens de clima e novas estratégias." /></svelte:head>

<div class="ability-page">
  <div class="breadcrumbs"><a href="/">illke</a><span>/</span>Habilidades</div>
  <header class="ability-heading">
    <div><span class="eyebrow">GUIA DE BATALHA</span><h1>Habilidades.<br /><span>Explore por efeito.</span></h1><p>Uma habilidade pode mudar toda a batalha. Explore seus efeitos e encontre a peça que falta na sua estratégia.</p></div>
    <div class="heading-mark" aria-hidden="true"><AbilitySymbol icon="Fingerprint" size={94} strokeWidth={1} /><span>HABILIDADES</span></div>
  </header>

  <div class="ability-body">
    <aside aria-label="Categorias de habilidades">
      <div class="aside-heading"><h2>Explorar por efeito</h2><span>01 — 08</span></div>
      <nav class="category-nav" aria-label="Filtrar por categoria">
        {#each data.categories as category}
          <a href={categoryLink(category.id)} class:active={activeCategory.id === category.id} aria-current={activeCategory.id === category.id ? 'page' : undefined}>
            <AbilitySymbol icon={category.icon} size={19} /><span>{category.name}</span><small>{category.count ?? '—'}</small>
          </a>
        {/each}
      </nav>
      <div class="editorial-note"><BookOpen size={17} /><p>As categorias agrupam o efeito principal de cada habilidade. A geração indica sua estreia.</p></div>
    </aside>

    <section class="ability-results" aria-label="Catálogo de habilidades">
      <form class="ability-search" action="/habilidades" method="GET">
        {#if page.data.selectedGame}<input type="hidden" name="game" value={page.data.selectedGame.id} />{/if}
        {#if data.query.category}<input type="hidden" name="category" value={data.query.category} />{/if}
        <div class="search-field"><Search size={18} aria-hidden="true" /><label class="sr-only" for="ability-q">Buscar habilidade pelo nome</label><input id="ability-q" name="q" value={data.query.q || ''} placeholder="Qual habilidade você procura?" /></div>
        <label class="sr-only" for="ability-generation">Geração de estreia</label><select id="ability-generation" name="generation" value={data.query.generation || ''} onchange={(event) => event.currentTarget.form.requestSubmit()}><option value="">Todas as gerações</option>{#each Array.from({ length: 9 }, (_, i) => i + 1) as generation}<option value={generation}>Geração {generation}</option>{/each}</select>
        <button type="submit">Buscar <ArrowRight size={16} /></button>
      </form>

      <div class="results-heading"><div><h2>{activeCategory.id === 'all' ? 'Todas as habilidades' : activeCategory.name}</h2><p>{activeCategory.description}</p></div>{#if !data.error}<span class="result-count">{data.catalog?.total || 0} <span>habilidades</span></span>{/if}</div>
      {#if filtered}<div class="filter-summary"><span>Filtros ativos{data.query.q ? ` · “${data.query.q}”` : ''}{data.query.generation ? ` · Geração ${data.query.generation}` : ''}</span><a href={clearLink}><RotateCcw size={13} /> Limpar filtros</a></div>{/if}

      {#if data.error}
        <div class="ability-empty" role="alert"><AbilitySymbol icon="CloudSun" size={34} /><h3>O catálogo está indisponível</h3><p>{data.error}</p><a class="retry-link" href={page.url.pathname + page.url.search} data-sveltekit-reload>Tentar novamente <ArrowRight size={15} /></a></div>
      {:else if !data.catalog?.data.length}
        <div class="ability-empty"><Search size={34} /><h3>Nenhuma habilidade encontrada</h3><p>Tente outro nome, categoria ou geração para continuar explorando.</p><a class="retry-link" href={clearLink}>Limpar filtros <ArrowRight size={15} /></a></div>
      {:else}
        <div class="ability-grid">
          {#each data.catalog.data as ability}
            {@const meta = abilityMeta(ability)}
            {@const category = abilityCategories.find((item) => item.id === meta.category)}
            <a class="ability-card" href={withGame('/habilidade/' + ability.slug, page.data.selectedGame?.id)}>
              <div class="card-top"><span class="ability-symbol" data-category={meta.category}><AbilitySymbol entry={ability} size={28} /></span><span class="generation">GER. {ability.generation || '—'}</span><ArrowUpRight class="card-arrow" size={17} /></div>
              <span class="ability-category">{category?.name}</span><h3>{ability.name}</h3>
              <p>{ability.attributes?.effect || 'Consulte os detalhes para conhecer esta habilidade.'}</p>
              <span class="card-bottom">Ver habilidade <ArrowRight size={14} /></span>
            </a>
          {/each}
        </div>
        <Pagination pagination={data.catalog} />
      {/if}
      <p class="catalog-footnote">Habilidades de todas as gerações. A disponibilidade varia entre jogos.</p>
    </section>
  </div>
</div>

<style>
  .ability-page{padding:18px 0 20px}
  .breadcrumbs{font-size:12px; margin-bottom:32px}
  .ability-heading{display:flex; justify-content:space-between; align-items:center; gap:36px; padding-bottom:44px; border-bottom:1px solid var(--border); margin-bottom:35px}
  .eyebrow{display:block; color:var(--muted); font-size:10px; letter-spacing:2.2px; font-weight:700; margin-bottom:18px}
  .ability-heading h1{font-size:clamp(34px,4vw,54px); line-height:1.09; letter-spacing:-2px; margin-bottom:20px}
  .ability-heading h1 span{color:var(--muted)}
  .ability-heading p{max-width:510px; font-size:14px; margin:0; line-height:1.7}
  .heading-mark{width:166px; height:166px; flex-shrink:0; border:1px solid var(--border); border-radius:50%; display:flex; flex-direction:column; justify-content:center; align-items:center; color:var(--accent)}
  .heading-mark span{font-size:8px; letter-spacing:2px; margin-top:8px}
  .ability-body{display:grid; grid-template-columns:236px minmax(0,1fr); gap:34px}
  .aside-heading{display:flex; align-items:center; justify-content:space-between; margin-bottom:18px}
  .aside-heading h2{font-size:13px; letter-spacing:0; margin:0}
  .aside-heading>span{font-size:9px; color:var(--muted); letter-spacing:1px}
  .category-nav{display:flex; flex-direction:column; gap:5px}
  .category-nav a{display:flex; align-items:center; gap:11px; min-height:48px; padding:12px; border:1px solid transparent; border-radius:7px; color:var(--muted); font-size:12px; transition:background .15s,color .15s}
  .category-nav a>span{flex:1}
  .category-nav small{font-size:10px; opacity:.8; font-variant-numeric:tabular-nums}
  .category-nav a:hover{background:var(--surface2); color:var(--text)}
  .category-nav a.active{color:var(--text); background:var(--surface); border-color:var(--border)}
  .category-nav a.active :global(svg){color:var(--accent)}
  .editorial-note{display:flex; gap:11px; margin-top:28px; padding:20px 10px; border-top:1px solid var(--border); color:var(--muted)}
  .editorial-note p{font-size:11px; line-height:1.7; margin:0}
  .ability-search{display:flex; gap:9px; margin-bottom:28px}
  .search-field{display:flex; align-items:center; gap:10px; flex:1; min-width:120px; border:1px solid var(--border); background:var(--surface); border-radius:6px; padding-left:13px; color:var(--muted)}
  .search-field input{width:100%; min-width:0; background:transparent; border:none; padding:13px 10px 13px 0; font-size:12px}
  .search-field:focus-within{outline:2px solid var(--accent); outline-offset:2px}
  .search-field input:focus-visible{outline:none}
  .ability-search select{max-width:165px; font-size:11px; background:var(--surface); padding:11px 10px}
  .ability-search button{display:flex; align-items:center; justify-content:center; gap:14px; border:1px solid var(--accent); background:var(--accent); color:var(--bg); padding:11px 15px; font-size:12px; font-weight:700}
  .results-heading{display:flex; align-items:center; justify-content:space-between; gap:15px; margin-bottom:22px}
  .results-heading h2{font-size:22px; margin-bottom:7px}
  .results-heading p{font-size:12px; margin:0}
  .result-count{font-size:13px; color:var(--text); white-space:nowrap}
  .result-count>span{color:var(--muted); font-size:11px}
  .filter-summary{display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; font-size:11px; margin:-3px 0 19px; color:var(--muted)}
  .filter-summary a{display:flex; gap:6px; align-items:center; color:var(--text)}
  .ability-grid{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:13px}
  .ability-card{display:flex; flex-direction:column; border:1px solid var(--border); background:var(--surface); border-radius:9px; padding:20px; min-width:0; transition:transform .15s,border-color .15s}
  .ability-card:hover{border-color:var(--accent); transform:translateY(-3px)}
  .card-top{display:flex; align-items:center; gap:8px; margin-bottom:22px}
  .ability-symbol{display:grid; place-items:center; width:48px; height:48px; background:var(--surface2); border:1px solid var(--border); border-radius:12px; color:var(--accent)}
  .ability-symbol[data-category="weather"]{color:var(--blue)}
  .ability-symbol[data-category="recovery"]{color:var(--success)}
  .ability-symbol[data-category="defense"]{color:var(--blue)}
  .generation{margin-left:auto; font-size:9px; letter-spacing:1px; color:var(--muted)}
  .card-top :global(.card-arrow){color:var(--muted)}
  .ability-category{color:var(--muted); font-size:9px; letter-spacing:.7px; text-transform:uppercase; margin-bottom:7px}
  .ability-card h3{font-size:18px; letter-spacing:-.3px; margin:0 0 10px}
  .ability-card>p{display:-webkit-box; -webkit-line-clamp:3; line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; font-size:13px; line-height:1.7; margin:0 0 24px; min-height:66px}
  .card-bottom{display:flex; align-items:center; justify-content:space-between; margin-top:auto; border-top:1px solid var(--border); padding-top:14px; font-size:10px; color:var(--muted)}
  .ability-card:hover .card-bottom{color:var(--accent)}
  .ability-empty{display:flex; align-items:center; flex-direction:column; text-align:center; padding:58px 24px; background:var(--surface); border:1px solid var(--border); border-radius:9px; color:var(--muted)}
  .ability-empty h3{color:var(--text); font-size:20px; margin:18px 0 8px}
  .ability-empty p{font-size:13px; max-width:390px}
  .retry-link{display:flex; align-items:center; gap:12px; font-size:12px; color:var(--accent)}
  .catalog-footnote{font-size:10px; margin:25px 0 0; color:var(--muted)}

  @media(min-width:1400px){.ability-body{grid-template-columns:250px minmax(0,1fr); gap:45px}
  }

  @media(max-width:1100px){.ability-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .ability-body{grid-template-columns:205px minmax(0,1fr); gap:22px}
  .ability-search{flex-wrap:wrap}
  .search-field{flex-basis:100%}
  .ability-search select{flex:1; max-width:none}
  .ability-search button{min-width:105px}
  }

  @media(max-width:760px){.ability-heading{padding-bottom:28px; margin-bottom:25px; gap:20px}
  .heading-mark{width:110px; height:110px}
  .heading-mark :global(svg){width:60px; height:60px}
  .heading-mark span{font-size:6px}
  .ability-heading h1{font-size:34px; letter-spacing:-1.2px}
  .ability-heading p{font-size:12px}
  .ability-body{grid-template-columns:1fr; gap:22px}
  .category-nav{display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:4px}
  .category-nav a{font-size:11px; min-height:42px; padding:10px 8px}
  .aside-heading{margin-bottom:10px}
  .editorial-note{display:none}
  .ability-search{margin-bottom:24px}
  .ability-card{padding:16px}
  .ability-grid{gap:10px}
  .results-heading h2{font-size:20px}
  .results-heading p{font-size:11px}
  .result-count{font-size:12px}
  .result-count>span{display:block}
  .card-top{margin-bottom:18px}
  .ability-symbol{width:42px; height:42px; border-radius:10px}
  .generation{font-size:8px; letter-spacing:.5px}
  .ability-category{font-size:8px}
  .ability-card h3{font-size:16px}
  .card-top :global(.card-arrow){display:none}
  }

  @media(max-width:400px){.heading-mark{display:none}
  .ability-grid{grid-template-columns:1fr}
  .ability-card>p{min-height:0}
  .category-nav a{gap:6px}
  }

  @media(prefers-reduced-motion:reduce){.ability-card,.category-nav a{transition:none}
  .ability-card:hover{transform:none}
  }

</style>
