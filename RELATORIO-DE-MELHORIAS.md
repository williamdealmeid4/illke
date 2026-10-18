# illke — relatório de diagnóstico e melhorias

**Data:** 18 de outubro de 2026  
**Base:** repositório local em `C:\Users\Willi\illke`, commit `9c0a257`, com as correções locais anteriores de carregamento do manifesto de ícones e o catálogo importado.  
**Escopo:** produto, experiência, confiabilidade, qualidade dos dados, regras competitivas, simulação, API, operação e testes.

## 1. Diagnóstico executivo

O illke já tem um catálogo amplo, um editor utilizável e integração real com o Pokémon Showdown. Não é apenas uma interface estática: importação, validação, exportação, PDF e simulação têm implementação funcional. O problema é a distância entre essa base e a confiança necessária para usá-la como um laboratório de equipes.

As prioridades são corrigir a qualidade da importação, impedir bloqueios indevidos da API, proteger os rascunhos e tornar a avaliação estratégica mais útil e interpretável. Acrescentar novos modos de jogo ou mais telas antes dessas correções aumentaria a superfície de problemas.

Os achados mais importantes:

1. **1.097 das 1.574 builds importadas estão marcadas como ilegais: 69,7%.** Há erros de normalização e mistura entre nome de build e apelido de Pokémon. O número de builds na vitrine superestima o acervo pronto para uso.
2. **A navegação pode consumir o limite destinado a ações.** A auditoria recebeu HTTP 429 ao tentar analisar/importar. Os limitadores numéricos compartilham a chave de contagem.
3. **A simulação está indisponível, com o snapshot atual, nas gerações I, II, V e VIII.** Nas gerações V e VIII, existe um defeito matemático na seleção dos adversários, mesmo havendo 51 sets marcados como legais em cada geração.
4. **Abrir uma nova build por link substitui o rascunho existente.** Uma equipe de seis integrantes foi reduzida a um Garchomp, sem confirmação ou mecanismo de recuperação.
5. **117 nomes/formas oferecidos pelo motor não encontram correspondência no resolvedor de sprites.** Isso é um problema diferente dos nove registros do catálogo sem imagem declarada.
6. **“Analisar build” faz uma revisão básica de coerência, não uma análise estratégica completa.** Cobertura, parceiros, respostas ao metagame e sinergia permanecem sem avaliação efetiva.
7. **Favoritos têm persistência no backend, mas o fluxo está incompleto.** O botão perde o estado ao recarregar, e não há coleção de favoritos para consultar.
8. **O frontend local caiu durante a auditoria.** A falha ocorreu no runtime HTTP do Node; a causa exata não foi isolada.

**Avaliação de maturidade:** protótipo funcional com recursos reais, mas ainda sem confiabilidade suficiente para apresentar todas as partes como prontas para uso contínuo.

## 2. Método e limites da análise

Foram examinados o README, as rotas, os componentes Svelte, os controladores e jobs Laravel, o motor de regras, a política de simulação, o importador, as dependências e os testes. Foram realizados testes no Edge automatizado, em desktop e em viewport móvel de 390 × 844.

Os achados usam estas classificações:

- **Reproduzido:** comportamento observado em execução local.
- **Confirmado no código/dados:** implementação ou lacuna verificável, sem depender de uma opinião sobre o produto.
- **Limitação declarada:** restrição que o próprio projeto já informa.
- **Recomendação:** proposta de evolução, que ainda precisa de decisão de produto e validação com usuários.

Não foram realizados teste de carga de produção, auditoria formal de segurança, avaliação com jogadores humanos ou teste em celulares físicos. O PostgreSQL de produção não foi validado. A integração real com Discord não foi exercitada porque está desabilitada nesta instalação; nenhuma mensagem foi enviada a servidores externos. Os testes existentes dessa integração usam respostas controladas.

A análise considera o estado atual, após o conserto anterior dos ícones. Portanto, não apresenta o erro antigo de importação do manifesto como um defeito ainda aberto. Nesta etapa foram produzidos scripts/evidências de auditoria e este relatório; as melhorias propostas abaixo não foram implementadas.

**Prioridades:** P0 exige correção antes de uma próxima entrega anunciada como confiável; P1 afeta uma jornada central, a qualidade dos resultados ou a operação; P2 melhora clareza, descoberta e eficiência de uso. A prioridade indica impacto no produto, não classificação de vulnerabilidade de segurança.

## 3. O que foi verificado

| Verificação | Resultado | Alcance da evidência |
| --- | --- | --- |
| Testes Node | 15 passaram | Regras selecionadas, dados auxiliares e utilitários do Discord |
| Testes Laravel | 14 passaram; 57 asserções | Fluxos e permissões cobertos pela suíte, com dependências externas simuladas |
| Verificação Svelte | 0 erros; 0 avisos | Resultado obtido após a correção anterior dos ícones |
| Build de produção | Concluído | Empacotamento funciona no estado auditado |
| Saúde Laravel | `/up` em JSON respondeu `up`; resposta HTML retornou HTTP 500 | Log apontou caminho de cache de views inválido; pré-requisitos de runtime incompletos |
| 12 rotas principais | HTTP 200 e conteúdo renderizado | Não significa que todas as operações internas funcionem |
| Navegação, busca e tema | Funcionaram | Testes no Edge |
| Pokédex | 36 cards e 96 imagens de Pokémon/tipos carregadas na página testada | Não equivale a auditar todos os arquivos externos |
| Itens | 36 imagens carregadas na primeira página testada | Cobertura visual amostral |
| Builder | Seleção e inclusão de integrante funcionaram | Persistência e presets têm problemas detalhados abaixo |
| Importar, validar e exportar uma equipe legal | Funcionaram em uma sessão com orçamento de requisições disponível | Outras tentativas foram bloqueadas pelo limitador da API |
| PDF | Geração e botão de download funcionaram na repetição isolada | Arquivo de 251.665 bytes; houve timeout numa tentativa anterior, sem causa isolada |
| Avaliação assíncrona | `queued → running → completed` | Uma equipe de geração IX; 1.000 partidas; cerca de 28,5 segundos na execução medida |
| Resultado dessa avaliação | 630 vitórias; 370 derrotas; 0 empates; 10 adversários; 0 recomendações | Resultado específico desse teste; não mede a qualidade geral da equipe |
| Layout móvel | Sem transbordamento horizontal nas páginas inicial, builder e itens | Verificação em 390 px; não é certificação de acessibilidade |
| Auditoria npm | 17 pacotes sinalizados | 1 crítico, 8 altos, 3 moderados e 5 baixos; exige triagem de exposição |
| Auditoria Composer | Nenhum advisory ou pacote abandonado informado | Resultado da consulta executada nesta análise |

