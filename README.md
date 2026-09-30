# illke

Plataforma Pokémon em desenvolvimento: catálogo, dados por jogo, wiki, builder, avaliação explicável e integração com Discord.

## Estado atual

- Interface inicial em SvelteKit com SSR, temas escuro/claro e navegação responsiva.
- API Laravel 13 inicializada.
- Serviço interno de atributos, dano e validação de conjuntos do Showdown implementado, ainda em integração.
- Bot, importadores, manifesto de imagens e páginas de catálogo em construção.
- Nenhuma cobertura completa ou nota técnica sem benchmark aprovado é alegada.

## Stack

PHP 8.5 / Laravel 13; JavaScript / Svelte 5 / SvelteKit 2; Node.js 24 LTS; PostgreSQL em produção. SQLite é uma alternativa explícita de desenvolvimento portátil. Redis e deployment serão integrados conforme o roadmap.

## Prévia local

```sh
npm install
npm run dev:web -- --port 5186
```

Abra http://localhost:5186. O servidor de desenvolvimento atualiza a interface ao salvar arquivos. As ferramentas e o catálogo dependem da API e da importação em construção.

O PHP e o Composer portáteis usados nesta estação ficam em `.runtime/`, ignorados pelo Git. Em outra estação, instale os pré-requisitos pelas fontes oficiais antes de instalar a API:

```sh
cd apps/api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Os comandos e a instalação completa serão verificados antes do primeiro lançamento.

## Fontes de imagens

PokéAPI/sprites como principal; Pokémon Showdown como complemento; Bulbagarden Archives para variantes de itens. Imagens devem ser associadas por manifesto a entidade, forma, aparência e jogo. Assets oficiais, comunitários e derivados devem ser identificados separadamente. Fallbacks não contam como cobertura exata.

## Estrutura

- `apps/web`: website SvelteKit.
- `apps/api`: API PHP e persistência.
- `apps/discord-bot`: integração Discord.
- `services/battle-engine`: cálculo e legalidade.
- `docs`: decisões e documentação.
- `scripts`: desenvolvimento, importação e auditoria.

## Limitações

A primeira entrega é um contexto de Scarlet/Violet singles OU. A legalidade do conjunto no simulador não comprova a obtenção de um exemplar no cartucho. Sem benchmarks editoriais aprovados, a avaliação apresenta cálculos e evidências, sem índice global. Conteúdo da franquia, imagens e fontes mantêm seus respectivos direitos.

Veja [decisões de implementação](docs/DECISIONS.md) e [contribuição](CONTRIBUTING.md).
