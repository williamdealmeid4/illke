<script>
 import { Search, ArrowUpRight, ArrowRight, SlidersHorizontal, BookOpen, ShieldCheck, Database, Layers } from '@lucide/svelte';
 let { data }=$props();
</script>
<svelte:head><title>illke — Pokémon, builds e estratégia</title><meta name="description" content="Consulte Pokémon, itens e builds por contexto. Monte sua build e confira atributos, legalidade e evidências."/></svelte:head>
<section class="home-top">
 <div class="eyebrow"><span class="live-dot"></span> CATÁLOGO / ESTRATÉGIA / COMUNIDADE</div>
 <div class="home-heading"><h1>Encontre seu<br/><span>próximo movimento.</span></h1><p>Pokémon, itens e builds em um só lugar.<br/>Escolha o contexto. Consulte os dados. Monte sua estratégia.</p></div>
 <form class="global-search" action="/pokedex"><Search size={22}/><label class="sr-only" for="search">Buscar Pokémon</label><input id="search" name="q" placeholder="Nome, forma ou número da Pokédex" autocomplete="off"/><button type="submit">Pesquisar <ArrowUpRight size={18}/></button></form>
 <div class="quick-links"><a href="/pokedex">Explorar Pokédex <ArrowRight size={15}/></a><a href="/itens">Consultar itens <ArrowRight size={15}/></a><a href="/builds">Encontrar builds <ArrowRight size={15}/></a></div>
</section>
<section class="section-grid">
 <div class="catalog-section"><div class="section-heading"><div><span class="eyebrow">01 / EXPLORAR</span><h2>Dentro da Pokédex</h2></div><a href="/pokedex" class="text-link">Ver catálogo <ArrowUpRight size={17}/></a></div>
 {#if data.summary?.pokemon?.length}<div class="pokemon-grid">{#each data.summary.pokemon as pokemon}<a class="pokemon-card" href={'/pokemon/'+pokemon.slug}><div class="pokemon-card-top"><span>#{String(pokemon.national_number).padStart(4,'0')}</span><ArrowUpRight size={16}/></div><div class="pokemon-image">{#if pokemon.image}<img src={pokemon.image.url} alt={pokemon.name} width="180" height="180"/>{:else}<span class="image-missing">Imagem indisponível</span>{/if}</div><h3>{pokemon.name}</h3><div class="types">{#each pokemon.attributes?.types||[] as type}<span class="type" data-type={type.toLowerCase()}>{type}</span>{/each}</div></a>{/each}</div>
 {:else}<div class="empty-panel"><Database size={28}/><h3>Preparando o catálogo</h3><p>A importação de dados está sendo conectada à API. Os Pokémon aparecerão aqui quando os registros forem publicados.</p><a href="/cobertura" class="text-link">Acompanhar cobertura <ArrowRight size={16}/></a></div>{/if}
 </div>
 <aside class="strategy-panel"><span class="eyebrow">02 / CONSTRUIR</span><div class="orbit"><Layers size={52}/></div><h2>Uma build.<br/>Um contexto.</h2><p>Nature, golpes, treinamento e mecânicas do jogo. Veja o que funciona junto e o que precisa de ajuste.</p><div class="context-tag">SCARLET / VIOLET <span>Singles OU</span></div><a href="/builder" class="button full">Abrir construtor <ArrowUpRight size={18}/></a><div class="panel-note"><ShieldCheck size={18}/><span>Legalidade e cálculos com regras versionadas.</span></div></aside>
</section>
<section class="editorial-strip"><span class="eyebrow">INFORMAÇÃO COM ORIGEM</span><h2>Conheça os dados.<br/>Entenda os limites.</h2><div><p>Espécies, formas e imagens têm fontes identificadas. Consulte a cobertura por domínio e as lacunas do catálogo.</p><a href="/cobertura">Ver relatório de cobertura <ArrowUpRight size={18}/></a></div></section>
<section class="bottom-links"><a href="/golpes"><span>REFERÊNCIA</span><h3>Golpes e habilidades</h3><p>Propriedades, efeitos e relações.</p><ArrowUpRight size={20}/></a><a href="/wiki"><span>CONHECIMENTO</span><h3>Wiki e guias</h3><p>Conteúdo original, com revisão e fontes.</p><ArrowUpRight size={20}/></a><a href="/comunidade"><span>COMUNIDADE</span><h3>Além da sua equipe</h3><p>Builds publicadas e consulta no Discord.</p><ArrowUpRight size={20}/></a></section>