O conjunto de testes passando é um ponto positivo, mas não cobre a importação completa, os bloqueios após navegação, a preservação do rascunho ou o funcionamento do benchmark em todas as gerações.

## 4. Promessa versus entrega

| Proposta | Estado atual | O que falta para considerar concluído |
| --- | --- | --- |
| Catálogo de Pokémon, formas, itens, golpes e habilidades | Entregue com lacunas de conteúdo e integração | Descrições, evolução explicada, correspondência de formas e navegação entre entidades |
| Sprites e artes associados a cada entidade | Parcial | Resolver os nomes do motor no mesmo catálogo e oferecer fallback consistente |
| Builds de referência das gerações I a IX | Dados existem; utilidade comprometida | Corrigir importação e exibir quantidade válida, motivos de erro e cobertura por formato |
| Editor de até seis integrantes | Funciona | Biblioteca de equipes, proteção contra sobrescrita, recuperação e orientação durante edição |
| Análise individual | Funciona como checagem básica | Relações entre escolhas, benchmarks de atributos e diagnóstico estratégico |
| Validação de equipe | Funciona quando a chamada não é bloqueada | Erros nos campos, distinção entre time incompleto, ilegal e pouco competitivo |
| Importação/exportação Showdown | Funciona no caminho testado | Contratos de ida e volta, tratamento de campos não suportados e diagnóstico de perdas |
| PDF local | Funciona no teste isolado | Melhor tolerância a imagem externa indisponível e ficha de equipe completa, caso desejada |
| 1.000 batalhas e alternativas | Funciona em geração IX; cobertura por geração falha | Seleção de adversários corrigida, operação recuperável e avaliação metodológica da política |
| Fórum com moderação | Publicação/resposta e permissões têm implementação/testes | Ferramentas de moderação, tratamento de respostas e jornada de denúncia concluída |
| Bot do Discord | Implementado, mas indisponível nesta instalação | Configuração operacional e verificação real de instalação, autorização e publicação |
| Uso sem cadastro | Entregue | Continuidade entre sessões/dispositivos e recuperação precisam de solução opcional |
| Apoiar montagem de equipes melhores | Parcial | O sistema verifica regras e roda um benchmark limitado; não fecha o ciclo de diagnóstico e melhoria |

Campanha, VGC/doubles, Legends, Let’s Go e obtenção por cartucho são limitações declaradas. Não devem ser anunciados como funcionalidades existentes. Não há evidência, no material analisado, de que o README atual prometa entregá-los nesta versão.

## 5. Qualidade do acervo: a prioridade central

### A01 — A maioria das builds importadas não está pronta para uso — P0

**Classificação:** confirmado nos dados e no código.

| Formato | Builds importadas | Marcadas como legais | Benchmark consegue montar equipes? |
| --- | ---: | ---: | --- |
| Geração I OU | 48 | 0 | Não |
| Geração II OU | 142 | 1 | Não |
| Geração III OU | 251 | 31 | Sim |
| Geração IV OU | 214 | 31 | Sim |
| Geração V OU | 137 | 51 | Não — defeito de seleção |
| Geração VI OU | 232 | 77 | Sim |
| Geração VII OU | 180 | 65 | Sim |
| Geração VIII OU | 157 | 51 | Não — defeito de seleção |
| Geração IX OU | 213 | 70 | Sim |
| **Total** | **1.574** | **477** | **5 de 9 contextos montam o benchmark** |

Exemplos encontrados: sets antigos com treinamento inteiro zerado; Milotic e Gengar sem habilidade; nomes editoriais como “Physically Defensive” enviados como apelidos de Pokémon, excedendo o limite de 18 caracteres do simulador. Não se deve interpretar automaticamente essas rejeições como erro das fontes: o adaptador local participa diretamente delas.

**Impacto:** o usuário escolhe uma referência esperando um ponto de partida confiável e recebe uma configuração que exige reparo. A mesma falha empobrece os adversários e as alternativas usados nas simulações.

**Melhoria:** normalizar dados conforme geração/formato; distinguir campo omitido de configuração intencional; preencher escolhas obrigatórias apenas quando determináveis; preservar alternativas e incertezas; separar nome editorial de apelido. Rejeições precisam manter causas estruturadas. A interface deve separar referências validadas das que aguardam revisão.

**Aceite:** toda build apresentada como pronta passa na mesma validação usada pelo builder; divergências de importação aparecem no relatório de cobertura. Testes devem importar amostras reais de todas as gerações, incluindo dados incompletos.

**Fontes:** `scripts/sync-data.mjs:276–345`; `services/battle-engine/src/domain.js:58`; `apps/api/app/Console/Commands/ImportCatalog.php`; `.runtime/audit-data.json`.

### A02 — Nome da build invalida uma configuração legal — P1

**Classificação:** reproduzido diretamente no motor.

O editor aceita nome de build com até 100 caracteres, mas `toSet()` o envia como apelido ao Showdown. Renomear uma configuração legal para “Minha build competitiva de Venusaur” faz a validação rejeitá-la por ultrapassar 18 caracteres. A documentação da interface não explica essa associação.

