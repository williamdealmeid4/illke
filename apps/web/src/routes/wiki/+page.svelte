<script>
 import tutorial from '../../../../../docs/TUTORIAL.md?raw';
 const sections=tutorial.split('\n## ').slice(1).map((s,i)=>({id:'guia-'+i,title:s.split('\n')[0],paragraphs:s.slice(s.indexOf('\n')).trim().split(/\n\s*\n/)}));
</script>
<svelte:head><title>Como usar o illke — Tutorial completo</title></svelte:head>
<div class="page-header">
  <h1>Como usar o illke</h1>
  <p>Da primeira pesquisa à sua equipe: consulte, compare e guarde suas escolhas.</p>
</div>
<div class="tutorial-layout"><nav aria-label="Sumário do tutorial">{#each sections as section}<a href={'#'+section.id} class="text-link">{section.title}</a>{/each}<a href="/tutorial.txt" download class="text-link">Baixar tutorial</a></nav><article>{#each sections as section}<section><h2 id={section.id}>{section.title}</h2>{#each section.paragraphs as paragraph}<p>{paragraph.replaceAll('`','')}</p>{/each}</section>{/each}</article></div>
<details><summary>Referência rápida de estratégia</summary>
<div class="prose">
  <h2>Comece pelo formato</h2>
  <p>
    Uma build depende das regras. Escolha a geração e o formato antes de
    selecionar golpes, itens e treinamento. A mesma espécie pode ter atributos,
    habilidades e opções diferentes entre gerações.
  </p>
  <h2>Dê uma função a cada integrante</h2>
  <p>
    Atacantes pressionam a equipe adversária. Pokémon defensivos absorvem golpes
    e recuperam recursos. Suporte pode controlar velocidade, remover obstáculos
    ou criar oportunidades. Uma equipe precisa de respostas aos adversários que
    pretende enfrentar.
  </p>
  <h2>EVs, IVs e nature</h2>
  <p>
    Nos formatos modernos convencionais, cada atributo recebe até 252 EVs, com
    510 no total. A nature pode aumentar um atributo e reduzir outro. IVs e
    nível também entram no cálculo. As gerações antigas e jogos com sistemas
    próprios exigem regras diferentes.
  </p>
  <h2>Legalidade e desempenho</h2>
  <p>
    Um conjunto legal segue as regras do formato. Isso não garante uma boa
    estratégia. Analise cobertura, resistência, velocidade e parceiros. Depois
    compare o desempenho em um cenário definido.
  </p>
  <h2>Como ler uma simulação</h2>
  <p>
    A porcentagem representa vitórias contra os adversários daquele benchmark
    usando a política automatizada indicada. Confira amostra, intervalo de
    confiança e empates. Uma diferença pequena pode ser ruído; resultados de
    benchmarks diferentes não devem ser comparados diretamente.
  </p>
  <div class="actions">
    <a class="button" href="/builder">Abrir builder</a><a
      class="button secondary"
      href="/comunidade">Discutir estratégia</a
    >
  </div>
</div>
</details>
