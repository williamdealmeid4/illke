import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Dex } = require('pokemon-showdown');
const first = value => Array.isArray(value) ? value[0] : value;

export function referenceSet(pokemon, alternatives, generation) {
  const species = Dex.forGen(generation).species.get(pokemon);
  const abilities = [...new Set(Object.values(species.abilities || {}))];
  const training = first(alternatives.evs);
  const ivs = first(alternatives.ivs);
  return {
    species: pokemon, name: '', level: 100,
    item: generation >= 2 ? first(alternatives.item) || '' : '',
    ability: generation >= 3 ? first(alternatives.ability) || (abilities.length === 1 ? abilities[0] : '') : '',
    nature: generation >= 3 ? first(alternatives.nature) || 'Serious' : 'Serious',
    moves: (alternatives.moves || []).map(first),
    evs: Object.fromEntries(['hp','atk','def','spa','spd','spe'].map(s => [s, training?.[s] ?? (generation <= 2 ? 252 : 0)])),
    ivs: Object.fromEntries(['hp','atk','def','spa','spd','spe'].map(s => [s, ivs?.[s] ?? 31])),
    teraType: generation === 9 ? first(alternatives.teratypes) || undefined : undefined,
  };
}

export function describeReference(name, set, generation) {
  const dex=Dex.forGen(generation), moves=set.moves.map(move=>dex.moves.get(move));
  const physical=moves.filter(m=>m.category==='Physical'),special=moves.filter(m=>m.category==='Special');
  let role='unclassified';
  if(/trick room|tailwind|defog|rapid spin/i.test(name)) role='control';
  else if(/swords dance|dragon dance|nasty plot|calm mind|bulk up|quiver dance/i.test(name)) role='setup';
  else if(/defensive|wall|tank/i.test(name)) role='wall';
  else if(/support|utility|setter/i.test(name)) role='support';
  else if(physical.length && set.evs.atk>set.evs.spa) role='physical-attacker';
  else if(special.length && set.evs.spa>set.evs.atk) role='special-attacker';
  const lines=['Referência '+name+' para '+set.species+' em geração '+generation+' OU.'];
  const status=moves.filter(m=>m.category==='Status');
  if(physical.length||special.length)lines.push('Golpes de dano: '+[...physical,...special].map(m=>m.name).join(', ')+'.');
  if(status.length)lines.push('Recursos de status: '+status.map(m=>m.name+': '+(m.shortDesc||m.desc||'consulte a ficha do golpe')).join(' | '));
  if(set.item){const item=dex.items.get(set.item);lines.push('Item — '+item.name+': '+(item.desc||'consulte as propriedades do item.'));}
  if(set.ability){const ability=dex.abilities.get(set.ability);lines.push('Habilidade — '+ability.name+': '+(ability.desc||'consulte a ficha da habilidade.'));}
  lines.push('Os parceiros e matchups desta referência ainda não foram revisados editorialmente. Use o diagnóstico da equipe e a calculadora antes de adaptar.');
  return {role,strategy:lines.join('\n\n')};
}