**Melhoria:** criar campos independentes `build_name` e `nickname`; o nome editorial não deve alterar a legalidade. O apelido deve respeitar o limite e as regras correspondentes. Aplicar a mesma separação na importação, exportação, PDF e banco.

**Aceite:** renomear a build, sem alterar o Pokémon, não muda o resultado competitivo da validação.

### A03 — O benchmark das gerações V e VIII falha por repetição de índices — P0

**Classificação:** reproduzido e explicado pelo código.

O seletor usa `candidates[(n * 17 + t * 31) % candidates.length]`. Com 51 candidatos, incrementar 17 percorre apenas três posições antes de repetir. Uma equipe exige seis espécies diferentes, então o algoritmo nunca a completa. Ambas as gerações possuem exatamente 51 candidatos marcados como legais neste snapshot.

**Melhoria:** percorrer candidatos sem repetição, com embaralhamento determinístico e validação incremental; informar a razão quando o conjunto disponível realmente não permitir seis integrantes. Idealmente, usar equipes de referência curadas por arquétipo.

**Aceite:** teste específico com 51 candidatos; testes também com tamanhos múltiplos de 17, poucos candidatos e espécies repetidas. Dado um conjunto suficiente e legal, o algoritmo precisa construir uma equipe ou explicar a restrição concreta que impediu a montagem.

**Fonte:** `services/battle-engine/src/simulation.js:104–137`, especialmente linha 115.

### A04 — Cobertura de descrição é muito inferior à cobertura numérica — P1

**Classificação:** confirmado no snapshot.

| Entidade | Total | Sem descrição de efeito | Percentual aproximado |
| --- | ---: | ---: | ---: |
| Itens | 2.223 | 1.269 | 57,1% |
| Golpes | 937 | 93 | 9,9% |
| Habilidades | 374 | 61 | 16,3% |

Parte desses registros pode ser conteúdo especial, histórico ou sem aplicação competitiva. Portanto, não se deve exigir descrição de batalha para todo item de campanha; é necessário classificar a lacuna. Hoje, porém, a vitrine conta todos juntos, enquanto a tela de detalhe pode oferecer pouco além de nome e preço.

**Melhoria:** cruzar fontes com identificadores canônicos; classificar item segurável, item de campanha, registro legado e dado ausente; traduzir a interface de explicação; distinguir descrição indisponível de efeito que não se aplica. Mostrar cobertura de conteúdo útil, além de contagem.

**Aceite:** os itens e golpes efetivamente sugeridos pelo builder possuem explicação compreensível e fonte; faltas legítimas são identificadas, não disfarçadas como ficha completa.

## 6. Falhas de confiabilidade e continuidade

### A05 — Limites de requisição de leitura e escrita se interferem — P0

**Classificação:** HTTP 429 reproduzido; colisão de chave confirmada no framework instalado e nas rotas.

O grupo inteiro usa `throttle:180,1`. Análise, importação e validação usam também `throttle:30,1`; tópico e denúncia usam `throttle:5,1`. Esses limitadores numéricos não recebem prefixos distintos. O middleware deriva a chave do domínio da rota e IP, sem incluir a ação. Assim, leituras anteriores entram na contagem consultada pelo limite menor. Uma ação pode ser rejeitada antes de atingir seu próprio número de tentativas. Sprites também passam pela API.

Durante a auditoria, o navegador conseguia abrir partes da interface, mas a chamada de análise/importação retornava “Too Many Attempts”. Isso não deve ser tratado apenas como consequência de um teste automatizado intenso: a colisão entre categorias existe independentemente do volume, e o frontend faz várias leituras para compor cada fluxo.

**Melhoria:** limitadores nomeados e independentes para leitura, publicação, análise, importação e computação pesada; política própria de assets; mensagens em português com tempo de espera e opção de tentar novamente. Verificar a identificação de visitantes atrás do proxy: os acessos internos chegam da aplicação web, o que exige desenho explícito para não agregar pessoas diferentes indevidamente.

**Aceite:** carregar catálogo/imagens não consome o orçamento de postagem ou análise. Adicionar teste de navegação seguida de primeira publicação. Manter proteção contra abuso sem compartilhar o contador por acidente.

**Fontes:** `apps/api/routes/web.php:12–39`; `apps/api/vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php:85–104,224–229`.

### A06 — Abrir uma build substitui uma equipe salva — P0

**Classificação:** reproduzido no navegador.

**Passos:** montar/importar seis integrantes; dar nome ao rascunho; abrir `/builder?pokemon=Garchomp`; consultar o armazenamento. O rascunho anterior passa de seis integrantes para um, e o nome volta para “Minha equipe”. O caso também se aplica ao desenho do fluxo com `?build=`: a entrada explícita ignora a restauração e o salvamento usa a mesma chave.

**Melhoria:** biblioteca local com identificadores de equipe; ação explícita “Adicionar à equipe” versus “Criar nova equipe”; duplicação e desfazer; confirmação somente para substituição destrutiva; backup recuperável. Abrir uma referência deve permitir escolher um slot, sem apagar os demais.

**Aceite:** uma equipe de seis integrantes permanece recuperável após abrir qualquer build de referência ou ficha de Pokémon.

**Fonte:** `apps/web/src/routes/builder/+page.svelte:85–120`; evidência em `.runtime/audit-browser-focus.json`.

### A07 — Queda completa do frontend local — P0 para estabilidade do ambiente

**Classificação:** reproduzido; causa raiz pendente.

O processo Node encerrou com `AssertionError [ERR_ASSERTION]: assert(!this.paused)`, em `undici/Parser.finish`, usando Node 24.19.0. O navegador passou a receber conexão recusada e o frontend precisou ser reiniciado. Uma das ocorrências aconteceu durante a sequência de navegação, próxima de uma consulta a registro inexistente.

Essa proximidade não prova que o 404 seja a causa. Também não há evidência suficiente para afirmar que a mesma falha ocorre no build de produção ou em outro runtime.

