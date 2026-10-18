<script>
  let { data } = $props();
  const labels = {
    pokemon: "Pokémon e formas",
    items: "Itens",
    moves: "Golpes",
    abilities: "Habilidades",
    sprites: "Pokémon com sprite",
    builds: "Builds de referência",
    legal_builds: 'Referências validadas',
  };
</script>

<svelte:head><title>Cobertura dos dados — illke</title></svelte:head>
<div class="page-header">
  <h1>Cobertura dos dados</h1>
  <p>Dados importados, fontes e limites da cobertura atual.</p>
</div>
{#if data.error}<p class="notice error">
    {data.error}
  </p>{/if}{#if data.report}<div class="coverage-grid">
    {#each Object.entries(labels) as [key, label]}<div class="content-panel">
        <strong
          >{data.report.coverage?.[key]?.toLocaleString("pt-BR") || "—"}</strong
        ><span>{label}</span>
      </div>{/each}
  </div>
  <div class="prose">
    <p>
      Última importação: {data.report.imported_at
        ? new Date(data.report.imported_at).toLocaleString("pt-BR")
        : "ainda não executada"}. Dados: {data.report.revision?.slice(0, 12) ||
        "—"}. Sprites: {data.report.sprite_revision?.slice(0, 12) || "—"}.
    </p>
    <h2>Regras e jogos</h2>
    <p>
      O motor calcula e valida conjuntos de singles OU das gerações I a IX.
      Esses formatos não comprovam obtenção em um cartucho. Catálogo por versão,
      progressão de campanha e regras próprias de Legends e Let’s Go ainda
      exigem integração e auditoria.
    </p>
    <h2>Imagens</h2>
    <p>
      Os sprites genéricos e as artes vêm de um snapshot do repositório
      PokéAPI/sprites. Uma imagem genérica não conta como associação exata ao
      jogo. Registros sem arquivo confirmado continuam sem imagem.
    </p>
    <h2>Builds e avaliações</h2>
    <p>
      Sets de referência mantêm fonte e alternativas. Uma build sem avaliação
      não recebe porcentagem de sucesso. As simulações usam adversários
      sintéticos e uma política automatizada limitada; não representam a chance
      de vencer jogadores reais.
    </p>
    <h2>Importação de sets por geração</h2>
    <ul>
      {#each data.report.imports || [] as entry}<li>
          {entry.format}: {['imported','retained'].includes(entry.status)
            ? entry.count + " builds " + (entry.status==='retained'?'preservadas da última importação válida':'importadas')
            : "indisponível"}
        </li>{/each}
    </ul>
    <h2>Jogos identificados na fonte</h2>
    <p>
      {data.report.games?.map((g) => g.identifier).join(", ") ||
        "Sem importação."}
    </p>
  </div>{/if}
