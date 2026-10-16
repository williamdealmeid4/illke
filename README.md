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