**Melhoria:** criar reprodução mínima; investigar ciclo de resposta, cancelamentos e consumo de corpos HTTP; validar uma combinação estável de runtime/framework; testar cancelamentos e respostas de erro. Na operação, supervisionar processos e oferecer saúde agregada da aplicação.

**Aceite:** navegação repetida, requests cancelados e registros inexistentes não encerram o processo. Registrar erro com contexto suficiente para diagnosticar recorrência.

### A08 — Setup e inicialização exigem adaptação manual no Windows — P1

**Classificação:** observado na preparação local e confirmado nos scripts.

O setup prepara PHP portátil automaticamente somente no Linux. Além disso, concatena `PATH` com `:`, enquanto o Windows usa outro separador. O comando de desenvolvimento invoca `npm` por `spawn` sem tratar a resolução do executável de comando do Windows. Para esta instalação foi necessário preparar PHP, configurar extensões e iniciar serviços separadamente.

Na checagem final, `/up` respondeu corretamente em JSON, mas a resposta HTML falhou com HTTP 500 e “Please provide a valid cache path” no log. Isso aponta também para preparação incompleta do diretório de views compiladas. A API JSON continuar funcionando não demonstra que todos os pré-requisitos Laravel estejam preparados.

**Melhoria:** usar detecção de plataforma e separadores adequados, validar versões/extensões, oferecer diagnóstico de pré-requisitos e suportar um comando previsível de inicialização/parada. Se Windows não for suportado, isso precisa estar explícito com instruções funcionais de alternativa.

**Aceite:** instalação limpa no sistema suportado, banco populado e todos os serviços saudáveis seguindo somente o README. Um HTTP 200 com catálogo vazio não deve encerrar a verificação do setup.

## 7. Editor e jornada de montar equipes

### A09 — Preset “pela função” aplica ataque físico a suporte e controle — P1

**Classificação:** reproduzido no navegador.

Selecionar “Suporte” e clicar “Distribuir pela função” produz `Atk 252 / Spe 252 / SpD 4`. O mesmo ramo genérico atende outras funções que não sejam parede ou atacante especial. Isso não representa uma recomendação fundamentada para essas funções.

**Melhoria:** limitar o preset aos arquétipos que ele realmente cobre, explicar que é um ponto de partida ou oferecer templates revisados por espécie/formato. Considerar velocidade-alvo, bulk, habilidades e golpes. Não substituir o treinamento sem permitir desfazer.

**Aceite:** suporte e controle não recebem silenciosamente o preset de atacante físico. A sugestão mostra motivo e parâmetros modificados.

### A10 — Sugestões de golpes podem levar a escolhas ilegais — P1

**Classificação:** confirmado em execução e já parcialmente explicado pela interface.

Para Garchomp em geração IX OU, Toxic, Double Team e Hidden Power aparecem entre os candidatos, enquanto configurações com esses golpes são rejeitadas pelo validador no teste efetuado. A lista reúne possibilidades históricas/por geração e não representa diretamente opções legais no formato escolhido.

**Melhoria:** marcar disponibilidade, restrição e origem; filtrar por legalidade quando possível; diferenciar golpe banido, não transferível e combinação incompatível. Manter modo avançado para consultar opções históricas, com aviso ao lado da opção.

**Aceite:** o usuário identifica a restrição antes de preencher toda a build. A interface não depende apenas de um erro em inglês retornado no final.

### A11 — Falta um ciclo de gestão de equipes — P1

**Classificação:** confirmado no código; melhoria de produto.

Existe um rascunho local único, não uma biblioteca de equipes. Não há fluxo completo de nomear várias equipes, duplicar, arquivar, recuperar uma versão, compartilhar uma equipe por link ou retomar uma avaliação por histórico. O esquema de build e o filtro `mine` não fecham essa jornada: as rotas atuais não oferecem criação/edição de builds pessoais persistidas no servidor.

**Melhoria:** implementar primeiro biblioteca local versionada, exportação/importação de backup completo e recuperação. Depois avaliar sincronização opcional; cadastro não precisa se tornar obrigatório. PDF de um integrante e texto Showdown não preservam, juntos, todos os metadados editoriais de uma equipe.

**Aceite:** manter duas equipes independentes, duplicar uma sem afetar a outra e restaurar um backup com nome, membros, notas, formato e configuração.

### A12 — Erros e resultado da edição chegam tarde — P2

**Classificação:** confirmado no código; recomendação.

O formulário permite digitar valores livres de itens/golpes e apresenta a maior parte dos problemas após uma ação separada. Os atributos finais só aparecem após análise válida. Mudanças no rascunho apagam o resultado anterior, e falhas de `localStorage` são engolidas mesmo com o texto “Rascunho salvo neste navegador”.

**Melhoria:** mostrar total de EVs, limites, duplicidade e campos obrigatórios junto aos controles; calcular atributos com atualização controlada; indicar “salvando”, “salvo” e “não foi possível salvar”; manter o último resultado como desatualizado até nova análise, em vez de simplesmente fazê-lo sumir.

Na captura móvel, o editor ocupa uma página longa e deixa validação e simulação depois de todo o formulário. Uma navegação por seções, resumo da equipe e acesso persistente à ação principal podem reduzir o trabalho de rolagem. Isso deve ser validado com uso real, preservando espaço para os controles.

**Aceite:** o usuário sabe qual campo corrigir, o efeito da correção e se seus dados foram preservados.

## 8. Análise estratégica e simulação

### A13 — A análise não responde suficientemente “como melhorar esta build?” — P1

**Classificação:** confirmado no motor; parte das limitações é declarada.

O motor calcula atributos e observa poucos padrões: nature que reduz o atributo da função, ausência de golpe da categoria indicada, EVs não utilizados e combinação de Choice com status. Eficiência e adequação ao contexto são marcadas como dependentes de benchmarks; sinergia depende de equipe; popularidade não tem dados; a pontuação é nula.

