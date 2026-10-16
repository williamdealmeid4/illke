# illke — decisões de implementação

PHP/Laravel é a autoridade de persistência, sessões anônimas, publicação e autorização. SvelteKit usa SSR Node. O serviço Node interno autenticado executa cálculos e legalidade. O site não tem cadastro ou login: builds são salvas em PDF e rascunhos permanecem no navegador.

O motor suporta formatos singles OU das gerações I a IX, com revisão Showdown fixada no lockfile. Legalidade no simulador não comprova disponibilidade ou obtenção em um cartucho. Catálogo de versões não implica suporte aos sistemas próprios de Legends e Let's Go, campanhas ou regulamentos VGC.

Avaliações usam 1.000 batalhas com sementes determinísticas, equipes sintéticas de sets de referência e política heurística versionada. Exibem vitórias, derrotas, empates e intervalo Wilson de 95%, com limitações explícitas. Não estimam chance universal de vitória nem desempenho humano. Recomendações comparam o mesmo slot, mantendo os demais integrantes e o benchmark. O ranking global permanece indisponível enquanto não existir comparação padronizada aprovada.

PostgreSQL é o banco de produção. SQLite é a alternativa de desenvolvimento e testes. As filas persistem no banco; jobs de avaliação têm timeout de 600 segundos e reserva de 660 segundos.

Imagens vêm do snapshot PokéAPI/sprites, com associação por entidade e revisão. Sprites genéricos não comprovam a aparência em um jogo. Arquivos ausentes não são substituídos silenciosamente. O PDF usa a arte disponível em uma composição visual própria e registra a fonte.

O bot do sistema é instalado nos servidores dos usuários. Uma conexão OAuth opcional e temporária ao Discord verifica servidores administrados pelo visitante, sem criar conta no site. Somente canais permitidos ao bot são oferecidos. O envio exige ação explícita no site, CSRF, limite de requisições e autorização do destino. Segredos nunca são expostos ao navegador. Sem credenciais, o link de instalação e os envios permanecem indisponíveis com indicação na interface.
