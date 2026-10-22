# Revisão de segurança — 22/10/2026

A revisão abrangeu SvelteKit, o proxy para Laravel e dependências npm. Foram preservados o transporte HTTP protegido, a validação CSRF, os limites de requisição e as autorizações já presentes na API. Não é uma certificação de segurança nem um pentest da infraestrutura de produção.

## Correções

1. **Média — proteções do navegador.** `apps/web/svelte.config.js:2` agora gera CSP com nonce/hash do SvelteKit, scripts da própria origem, bloqueio de objetos e de incorporação em frames. Estilos inline são necessários aos atributos dinâmicos do Svelte. `apps/web/src/hooks.server.js:42` acrescenta `nosniff`, política de referenciador e desabilita câmera, microfone e geolocalização. A CSP foi verificada também no servidor de produção.
2. **Média — defesa adicional nas mutações.** `apps/web/src/hooks.server.js:45` recusa mutações originadas fora do site antes de encaminhá-las ao Laravel. A verificação CSRF do backend continua ativa. O Vite encaminha a API pelo mesmo hook, em desenvolvimento e produção.
3. **Média — isolamento das consultas de pistas.** `apps/web/src/lib/server/guides.js:9` aceita somente caminhos de recursos predefinidos da PokéAPI. Não aceita URLs fornecidas pelo visitante; aplica timeout, cache limitado e compartilhamento de consultas simultâneas. Os itens locais continuam disponíveis durante falhas da fonte externa.
4. **Dependências — alertas altos e críticos corrigidos.** `package.json:30` fixa Pokémon Showdown 0.11.11; `package.json:39` aplica versões corrigidas de tar, nodemailer, uuid, cookie e @tootallnate/once. O lockfile também atualiza dependências com correções compatíveis, incluindo Vite. As versões major substituídas são transitivas; este projeto usa somente o motor de batalha do Showdown, sem seu servidor de e-mail ou SQLite. Validado com testes do motor, integração e build.

## Resultado e limites

A auditoria npm final, incluindo dependências de desenvolvimento e opcionais, retornou **zero vulnerabilidades conhecidas**. Isso representa o estado da base de avisos na data da consulta, não garante ausência de falhas desconhecidas.

A cadeia opcional de proxy do Showdown recebeu `@tootallnate/once` 3, uma versão ESM. Foi validada em Node 26 com um proxy HTTP local real e o consumidor CommonJS antigo; o projeto exige Node 24.17 ou superior, que suporta essa interoperabilidade. O motor, a API, os testes de interface e o build também foram verificados. Node anterior ao mínimo declarado não é suportado.

A auditoria e os testes devem ser repetidos ao atualizar o lockfile. O deploy precisa manter a API e o motor em rede privada e preservar as configurações de sessão da instalação.