Isso é adequado para um verificador básico, mas insuficiente para orientar escolhas entre itens, treinamento, parceiros e respostas a ameaças. Há também um campo `types` duplicado no retorno de opções, misturando tipos da espécie e lista de tipos disponíveis; convém separar esses contratos antes de ampliar os diagnósticos.

**Melhoria:** começar com diagnósticos verificáveis de equipe: fraquezas compartilhadas, imunidades, cobertura ofensiva, faixas de velocidade, remoção/colocação de hazards, dependência de clima e concentração de função. Cada observação deve indicar evidência, limite e ação possível. A calculadora de dano já existe no motor, mas não tem uma jornada correspondente na interface/API pública atual.

**Aceite:** uma análise apresenta problemas concretos e reproduzíveis, sem converter legalidade em nota de qualidade nem inventar probabilidade de vitória.

### A14 — O benchmark favorece certas estratégias por construção — P1

**Classificação:** confirmado no código e reconhecido parcialmente pelo README.

A política escolhe golpes por uma fórmula simples, só troca quando obrigada e tem tratamento limitado de suporte. Não realiza trocas voluntárias para preservar membros, não usa transformações opcionais e escolhe a ordem inicial sem planejamento estratégico. As dez equipes sintéticas não representam uma amostra da distribuição de jogadores. O candidato é colocado sempre do mesmo lado da batalha.

O intervalo de confiança informa a variação das partidas daquele teste. Ele não mede a diferença entre a política e jogadores humanos nem a representatividade do conjunto de adversários. Aumentar o número de partidas não elimina esse viés.

**Melhoria:** apresentar o recurso como benchmark automatizado limitado; montar suites de arquétipos; registrar versão, lista de adversários, lados e sementes; comparar separadamente o desempenho por matchup. Avaliar melhorias da política contra comportamentos esperados antes de ampliar promessas. Usar equipes independentes das alternativas que serão recomendadas para reduzir ajuste excessivo ao mesmo conjunto.

**Aceite:** testes de comportamento para trocas, imunidades, recuperação, setup e transformações suportadas; reprodutibilidade; relatórios por adversário; explicação do que a porcentagem representa.

### A15 — Recomendações cobrem um espaço muito estreito — P1

**Classificação:** confirmado no código.

O algoritmo busca somente builds da mesma espécie e mesmo formato para um slot escolhido, limita-se às três primeiras alternativas e exige que o limite inferior do novo intervalo supere o superior do resultado original. Não procura outro Pokémon, não ajusta a equipe inteira e pode deixar de testar uma alternativa relevante por causa da ordem no catálogo.

O critério de intervalos separados é conservador, mas não explora diretamente o desenho pareado das mesmas sementes/adversários. “Nenhuma melhora suficiente” precisa indicar quantas opções foram realmente testadas, inclusive quando não havia nenhuma.

**Melhoria:** deduplicar e excluir a configuração atual, mostrar candidatos avaliados/descartados e seus motivos; comparar diferenças pareadas; separar ausência de alternativas, resultado inconclusivo e resultado inferior. Só depois ampliar para parceiros ou substituição de espécie.

**Aceite:** a mensagem de resultado representa o espaço efetivamente pesquisado e uma alternativa não é excluída apenas por ser a quarta na lista.

### A16 — A execução assíncrona não tem jornada de recuperação — P1

**Classificação:** código e execução local.

Uma avaliação de geração IX concluiu corretamente. Ainda faltam progresso por etapa, cancelamento, estimativa de espera, retomada após reload e histórico consultável. O polling é interrompido em erro sem uma retomada automática estruturada; o identificador do job fica no estado da página. O motor aceita uma simulação por vez e retorna ocupado para concorrência. Os jobs de avaliação têm uma tentativa.

**Melhoria:** persistir referência à avaliação, informar posição/etapa, classificar falha transitória versus erro da equipe e implementar recuperação de jobs presos. A fila deve coordenar capacidade do motor. Evitar que simulação pesada impeça publicação no Discord, que hoje usa a fila padrão do mesmo ambiente. Rever a deduplicação sob requisições concorrentes: a consulta seguida de criação não possui uma unicidade equivalente no banco.

**Aceite:** recarregar durante a simulação permite continuar acompanhando; duas submissões idênticas não duplicam trabalho; motor ocupado não vira falha definitiva do usuário; tarefas curtas não esperam atrás de uma avaliação longa sem necessidade.

## 9. Imagens, catálogo e descoberta

### A17 — O catálogo e o motor não compartilham identidade confiável de formas — P1

**Classificação:** confirmado nos dados; exemplos reproduzidos via HTTP.

O catálogo declara nove Pokémon/formas sem sprite. Separadamente, 117 nomes/formas retornados pelo motor não têm correspondência por nome, slug ou `showdown_id` na consulta usada para resolver sprites. `Pikachu-Original`, `Tauros-Paldea-Combat` e `Arceus-Fire` retornaram 404 no resolvedor, enquanto Pikachu normal retornou redirecionamento válido.

Não significa que 117 desenhos estejam ausentes na fonte. Significa que a ponte de identidades não os encontra. Além disso, listas usam `EntityIcon` com fallback, enquanto slots do builder, listas de builds e previews têm imagens diretas sem o mesmo tratamento.

**Melhoria:** tabela canônica de aliases e formas; distinguir variação cosmética, transformação de batalha e espécie base; resposta de sprite com fallback explícito e proveniência. Não reutilizar imagem da base silenciosamente quando a aparência é diferente. Aplicar o mesmo componente resiliente em todas as telas.

**Aceite:** todo candidato exibido no seletor tem imagem correta ou fallback identificado, sem ícone quebrado. Auditoria deve comparar o inventário do motor com o resolvedor, além de contar imagens do catálogo.

### A18 — A Pokédex ainda não funciona como guia completo — P2

**Classificação:** confirmado na interface e nos dados.

As fichas têm atributos, habilidades e ligações de evolução, mas não explicam condições de evolução. Faltam comparações de formas e um recorte de golpes consultável na própria ficha. Informações por jogo, obtenção e progressão são explicitamente incompletas. A seção de builds da ficha está fixada em geração IX OU, mesmo quando o interesse pode ser uma geração anterior.

