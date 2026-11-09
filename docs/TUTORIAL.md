# Como usar o illke

## Começar e navegar

O site funciona sem cadastro. No celular, abra o menu no cabeçalho. O botão de
sol ou lua troca o tema. Pule a abertura pelo botão ou por Escape.
Selecione a edição no menu lateral ou em Jogos e mapas para contextualizar as pistas.

## Pesquisar e consultar fichas

Na Pokédex, procure nome, forma ou número e combine tipo e geração. A geração
indica estreia, não disponibilidade no jogo. Limpar pesquisa e filtros reinicia
a consulta. Use a paginação para explorar todos os resultados.
Abra uma espécie para consultar tipos, atributos base, habilidades, evolução e
builds. Habilidade oculta é uma opção registrada pela fonte. Os atributos base
não são os valores finais: nível, treinamento e nature também influenciam.

Itens e golpes têm pesquisa própria. Nos golpes, confira tipo, categoria,
poder, precisão e PP. Físico e especial usam atributos diferentes; golpes de
status priorizam efeitos. As habilidades têm categorias por função inferidas
pelo illke. Uma habilidade pode ter várias funções; leia o efeito completo,
preservado no idioma da fonte, na ficha.

## Jogos, mapas e captura

Filtre jogos por console, região, categoria ou nome. Selecione a edição exata e
busque um Pokémon ou item. Escolha uma pista para ver destino e instruções.
Mapas locais, zoom, alvos e caminhos aparecem onde há cobertura verificada.
Marcadores regionais representam áreas e não passos exatos.
Nas dicas de captura, ajuste momento, noite e caverna. Frequência de encontro
não é chance de captura. Ausência de pista não comprova impossibilidade de obter.

## Builder e equipes

Escolha geração e formato antes dos integrantes. A equipe começa com seis
espaços vazios. Adicione até seis Pokémon e clique em cada um para editar
nível, item, habilidade, nature, golpes e treinamento. Referências legais
podem preencher opções iniciais. Busque golpes no repertório da espécie e
valide após editar. Remover funciona inclusive para o último integrante.

EVs modernos convencionais permitem até 252 por atributo e 510 no total.
IVs, nature e nível entram no cálculo. Gerações antigas seguem regras próprias.
Importe e exporte texto Showdown para transferir configurações.
Em Minhas equipes, gerencie as equipes locais e exporte backup JSON antes de
limpar os dados do navegador. Importar backup cria cópias. Não há sincronização
automática entre dispositivos ou navegadores.

## Builds, validação e favoritos

Filtre builds por espécie e formato. Confira origem e estado de legalidade.
Uma referência pode servir de ponto de partida para uma equipe independente.
Legalidade confirma regras do simulador, sem garantir obtenção no cartucho ou
força competitiva. Favoritar guarda a build neste navegador. Consulte e remova
essas escolhas na página Favoritos.

## Calculadora e avaliações

Configure atacante, defensor e golpe na Calculadora de dano. Confira atributos,
nível, item, habilidade e condições de campo; use as opções avançadas quando
necessário. O resultado é uma faixa de dano para as condições informadas.

A análise de equipe descreve cobertura e funções por heurísticas. As avaliações
simulam batalhas contra equipes sintéticas. Confira amostra, empates e intervalo
de confiança. Compare alternativas no mesmo benchmark. Pequenas diferenças
podem ser ruído; a taxa não prevê vitórias contra humanos. Avaliações podem ser
acompanhadas após recarregar a página.

## PDF

Use Salvar PDF na ficha da build ou a ação disponível no editor. Confira a
configuração e aguarde o download. A ficha contém imagem, formato, nível,
habilidade, item, nature, golpes, EVs, IVs e estratégia. Textos longos continuam
em outras páginas sem serem resumidos. Se a arte falhar, o documento permanece
disponível com indicação visual. Confira a conexão e tente novamente.
Para manter a equipe editável, exporte JSON ou Showdown; o PDF é para consulta.

## Comunidade, moderação e Discord

Crie tópicos e respostas informando formato e contexto. Apelidos não são
identidades verificadas. Votos pertencem à sessão do navegador. Use denúncias
para conteúdo inadequado. A moderação requer o segredo do responsável pelo
site e tem sessão temporária e ações auditadas.

O bot exige configuração pelo responsável. Quando disponível, instale-o no
servidor autorizado, abra uma build e selecione Enviar para Discord. Autorize
a consulta dos servidores e escolha um canal permitido. A autorização é
temporária, sem criar conta no illke. Se um envio ficar incerto, confira o canal
antes de repetir. Credenciais ausentes deixam a integração indisponível.

## Fontes, cobertura e problemas

Cobertura apresenta revisões e lacunas. Fontes e créditos identifica dados,
imagens e cálculos. Imagens genéricas ou da espécie-base não comprovam a arte
exata de cada forma ou jogo. Lojas, eventos, DLCs e derivados têm cobertura
parcial. Não existe um ranking global comprovado de sucesso das builds.

Sem resultados: limpe filtros e tente o nome original do jogo. Consulta falhou:
verifique a conexão e os serviços locais. Imagem faltando: consulte fontes e
considere que pode haver apenas referência genérica. Equipe desapareceu:
confirme o navegador e importe o backup. No ambiente local, `npm run doctor`
verifica serviços e catálogo; `npm run dev` inicia e `npm run stop` encerra.
