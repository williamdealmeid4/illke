import { readApi } from './api.js';

const stats = value => Object.fromEntries(['hp','atk','def','spa','spd','spe'].map(stat => [stat, value]));

export function emptyBuild(context = 'gen9ou') {
  return {
    name: 'Minha build', nickname: '', pokemon: '', context_id: context, level: 100,
    nature: 'Serious', ability: '', item: '', moves: [], evs: stats(0), ivs: stats(31),
    tera_type: '', role: 'unclassified', strategy: '', visibility: 'private',
  };
}

export async function referenceBuilds(fetch, pokemon, context) {
  const result = await readApi(fetch, '/builds?' + new URLSearchParams({ q: pokemon, context_id: context }));
  return result.data.filter(build => build.pokemon.toLowerCase() === pokemon.toLowerCase() &&
    build.source_key && build.legality === 'legal' && build.source_active !== false);
}