**Melhoria:** adicionar seletor de contexto na ficha e preservar esse contexto ao ir ao builder; mostrar forma base, cadeia e condições de evolução; permitir comparação e consulta de opções por jogo quando a cobertura existir. Não confundir “estreia da espécie” com disponibilidade naquele cartucho.

**Aceite:** o usuário entende por que uma forma existe, como se relaciona às outras e em qual contexto os dados e as builds exibidos se aplicam.

### A19 — Biblioteca de referência tem pouca explicação utilizável — P2

**Classificação:** confirmado no código.

As estratégias importadas são frases de template derivadas do nome e da distribuição de EVs. A classificação de função usa uma soma simples de EVs, o que não distingue bem suporte, controle, setup e ataque misto. Alternativas aparecem como JSON bruto. Golpes nas fichas de build são chips sem ligação para a explicação do golpe.

**Melhoria:** descrição editorial com plano de uso, parceiros, ameaças, custo das escolhas e alternativas comparáveis. Renderizar alternativas como controles legíveis. Conectar item, habilidade e golpe à ficha correspondente e oferecer ajuda curta no editor. Filtros por legalidade, função e contexto devem reduzir trabalho de busca.

**Aceite:** uma referência explica quando e por que usá-la; o usuário adapta uma alternativa sem interpretar JSON ou consultar manualmente outra fonte.

### A20 — Favoritar não fecha a tarefa de guardar para depois — P1

**Classificação:** perda de estado reproduzida; ausência de coleção confirmada nas rotas.

Após favoritar uma build, o botão muda para “Remover favorito”. Ao recarregar, volta para “Favoritar”, porque o componente inicializa o estado como falso e não recebe a reação atual do visitante. Isso não comprova que o registro foi apagado: o backend mantém a reação, mas a interface não a restaura. O mesmo desenho afeta votos. Não há tela/consulta específica de favoritos.

**Melhoria:** retornar reações do visitante na leitura, restaurar os botões, criar coleção de favoritos e explicar os limites da sessão. Uma opção de backup local ou exportação evita transformar o fim de uma sessão em perda de organização.

**Aceite:** favoritar, recarregar, localizar na coleção e remover funcionam como uma única jornada consistente.

## 10. Comunidade e Discord

### A21 — Fórum publicável, mas ainda difícil de operar — P1

**Classificação:** confirmado no código; parte das permissões já tem testes.

Existem criação, respostas, denúncias e ocultação/bloqueio de tópicos por API. Respostas ocultas são filtradas pelo relacionamento do modelo, uma proteção correta a preservar. Faltam interface de edição do autor, painel de denúncias, resolução operacional e ferramentas para respostas. Não foi encontrado fluxo público de moderação de respostas. O tópico pode receber `build_id`, mas a tela de discussão não apresenta um cartão contextual dessa build.

**Melhoria:** concluir a jornada do autor e do moderador; mostrar a build discutida; adicionar busca, paginação útil e proteção contra abuso proporcional ao uso. Tratar apelidos como identidade não verificada, sem vender persistência que a sessão não assegura. Não é necessário tornar cadastro obrigatório para corrigir essas lacunas.

**Aceite:** moderador encontra uma denúncia, remove o conteúdo relevante, registra a ação e encerra o caso; conteúdo oculto não é devolvido ao visitante; autor encontra suas ações permitidas na interface.

### A22 — Discord é uma integração implementada, não uma capacidade comprovada nesta instalação — P1 operacional

**Classificação:** indisponibilidade local observada; fluxo externo não validado.

A interface informa que o bot ainda não está configurado e o envio permanece desabilitado. Há mecanismos úteis no código: autorização por servidor/canal, proteção de menções, idempotência e estado de envio não confirmado. Isso não substitui testar a instalação real, o retorno da autorização e a publicação em um servidor autorizado.

**Melhoria:** diagnóstico de configuração, saúde da ponte, onboarding com permissões necessárias e teste de ponta a ponta num ambiente de homologação autorizado. Após o OAuth, preservar a intenção de compartilhar e reabrir a seleção de destino; atualmente o retorno vai ao builder, mas o componente não usa o parâmetro de conexão para continuar automaticamente o fluxo.

**Aceite:** usuário autorizado instala o bot, retorna à build correta, escolhe destino permitido e acompanha confirmação ou falha recuperável. Nunca repetir automaticamente uma publicação de resultado desconhecido.

## 11. Operação, dados e manutenção

### A23 — Atualização de dados pode gerar acervos divergentes — P1

**Classificação:** confirmado no código; cenário de falha parcial não injetado.

O arquivo é substituído por rename, o que protege contra arquivo parcialmente gravado. Entretanto, cada importação de sets por geração captura erro e continua; um novo snapshot pode ser publicado com uma geração indisponível. O importador do banco faz upsert/update, sem retirar registros ausentes do novo snapshot. Assim, banco, metadados e arquivo consumido pela simulação podem representar conjuntos diferentes.

Também se sobrescreve a origem de sets sem um histórico completo de versões. As revisões da PokéAPI e dos sprites são registradas, mas a proveniência de cada captura dos sets merece um snapshot identificável.

**Melhoria:** validar qualidade mínima antes de promover o snapshot; preservar a última versão boa por fonte/contexto; usar identificador único da versão do acervo no arquivo, banco e resultados; reconciliar remoções sem apagar conteúdo autoral; registrar changelog de importação.

**Aceite:** falhar uma fonte não degrada silenciosamente um contexto saudável. Uma avaliação indica exatamente qual acervo usou, e a biblioteca consultada pelo usuário corresponde a ele.

### A24 — Auditoria de assets verifica associação, não entrega completa — P2

**Classificação:** confirmado no script.

