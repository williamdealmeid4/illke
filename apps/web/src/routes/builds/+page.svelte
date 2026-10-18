<script>
  import BuildList from "$lib/components/BuildList.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  let { data } = $props();
</script>

<svelte:head><title>Builds por formato — illke</title></svelte:head>
<div class="page-header split">
  <div>
    <div class="breadcrumbs"><a href="/">illke</a><span>/</span>Builds</div>
    <h1>Builds</h1>
    <p>Sets de referência por Pokémon e formato.</p>
  </div>
  <a class="button" href="/builder">Criar build</a>
</div>
<form class="toolbar">
  <label class="sr-only" for="build-q">Pokémon ou build</label><input
    id="build-q"
    name="q"
    value={data.query.q || ""}
    placeholder="Pokémon ou nome da build"
  /><label class="sr-only" for="context">Formato</label><select
    id="context"
    name="context_id"
    value={data.query.context_id || ""}
    ><option value="">Todos os formatos</option
    >{#each data.contexts as c}<option value={c.id}>{c.label}</option
      >{/each}</select
  ><label class="sr-only" for="legality">Validação</label><select id="legality" name="legality" value={data.query.legality || 'legal'}><option value="legal">Referências validadas</option><option value="illegal">Aguardando revisão</option><option value="all">Todas as referências</option></select><button class="button secondary">Filtrar</button>
</form>
<p class="help">
  Biblioteca de referência em ordem alfabética. Votos indicam aprovação da
  comunidade. O desempenho depende da equipe e do benchmark.
</p>
{#if data.error}<div class="notice error">{data.error}</div>{/if}<BuildList
  builds={data.builds?.data || []}
/><Pagination pagination={data.builds} />
