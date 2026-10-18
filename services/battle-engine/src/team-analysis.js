import { createRequire } from 'node:module';
import { getContext } from './contexts.js';
import { stats, validateTeam, versions } from './domain.js';
const require = createRequire(import.meta.url);
const { Dex } = require('pokemon-showdown');
const id = Dex.toID;

export function analyzeTeam({ builds }) {
  const validation = validateTeam(builds);
  const context = getContext(builds[0].context_id);
  const dex = Dex.forFormat(context.format);
  const known = builds.map((build,index) => ({ build,index,species:dex.species.get(build.pokemon) })).filter(x=>x.species.exists);
  const observations = [];
  const types = dex.types.all().filter(t => t.exists && !['Stellar','???'].includes(t.name));
  const type_profile = types.map(type => {
    const weak=[],resist=[],immune=[];
    for (const {species,build} of known) {
      if (!dex.getImmunity(type.name,species.types)) immune.push(build.pokemon);
      else { const effect=dex.getEffectiveness(type.name,species.types); if(effect>0) weak.push(build.pokemon); if(effect<0) resist.push(build.pokemon); }
    }
    if(weak.length>=3) observations.push({code:'SHARED_WEAKNESS',severity:'observation',title:'Fraqueza compartilhada a '+type.name,message:`${weak.join(', ')} são fracos por tipagem. ${resist.length+immune.length ? 'Confira se suas respostas conseguem entrar em campo.' : 'Não há resistência ou imunidade por tipagem na equipe.'}`});
    return {type:type.name,weak,resist,immune};
  });
  const moves=builds.flatMap(b=>(b.moves||[]).filter(Boolean).map(id));
  const resources = {
    hazards: moves.filter(m=>['stealthrock','spikes','toxicspikes','stickyweb'].includes(m)),
    removal: moves.filter(m=>['rapidspin','defog','mortalspin','tidyup','courtchange'].includes(m)),
    speed_control: moves.filter(m=>['tailwind','trickroom','thunderwave','icywind','electroweb','stickyweb','glare'].includes(m)),
    recovery: moves.filter(m=>dex.moves.get(m).heal),
    weather: [...moves.filter(m=>['sunnyday','raindance','sandstorm','snowscape','hail'].includes(m)),...builds.map(b=>id(b.ability)).filter(a=>['drought','drizzle','sandstream','snowwarning'].includes(a))],
  };
  for(const [key,label] of [['hazards','colocação de hazards'],['removal','remoção de hazards'],['speed_control','controle de velocidade'],['recovery','recuperação direta']]) {
    observations.push({code:'RESOURCE_'+key.toUpperCase(),severity:'info',title:resources[key].length?'Recurso identificado: '+label:'Sem '+label+' identificada',message:resources[key].length?resources[key].map(m=>dex.moves.get(m).name).join(', '):'Isso não torna a equipe inválida. Verifique se sua estratégia precisa desse recurso e quais escolhas compensam a ausência.'});
  }
  const dependent=builds.filter(b=>['chlorophyll','swiftswim','sandrush','slushrush','solarpower'].includes(id(b.ability)));
  if(dependent.length) observations.push({code:'WEATHER_DEPENDENCY',severity:'observation',title:'Habilidades dependentes de clima',message:dependent.map(b=>b.pokemon).join(', ')+(resources.weather.length?' possuem suporte de clima identificado; confira a duração e os matchups.':' não têm ativador de clima identificado nesta equipe.')});
  const categories=new Set(moves.map(m=>dex.moves.get(m).category));
  const offensive_coverage=types.map(target=>({type:target.name,super_effective_moves:moves.filter(move=>{const data=dex.moves.get(move);return data.category!=='Status'&&dex.getImmunity(data.type,[target.name])&&dex.getEffectiveness(data.type,[target.name])>0;}).map(move=>dex.moves.get(move).name)}));
  if(!categories.has('Physical')||!categories.has('Special')) observations.push({code:'DAMAGE_CATEGORY',severity:'observation',title:'Dano concentrado em uma categoria',message:'Confira como sua equipe pressiona defensores preparados para a categoria predominante. Isso depende dos adversários e da estratégia.'});
  const speed_tiers=known.map(({build,index})=>{try{return {slot:index,pokemon:build.pokemon,speed:stats(build).spe};}catch{return {slot:index,pokemon:build.pokemon,speed:null};}}).sort((a,b)=>(b.speed||0)-(a.speed||0));
  return {context,versions,validation,type_profile,offensive_coverage,resources,speed_tiers,roles:builds.map(b=>({pokemon:b.pokemon,role:b.role})),observations,
    limitations:['Resistências consideram tipagem; habilidades, itens, campo e transformações podem alterar o resultado.','Velocidades são calculadas sem boosts ou efeitos de campo.','Presença de funções não mede qualidade, sinergia ou chance de vitória.']};
}
