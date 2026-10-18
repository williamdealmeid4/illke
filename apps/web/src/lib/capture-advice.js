export const captureSources = {
  battle: {label:'Guia oficial: preparar uma captura',url:'https://www.pokemon.com/us/features/pokemon-rpgs-101'},
  balls: {label:'Mecânicas de captura por geração',url:'https://bulbapedia.bulbagarden.net/wiki/Catch_rate'},
  arceus: {label:'Legends: Arceus — guia oficial',url:'https://legends.arceus.pokemon.com/pt-pt/gameplay/'},
  letsgo: {label:"Let's Go — guia oficial",url:'https://www.pokemon.com/us/features/keep-that-catch-combo-going'},
  beast: {label:'Beast Ball e Ultra Beasts — Pokémon',url:'https://www.pokemon.com/uk/news/the-wand-company-beast-ball-replica-at-the-pokemon-center'},
};
const standardGames = new Set(['red','blue','yellow','red-japan','green-japan','blue-japan','gold','silver','crystal',
  'ruby','sapphire','emerald','firered','leafgreen','diamond','pearl','platinum','heartgold','soulsilver',
  'black','white','black-2','white-2','x','y','omega-ruby','alpha-sapphire','sun','moon','ultra-sun','ultra-moon',
  'sword','shield','brilliant-diamond','shining-pearl','scarlet','violet',
  'the-isle-of-armor-sword','the-isle-of-armor-shield','the-crown-tundra-sword','the-crown-tundra-shield',
  'the-teal-mask-scarlet','the-teal-mask-violet','the-indigo-disk-scarlet','the-indigo-disk-violet']);

export function historicalTypes(pokemon, generation) {
  return [...(pokemon.past_types || [])].sort((a,b)=>a.through_generation-b.through_generation)
    .find(row=>generation<=row.through_generation)?.types || pokemon.types || [];
}

