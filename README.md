# illke

Catálogo e laboratório de equipes Pokémon, com visual de arena competitiva. Sem cadastro: monte uma build, baixe a ficha em PDF ou compartilhe pelo bot no seu próprio servidor Discord.

## Executar localmente

Pré-requisitos: Node.js 24 LTS ou superior. PHP 8.5 e Composer são usados pela API; no Linux, o setup prepara versões portáteis em `.runtime/` se não estiverem instalados.

```sh
npm ci
npm run setup
npm run dev
```

Abra http://127.0.0.1:5186. O comando inicia SvelteKit, Laravel, motor e worker de avaliações. SQLite é o padrão local; PostgreSQL é o banco de produção. O setup preserva arquivos `.env` existentes. Dados e credenciais não são versionados.

## Funcionalidades

- Pokédex com espécies, formas, tipos, atributos, habilidades e evoluções; catálogos de itens, golpes e habilidades.
- Sprites e artes do repositório PokéAPI, com revisão fixada, associação por entidade e indicação de lacunas.
- Sets de referência das gerações I a IX, com alternativas e fonte identificada.
- Builder de até seis integrantes, análise individual, validação de equipe, importação e exportação Showdown e rascunho no navegador.
- PDF local com arte do Pokémon, treinamento, golpes, propriedades e estratégia. Não exige login nem envia a configuração para um gerador externo.
- Simulação assíncrona de 1.000 batalhas contra equipes sintéticas, com sementes reproduzíveis, intervalo de confiança e comparação de alternativas do mesmo Pokémon.
- Fórum com apelidos, respostas, denúncias e moderação; votos por sessão de navegador.
- Bot instalável nos servidores dos usuários; conexão temporária com Discord para selecionar servidor e canal autorizados.

## Importação e verificações

```sh
npm run sync:data
php apps/api/artisan catalog:import
npm run audit:assets
npm run sync:icons # atualiza os ícones locais de tipos, categorias e itens
npm test
npm run check
npm run build
cd apps/api
php artisan test --compact
```

Use `.runtime/php` no lugar de `php` se estiver usando o runtime portátil. Execute os comandos Artisan no diretório `apps/api` quando dependerem de caminhos relativos, incluindo os testes.

O importador retoma downloads CSV em cache e faz atualização idempotente no banco. Downloads incompletos não substituem o snapshot válido. Colisões de identificadores são preservadas com sufixo numérico e registradas no relatório. A cobertura está em `/cobertura`.

## Bot do Discord

