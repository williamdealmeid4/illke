export const abilityCategories = [
  {id:'field', label:'Campo e clima', icon:'CloudSun', pattern:/\b(weather|rain|rain dance|sunny|sunlight|sandstorm|snow|hail|terrain)\b/i},
  {id:'healing', label:'Recuperação', icon:'HeartPulse', pattern:/restores|regains|heals|cured|recover/i},
  {id:'defense', label:'Defensiva', icon:'Shield', pattern:/immune|cannot be|damage.*reduced|critical hit|prevents.*lowering/i},
  {id:'stats', label:'Velocidade e atributos', icon:'Gauge', pattern:/speed|stat stage|attack.*multiplied|defense.*multiplied|accuracy/i},
  {id:'control', label:'Controle', icon:'Eye', pattern:/switch|redirect|flinch|confus|taunt|trap/i},
  {id:'offense', label:'Ofensiva', icon:'Swords', pattern:/power|damage|attacks|contact/i},
  {id:'utility', label:'Utilidade', icon:'Sparkles', pattern:/.+/},
  {id:'unknown', label:'Sem classificação', icon:'CircleHelp', pattern:/$^/},
];
export function classifyAbility(effect='') {
  const primary=effect.trim().split(/\.\s/)[0];
  return abilityCategories.find(c=>c.pattern.test(primary)) || abilityCategories.at(-1);
}