`audit:assets` conta registros com `image` e lista os ausentes. Não percorre o conjunto de nomes do motor, não verifica a renderização em todos os consumidores e não exerce falhas de rede. Isso explica por que pode parecer saudável enquanto o seletor apresenta sprites quebrados.

**Melhoria:** auditorias separadas de integridade do snapshot, aliases do motor, disponibilidade dos arquivos e renderização de telas representativas. Usar cache para manter desempenho e reduzir dependência de disponibilidade externa.

**Aceite:** falha de correspondência de uma forma exibida no builder é detectada antes de uma entrega.

### A25 — Dependências precisam de triagem, sem atualização cega — P1

**Classificação:** resultado de ferramentas de auditoria.

O npm apontou 17 pacotes: um crítico (`tar`), oito altos, três moderados e cinco baixos. Há dependências diretas e transitivas, incluindo cadeias do Pokémon Showdown. A auditoria Composer não informou advisories nesta consulta.

Esses números não equivalem a 17 vulnerabilidades exploráveis pela interface pública. É necessário verificar versão instalada, caminho de uso, ambiente e possibilidade de entrada controlada pelo atacante. Algumas correções propostas automaticamente pelo npm alteram versões principais ou sugerem mudanças inadequadas para o produto.

**Melhoria:** priorizar exposição em runtime, documentar mitigação quando aplicável e atualizar com testes de regras, importação e simulação. Não executar `npm audit fix --force` como solução genérica. Reduzir dependências sem uso somente após verificar sua função.

**Aceite:** todo alerta alto/crítico tem correção ou justificativa técnica rastreável; o build e os resultados de referência continuam compatíveis.

### A26 — A suíte não protege as promessas mais frágeis — P1

**Classificação:** confirmado pela cobertura existente e pelos defeitos encontrados com a suíte verde.

Os testes atuais cobrem regras individuais e partes da API. Faltam testes integrados de importação das nove gerações, benchmark com tamanhos problemáticos, navegação antes de publicar, correspondência de formas, recuperação de rascunho, favorito após reload, download de PDF e retomada de job. Há dependência Playwright, mas não foi encontrada uma suíte de navegador versionada equivalente aos fluxos auditados. Não foi encontrada configuração de CI no repositório analisado.

**Melhoria:** automatizar os critérios de aceite dos achados P0/P1; adicionar verificação de catálogo vazio e validade de amostras reais; executar build, testes e smoke test de navegador na entrega. Priorizar cenários que reproduzem perda de dados ou bloqueio de uma tarefa.

**Aceite:** introduzir novamente qualquer um desses defeitos faz a verificação falhar antes de entregar o localhost ou publicar uma versão.

## 12. Ideias que precisam ser reformuladas

| Ideia atual | Por que não resolve bem o objetivo | Direção proposta |
| --- | --- | --- |
| Mostrar um número grande de builds | Quantidade não representa prontidão quando 69,7% estão rejeitadas | Acervo validado como principal; importações pendentes separadas |
| “Distribuir pela função” como recomendação genérica | Função sozinha não determina EVs; suporte recebe ataque físico | Templates explicados, reversíveis e limitados ao escopo real |
| Usar 1.000 partidas como demonstração de qualidade | A política e os dez adversários dominam a interpretação | Benchmark por matchup, com método e limites visíveis |
| Buscar só três alternativas da mesma espécie | Pesquisa pequena demais para representar “melhorar a equipe” | Mostrar o espaço pesquisado e ampliar por etapas verificáveis |
| Um único rascunho salvo automaticamente | Facilita começar, mas provoca substituição e não organiza equipes | Biblioteca local, versões e recuperação |
| Favorito sem coleção | Não permite executar a intenção “encontrar depois” | Coleção consultável e estado restaurado |
| Fórum sem operação de moderação completa | Publicar é simples; manter a comunidade saudável não está resolvido | Ferramentas de operação antes de estimular expansão |
| Alternativas e limitações em texto técnico/JSON | Transferem ao usuário o trabalho que o produto deveria fazer | Controles e explicações contextualizadas |
| Expandir formatos antes de estabilizar o núcleo | Multiplica regras, fontes e diferenças de comportamento | Consolidar primeiro um contexto completo e confiável |

Evitaria, nesta fase, criar ranking global de “melhores builds”, porcentagem de vitória contra humanos ou uma nota única de qualidade. O produto ainda não possui evidência suficiente para sustentá-los. A ausência de pontuação inventada no estado atual é uma decisão correta a preservar.

## 13. Experiência recomendada

O fluxo principal deveria ser:

1. **Escolher objetivo e formato.** Competitivo singles, formato específico e geração, com indicação clara dos modos indisponíveis.
2. **Começar uma equipe ou abrir uma existente.** Uma referência pode entrar em um slot ou virar uma cópia independente.
3. **Editar com explicação.** Item, habilidade, golpe e treinamento devem expor efeitos e restrições sem sair da tarefa.
4. **Validar e corrigir.** Erros nos campos e uma visão do time distinguem legalidade, completude e qualidade estratégica.
5. **Analisar problemas concretos.** Cobertura, velocidade, funções e matchups relevantes, com evidências e limites.
6. **Comparar mudanças.** Exibir antes/depois, opções testadas, efeito esperado e custo de cada troca.
7. **Salvar e continuar.** Biblioteca, backup, exportação, PDF e compartilhamento preservam o trabalho e seu contexto.

No aspecto visual, a base de desktop e a adaptação móvel amostrada são utilizáveis. O maior ganho agora está em clareza e continuidade: prioridade das ações, estados de carregamento, mensagens úteis e relações entre dados. Testar teclado, foco, zoom, leitor de tela e dispositivos físicos permanece necessário; não há evidência nesta análise para declarar conformidade de acessibilidade.

## 14. Ordem de execução proposta

As faixas de esforço são relativas: **pequeno**, **médio** e **grande**. Não são prazos em dias; dependem de decisões e validação.