export function captureAdvice(game, pokemon, encounter, situation = {}) {
  const result = {balls:[],items:[],tips:[],sources:[], standard:false, best:null};
  const addBall = (name, reason) => result.balls.push({name,reason});
  if (game.generation < pokemon.generation) {
    result.tips.push('Esta espécie ou forma foi introduzida depois deste jogo. Não há recomendação de captura para esta versão.');
    return result;
  }
  if (encounter && /gift|npc-trade|bonus-disc|pokemon-channel|pokemon-ranger|battle-revolution|wish-eggs/.test(encounter.method)) {
    result.tips.push('Este registro é de presente, ovo, troca ou distribuição. Não é uma captura selvagem: a escolha da Poké Bola não ajuda a obtê-lo. Confira os requisitos do evento ou NPC.');
    return result;
  }
  if (game.id === 'legends-arceus') {
    addBall('Heavy Ball','Para se aproximar de um Pokémon que ainda não percebeu você; esta é a versão de Hisui, com mecânica própria.');
    result.best='Heavy Ball, se o alvo ainda não notou você';
    result.items.push('Itens de distração e comida podem ajudar na aproximação. Confira os alimentos preferidos do alvo na Pokédex do jogo.');
    result.tips.push('Use a aproximação furtiva descrita no guia de Hisui. Não aplique aqui as regras de Quick Ball, Dusk Ball ou turnos dos jogos tradicionais.');
    result.sources.push(captureSources.arceus); return result;
  }
  if (game.id.startsWith('lets-go-')) {
    addBall('Ultra Ball','Uma opção de captura quando já estiver disponível no inventário.');
    result.best='Ultra Ball com uma Razz Berry';
    result.items.push('Razz Berry ou Golden Razz Berry ajudam na captura.');
    result.tips.push('Use o sistema de arremesso de Let’s Go. A preparação por False Swipe e status dos jogos tradicionais não se aplica às capturas comuns.');
    result.sources.push(captureSources.letsgo); return result;
  }
  if (!standardGames.has(game.id) || /max-raid|dynamax-adventure/.test(encounter?.method || '')) {
    result.tips.push('Este jogo ou modalidade usa regras próprias que ainda não foram revisadas neste guia. As recomendações tradicionais de bolas e status foram omitidas.');
    return result;
  }
  if (/safari/i.test((encounter?.location || '')+' '+(encounter?.area || '')+' '+(encounter?.area_slug || ''))) {
    addBall('Safari Ball','Use a bola fornecida pela própria Safari Zone.');
    result.best='Safari Ball';
    result.tips.push('A Safari Zone tem regras próprias. Não aplique a rotina de enfraquecer o alvo com seus golpes; confira as regras de fuga, isca e pedras deste jogo.');
    result.sources.push(captureSources.balls); return result;
  }
  result.standard=true;
  const generation = game.generation, types = historicalTypes(pokemon,generation), stage = situation.stage || 'opening';
  if (generation>=7 && new Set([793,794,795,796,797,798,799,803,804,805,806]).has(pokemon.species_id)) {
    addBall('Beast Ball','Foi criada para Ultra Beasts. As bolas comuns recebem uma penalidade especial contra esses alvos.');
    result.best='Beast Ball'; result.sources.push(captureSources.beast);
  } else if (generation===1) {
    result.best='Compare Great Ball e Ultra Ball';
    addBall('Great Ball / Ultra Ball','Na geração I, a melhor escolha também depende de HP e status; Ultra Ball não é sempre superior.');
  } else {
    if (generation>=4 && stage==='opening') addBall('Quick Ball','Tente no primeiro turno, antes de preparar o alvo.');
    if (generation>=3 && stage==='long') addBall('Timer Ball','Fica mais adequada conforme a batalha se prolonga; o ritmo do bônus muda entre gerações.');
    if (generation>=4 && (situation.night || situation.cave)) addBall('Dusk Ball','Vantagem em capturas noturnas ou em cavernas, conforme as regras desta versão.');
    if (generation>=3 && (types.includes('water') || types.includes('bug'))) addBall('Net Ball','Adequada ao tipo Water ou Bug deste Pokémon nesta geração.');
    addBall('Ultra Ball','Opção geral quando nenhuma condição de bola especializada está ativa.');
    result.best=result.balls[0].name;
  }
  result.tips.push('Reduza o HP sem nocautear o alvo. Sono ou paralisia podem facilitar a captura; evite dano contínuo de veneno e queimadura.');
  if (generation>=2) result.tips.push(types.includes('ghost')
    ? 'False Swipe é do tipo Normal e normalmente não acerta este alvo Ghost. Prepare uma alternativa compatível antes de tentar deixá-lo com 1 HP.'
    : 'Um parceiro com False Swipe ajuda a reduzir o HP sem dar o golpe final. Confira se esse parceiro aprende o golpe no jogo escolhido.');
  if (generation>=6 && types.includes('grass')) result.tips.push('Alvos Grass são imunes a golpes de pó nesta geração; não dependa de Spore ou Sleep Powder.');
  if (generation>=6 && types.includes('electric')) result.tips.push('Alvos Electric não podem ser paralisados nesta geração. Prepare outro método, como sono, se funcionar contra o alvo.');
  const gear = {
    'old-rod':'Old Rod','good-rod':'Good Rod','super-rod':'Super Rod','super-rod-spots':'Super Rod',
    'feebas-tile-fishing':'A vara de pesca compatível e o ponto especial de Feebas indicado pelo jogo',
    surf:'Surf ou o recurso de travessia equivalente deste jogo','surf-spots':'Surf e os pontos de água indicados',
    'rock-smash':'Rock Smash','headbutt':'Headbutt','headbutt-low':'Headbutt','headbutt-normal':'Headbutt','headbutt-high':'Headbutt',
    pokeflute:'Poké Flute','squirt-bottle':'SquirtBottle','wailmer-pail':'Wailmer Pail','devon-scope':'Devon Scope',
    'honey-tree':'Honey e acesso às árvores de mel',
  }[encounter?.method];
  if (gear) result.items.push('Para acessar este encontro: '+gear+'.');
  result.items.push('Leve estoque das bolas escolhidas e itens de cura para manter seu parceiro de captura em campo. Itens de cura não aumentam a chance da bola.');
  result.tips.push('A recomendação considera o cenário informado, não garante captura nem a venda da bola em qualquer ponto da campanha. Regras de eventos e encontros especiais podem mudar o resultado.');
  result.sources.push(captureSources.battle,captureSources.balls);
  return result;
}