1. Crie uma aplicação e seu bot no [Discord Developer Portal](https://discord.com/developers/applications). Não são necessários intents privilegiados.
2. Em `apps/discord-bot/.env`, configure `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID` e um `BOT_SERVICE_TOKEN` aleatório. Use `.env.example` como modelo.
3. Em `apps/api/.env`, configure o mesmo `BOT_SERVICE_TOKEN`, `DISCORD_APPLICATION_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_ENABLED=true` e `DISCORD_SERVICE_URL=http://127.0.0.1:8082`.
4. Cadastre o callback `http://127.0.0.1:5186/api/v1/discord/callback` na aplicação. Em produção, use a URL HTTPS pública e configure `DISCORD_REDIRECT_URI` e `FRONTEND_URL`.
5. Inicie a ponte com `npm run dev:bot`, além de `npm run dev`.

O link **Bot do Discord** é gerado pelo Application ID. A pessoa instala o bot no seu servidor, abre uma build, escolhe **Enviar para Discord**, autoriza a consulta dos seus servidores e seleciona o destino. A autorização não cria conta no illke e expira em 15 minutos. São aceitos servidores em que a pessoa é proprietária ou administradora e canais de texto/anúncios onde o bot pode ver, enviar mensagens e incorporar links.

Somente a API conhece o segredo da ponte. O visitante não pode fornecer um servidor fora da sua autorização. Menções automáticas são desabilitadas e pedidos repetidos usam uma chave de idempotência. Se o envio não puder ser confirmado, o sistema pede para conferir o canal antes de repetir. Nenhuma mensagem é enviada durante testes: a integração é substituída por respostas controladas.

## Limites atuais

O catálogo importado é amplo, mas não comprova obtenção ou progressão em cada cartucho. O motor suporta singles OU das gerações I a IX; adaptadores próprios para Legends, Let’s Go, campanha e regulamentos doubles/VGC permanecem pendentes. Uma geração não equivale à disponibilidade em todo jogo dela.

As simulações usam equipes sintéticas formadas de sets de referência e uma política heurística limitada. Não modelam adequadamente todas as estratégias nem usam transformações opcionais. A taxa exibida vale apenas para aquele benchmark e não estima vitórias contra humanos. A biblioteca ainda não possui ranking global por sucesso; nenhuma nota é inventada. Recomendações exigem melhora com intervalos de confiança separados no mesmo teste.

Nove registros do snapshot inicial não possuem sprite genérico confirmado. Imagens genéricas não contam como associação exata ao jogo. Mudanças de snapshot podem alterar a cobertura.

O fórum usa apelidos sem identidade verificada. A moderação de tópicos usa o segredo `MODERATOR_TOKEN` na API, sem tela de login; inclua-o como Bearer nas solicitações PATCH de `hidden` e `locked`. Favoritos e votos são associados à sessão e não são portáveis entre navegadores. Rascunhos ficam no armazenamento local; PDFs são a forma de salvar uma build fora do navegador.

## Fontes e direitos

[PokéAPI](https://github.com/PokeAPI/pokeapi), [PokéAPI/sprites](https://github.com/PokeAPI/sprites), [Pokémon Showdown](https://github.com/smogon/pokemon-showdown), [Smogon Damage Calculator](https://github.com/smogon/damage-calc) e [pkmn/smogon](https://github.com/pkmn/smogon). Sets e análises pertencem a Smogon e seus contribuidores; explicações do illke são próprias. Pokémon e suas imagens pertencem aos respectivos titulares. A fonte Barlow é distribuída sob OFL, incluída junto ao arquivo.

## Biblioteca, filas e limites

Novas equipes começam com os seis espaços vazios. Use **Remover** no cartão de qualquer integrante, inclusive o último. Ao escolher um Pokémon com referências validadas no formato, o editor carrega uma build convencional e seus golpes. O seletor de golpes permite pesquisar no repertório da espécie; as restrições ainda são conferidas na validação. A tipagem natural é exibida como informação fixa.

## Guia de captura por jogo

Na página de cada Pokémon, **Onde capturar e como se preparar** permite escolher a versão e consultar locais, níveis, métodos, condições e frequência de encontro. A frequência não é a probabilidade de captura de uma bola. As dicas de preparação consideram geração, tipos históricos, momento da batalha, noite e caverna; presentes, Safari, raids e jogos com sistemas próprios são tratados separadamente.

Execute npm run sync:capture após importar o catálogo para atualizar os encontros da mesma revisão da PokéAPI. O setup e a sincronização completa já incluem essa etapa. O arquivo local .data/capture-guide.json é gerado atomicamente e não é versionado; não há consulta externa durante a navegação. Em produção, ILLKE_DATA_DIR pode apontar para a pasta desses dados.

A revisão atual tem registros em 41 das 53 versões listadas, com lacunas nas versões recentes. A interface informa quando não há um local confirmado, sem assumir que a espécie seja impossível de obter. Os nomes de locais e condições permanecem em inglês para corresponder ao jogo e à fonte. As recomendações não calculam uma chance exata nem garantem disponibilidade de itens em qualquer ponto da campanha.

Fontes: tabelas de encontros da PokéAPI na revisão do catálogo; guias oficiais de captura Pokémon, Legends: Arceus e Let’s Go; documentação das mecânicas por geração indicada no próprio guia.

## Persistência e limites competitivos

Equipes, favoritos e checkpoints ficam no IndexedDB deste navegador. Exporte o backup JSON na página **Equipes** para guardar ou transferir suas equipes; o arquivo exclui credenciais, histórico privado e identificadores de avaliação. Não há cadastro nem sincronização automática entre navegadores.

O motor separa as referências legais confirmadas dos sets pendentes e conserva snapshots imutáveis para avaliações reproduzíveis. A auditoria atual cobre as gerações I–IX; nove registros não possuem arte exata confirmada e mostram o marcador local de imagem indisponível. O diagnóstico de equipe descreve cobertura e funções por heurísticas, sem inventar uma nota competitiva.

As batalhas de avaliação são um piloto contra equipes sintéticas. Comparações usam os mesmos adversários e sementes, teste exato de McNemar e ajuste de Holm. Mesmo assim, os resultados não predizem partidas contra pessoas e a política automática não modela todas as estratégias ou transformações.

`npm run doctor` verifica os serviços locais e o catálogo; `npm run stop` encerra os processos do projeto. O servidor separa a fila longa de avaliações da fila padrão. A sessão de moderação expira em 30 minutos e suas ações são auditadas. Votos públicos permanecem associados à sessão do navegador; favoritos da biblioteca são locais. Envio ao Discord requer credenciais configuradas e não é coberto pelo envio real nos testes automatizados.

A auditoria npm desta revisão não apresenta vulnerabilidades conhecidas. O relatório `security_best_practices_report.md` registra os ajustes e os limites da revisão; o workflow de CI guarda a auditoria como artefato.

## Jogos, mapas e pistas

`/jogos` reúne 154 títulos e expansões, incluindo a série principal, derivados e aplicativos, com filtros por console e região. A escolha fica salva em um cookie do navegador e acompanha as fichas de Pokémon e itens. O catálogo geral continua exibindo todas as espécies; selecionar um jogo filtra as pistas de obtenção, não comprova a disponibilidade de cada registro do catálogo.

Os mapas clássicos de Kanto, Johto, Hoenn e Sevii têm coordenadas regionais verificadas. Outras regiões têm arte de referência, sem marcadores quando faltam coordenadas. As imagens são locais e as fontes estão identificadas na interface e em `apps/web/static/maps/sources.json`. As recomendações de bolas e preparação usam a geração, o tipo histórico e o método do encontro selecionado.

`npm run sync:capture` prepara encontros locais por versão, com fallback para PokéAPI quando o snapshot não estiver disponível. O snapshot acompanha a revisão do catálogo. Para atualizar os 613 eventos explícitos de itens de FireRed/LeafGreen e Emerald, execute `python3 scripts/sync-item-guides.py`. Para reconstruir os mapas clássicos na revisão fixada, execute `python3 scripts/sync-maps.py`. A cobertura é parcial: lojas, presentes, eventos, DLCs e jogos derivados não têm dados completos. A interface indica as lacunas sem inventar locais.

A navegação permanece na mesma aba, com menu lateral no computador e menu recolhível no celular. A abertura animada da logo aparece ao abrir ou recarregar o site, sem repetir nas navegações pelo menu, pode ser pulada e respeita a preferência de movimento reduzido.

Os ícones de tipagem são sprites dos jogos Sword/Shield (Stellar: Scarlet/Violet), sem redesenho. `npm run sync:icons` recupera os arquivos e seus hashes. As imagens dos consoles são do acervo existente RetroArch / FlatUX, de baxysquare e contribuidores; PC e celular usam Twemoji. `python3 scripts/sync-console-icons.py` recupera os arquivos originais. Créditos, revisões e hashes estão em `/consoles/sources.json` e na página `/fontes`.

Os guias agora incluem mapas locais reconstruídos com os tiles originais de FireRed/LeafGreen e Emerald, alvos de itens, áreas de grama/água e etapas de acesso. `python3 scripts/sync-walkthrough-maps.py` reconstrói 301 mapas locais usando Pillow. As conexões físicas entre áreas não calculam passos nem barreiras de progresso dentro de uma sala. Os caminhos ainda não cobrem todas as versões.

As capas e artes oficiais disponíveis são servidas localmente, com origem e hash em `/covers/sources.json`. `python3 scripts/sync-game-covers.py` recupera o acervo. Títulos sem imagem confirmada exibem uma indicação explícita; arte promocional não é apresentada como capa física.