| Ordem | Entrega | Prioridade | Esforço | Condição de conclusão |
| --- | --- | --- | --- | --- |
| 1 | Separar contadores de rate limit e tratar HTTP 429 | P0 | Pequeno/médio | Navegação não bloqueia a primeira ação legítima |
| 2 | Impedir sobrescrita e recuperar rascunhos | P0 | Médio | Equipe anterior permanece recuperável |
| 3 | Corrigir normalização de sets e nomes/apelidos | P0/P1 | Médio | Acervo anunciado como pronto passa na validação |
| 4 | Corrigir seleção de benchmark e testar nove contextos | P0 | Pequeno/médio | Gerações V/VIII deixam de falhar pela repetição de índices |
| 5 | Isolar a queda do runtime e supervisionar serviços | P0 | Incerto até reprodução mínima | Erros/cancelamentos não encerram a aplicação |
| 6 | Resolver aliases de formas e uniformizar fallback | P1 | Médio | Todo candidato visual tem representação identificada |
| 7 | Corrigir favoritos e criar coleção | P1 | Pequeno/médio | Estado e consulta persistem após reload |
| 8 | Biblioteca de equipes e backup completo | P1 | Médio/grande | Várias equipes coexistem sem perda |
| 9 | Presets honestos, opções contextualizadas e erro por campo | P1/P2 | Médio | Editor reduz escolhas inválidas e explica sugestões |
| 10 | Diagnóstico de equipe e calculadora de matchups | P1 | Grande | Recomendações específicas e verificáveis |
| 11 | Recuperação de avaliações, filas e comparação metodológica | P1 | Médio/grande | Execução retomável, capacidade controlada e método auditável |
| 12 | Completar conteúdo, comunidade e operação do Discord | P1/P2 | Médio/grande | Jornadas completas, com critérios próprios de aceite |

Os testes de regressão acompanham cada entrega; não ficam para uma fase final. A triagem de dependências deve começar junto das primeiras correções, priorizando os caminhos realmente expostos.

## 15. Critérios para chamar a próxima versão de confiável

- Instalação reproduzível no ambiente suportado, com dados carregados e saúde dos serviços verificada.
- Fluxos principais exercitados no navegador após build, incluindo cliques e imagens.
- Nenhuma perda de equipe ao abrir referência, trocar formato, recarregar ou iniciar outra equipe.
- Catálogo informa dados válidos, pendentes e indisponíveis sem misturá-los no mesmo indicador de qualidade.
- Benchmark montado e validado por contexto suportado; falhas explicadas antes de iniciar o job.
- Análise, importação e publicação continuam disponíveis após navegação normal.
- Favoritos têm coleção e estado consistente.
- PDF, exportação e backup têm testes de conteúdo e recuperação.
- Avaliações podem ser retomadas, e seus resultados identificam versão, adversários e limites.
- A integração Discord só é anunciada como operacional após teste real autorizado.
- Alertas de dependências têm triagem registrada, e erros de runtime possuem monitoramento.

## 16. Evidências e referências para execução

Arquivos produzidos nesta auditoria, em `.runtime/` — diretório ignorado pelo Git:

- `audit-data.json`: cobertura de conteúdo, builds por geração e nomes do motor sem correspondência.
- `audit-browser.json`: navegação ampla, respostas HTTP, limitações encontradas e verificação móvel.
- `audit-browser-focus.json`: preset de suporte, sobrescrita de rascunho e comportamento de favorito.
- `audit-pdf-sim.json`: verificação isolada de PDF e ciclo da avaliação assíncrona.
- `audit-export.txt`: exportação da equipe de teste.
- `audit-build.pdf`: PDF gerado pelo botão na repetição isolada.
- `mobile-home.png`, `mobile-builder.png`, `mobile-itens.png`: capturas móveis.
- `dependency-audit.json`, `php-dependency-audit.json`: resultados brutos das auditorias de pacotes.

Os arquivos de evidência incluem tentativas bloqueadas e testes que precisaram ser corrigidos/repetidos. Um timeout de teste não foi automaticamente tratado como defeito do produto. As conclusões acima distinguem essas tentativas dos resultados confirmados, especialmente no caso do PDF e da simulação.

Fontes principais para transformar o relatório em trabalho:

Na tabela abaixo, caminhos iniciados por `app/` ou `config/` são relativos a `apps/api/`.

| Área | Arquivos |
| --- | --- |
| Importação e validade das referências | `scripts/sync-data.mjs`; `apps/api/app/Console/Commands/ImportCatalog.php` |
| Regras e contratos de build | `services/battle-engine/src/domain.js`; `contexts.js` |
| Benchmark, política e alternativas | `services/battle-engine/src/simulation.js`; `server.js` |
| Persistência e interação do editor | `apps/web/src/routes/builder/+page.svelte`; `+page.server.js` |
| Limites e endpoints | `apps/api/routes/web.php`; `app/Providers/AppServiceProvider.php` |
| Avaliação e fila | `app/Http/Controllers/EvaluationController.php`; `app/Jobs/RunEvaluation.php`; `config/queue.php` |
| Imagens e identidades | `app/Http/Controllers/CatalogController.php`; `apps/web/src/lib/api.js`; `components/EntityIcon.svelte` |
| Favoritos e biblioteca | `app/Http/Controllers/BuildController.php`; `apps/web/src/routes/builds/[id]/+page.svelte` |
| Comunidade e moderação | `app/Http/Controllers/TopicController.php`; `apps/web/src/routes/comunidade/` |
| Compartilhamento | `apps/web/src/lib/pdf.js`; `components/ShareBuild.svelte`; `DiscordController.php`; `SendDiscordBuild.php` |
| Instalação e operação | `scripts/setup.mjs`; `scripts/dev.mjs`; `README.md` |

**Decisão de produto recomendada:** consolidar uma jornada completa de descobrir uma referência válida, montar uma equipe, entender suas restrições, comparar uma melhoria e continuar o trabalho depois. Esse é o núcleo que pode diferenciar o illke; o volume do catálogo e a quantidade de recursos só agregam valor quando essa jornada é confiável.
