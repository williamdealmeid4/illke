import { addWalkthrough } from './walkthrough.js';
import { captureGuide } from './capture.js';
import { getGame } from '../games.js';
import itemLocations from './item-locations.json' with { type: 'json' };
const cache = new Map();
const pending = new Map();
const TTL = 24 * 60 * 60 * 1000;
export async function poke(path) {
  // Only fixed PokéAPI resource paths can reach the upstream; never accept a URL.
  if (!/^(pokemon|item|machine)\/[a-z0-9-]+(?:\/encounters)?$/.test(path)) throw new Error('Recurso inválido');
  const hit = cache.get(path);
  if (hit && hit.expires > Date.now()) return hit.value;
  if (pending.has(path)) return pending.get(path);
  const task = (async () => {
    const response = await fetch('https://pokeapi.co/api/v2/'+path, { signal: AbortSignal.timeout(8000), redirect:'error' });
    if (!response.ok) throw new Error('A fonte de localizações está indisponível.');
    const value = await response.json();
    if (cache.size >= 400) cache.delete(cache.keys().next().value);
    cache.set(path, { value, expires:Date.now()+TTL });
    return value;
  })();
  pending.set(path,task);
  try { return await task; } finally { pending.delete(path); }
}
const methods = {
 walk:'Caminhar na grama ou caverna', surf:'Usar Surf', 'old-rod':'Pescar com Old Rod',
 'good-rod':'Pescar com Good Rod','super-rod':'Pescar com Super Rod','rock-smash':'Quebrar pedras com Rock Smash',
 'headbutt':'Usar Headbutt nas árvores','headbutt-low':'Headbutt em árvores baixas','headbutt-high':'Headbutt em árvores altas',
 'gift':'Receber de presente','gift-egg':'Receber um ovo','only-one':'Encontro único','pokeflute':'Usar a Poké Flute',
 'yellow-flowers':'Caminhar nas flores amarelas','purple-flowers':'Caminhar nas flores roxas','red-flowers':'Caminhar nas flores vermelhas',
 'rough-terrain':'Caminhar no terreno irregular','dark-grass':'Caminhar na grama escura','grass-spots':'Investigar grama que se move',
 'cave-spots':'Investigar poeira na caverna','bridge-spots':'Investigar sombras na ponte','super-rod-spots':'Pescar na água agitada',
};
const conditions = {'time-morning':'Manhã','time-day':'Dia','time-night':'Noite','swarm-yes':'Durante uma swarm','swarm-no':'Sem swarm','radar-on':'Com Poké Radar','radar-off':'Sem Poké Radar','season-spring':'Primavera','season-summer':'Verão','season-autumn':'Outono','season-winter':'Inverno'};
export const humanize = value => value.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
export function encounterHints(rows, version, prefix='') {
 return rows.flatMap(row => {
  const match=row.version_details.find(v=>v.version.name===version);
  if (!match) return [];
  return match.encounter_details.map((detail,i)=>({
   id: prefix+row.location_area.name+'-'+i,
   area: row.location_area.name,
   title:humanize(row.location_area.name),
   methodId:detail.method.name, method:methods[detail.method.name] || humanize(detail.method.name),
   min:detail.min_level,max:detail.max_level,chance:detail.chance,
   conditions: detail.condition_values.map(c=>conditions[c.name] || humanize(c.name)),
  }));
 });
}
async function rawGuide(entry, gameId) {
 const game=getGame(gameId);
 if (!game || !['pokemon','item'].includes(entry.kind)) return null;
 const base={game, pokemon:entry.kind==='pokemon'?{generation:entry.generation,species_id:entry.national_number,types:entry.attributes?.types || []}:null, hints:[],held:[],machines:[],source:'https://pokeapi.co/docs/v2/'};
 if (!game.version) return {...base, status:'unsupported', message:game.status==='announced' ? 'Jogo anunciado: locais e encontros ainda não foram publicados.' : 'Este título está no catálogo. A fonte ainda não oferece encontros e locais de itens para ele.'};
 const localGame=game.id==='leafgreen'?'firered':game.id;
 const localHints=entry.kind==='item' ? itemLocations.items[localGame]?.[entry.slug] || [] : [];
 try {
  if (entry.kind==='pokemon') {
   const snapshot=await captureGuide(entry);
   if (snapshot.available) {
    const hints=snapshot.pokemon.encounters.filter(h=>h.game===game.version).map((h,i)=>({id:h.area_id+'-'+i,area:h.location.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+h.area_slug,title:h.location+' — '+h.area,method:h.method_label,methodId:h.method,min:h.min_level,max:h.max_level,chance:h.encounter_rate,conditions:h.conditions}));
    return {...base,pokemon:snapshot.pokemon,hints,status:hints.length?'ready':'empty',source:snapshot.source,message:hints.length?'Locais registrados para esta versão.':'Nenhum encontro registrado nesta fonte. Evolução, troca, presentes, eventos e transferências podem ser alternativas; a ausência de registros não comprova indisponibilidade.'};
   }
   const id=String(entry.attributes.pokeapi_id || entry.slug);
   const rows=await poke('pokemon/'+id+'/encounters');
   const hints=encounterHints(rows,game.version);
   return {...base,hints,status:hints.length?'ready':'empty',message:hints.length?'Locais registrados para esta versão.':'Nenhum encontro foi registrado nesta versão. Isso não comprova ausência: evolução, troca, transferência, eventos e dados incompletos podem explicar a lacuna.'};
  }
  const item=await poke('item/'+entry.slug);
  const held=item.held_by_pokemon.flatMap(p=>{
   const detail=p.version_details.find(v=>v.version.name===game.version);
   return detail?[{pokemon:p.pokemon.name,chance:detail.rarity}]:[];
  });
  // Bounded fan-out prevents expensive item pages; show the full carrier list even when maps are sampled.
  const locations=await Promise.allSettled(held.slice(0,6).map(async p=>encounterHints(await poke('pokemon/'+p.pokemon+'/encounters'),game.version,p.pokemon+'-').map(h=>({...h,carrier:p.pokemon,itemChance:p.chance}))));
  const hints=[...localHints,...locations.flatMap(r=>r.status==='fulfilled'?r.value:[])];
  const machines=item.machines.filter(m=>m.version_group.name===game.group).map(m=>({version:humanize(m.version_group.name),id:Number(m.machine.url.match(/\/(\d+)\/$/)?.[1])}));
  return {...base,held,machines,hints,status:hints.length||held.length||machines.length?'ready':'empty',partial:held.length>6||locations.some(r=>r.status==='rejected'),message:localHints.length ? 'Itens no cenário confirmados nos dados dos mapas. Confira o andar e a posição na descrição de cada pista.' : 'Consulte os portadores e locais registrados abaixo. A cobertura de lojas, presentes e itens no cenário é parcial; uma lista vazia não comprova ausência no jogo.'};
 } catch { return {...base,hints:localHints,status:localHints.length?'ready':'error',message:localHints.length?'Pistas locais disponíveis. Não foi possível consultar os portadores online.':'Não foi possível consultar as pistas agora. Tente novamente em alguns instantes.'}; }
}

export async function loadGuide(entry, gameId) {
 return addWalkthrough(await rawGuide(entry,gameId),entry);
}
