import { readFile, writeFile, rename } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parse } from 'csv-parse/sync';
import { buildCaptureData } from './lib/capture-data.mjs';

const root = new URL('../.data/', import.meta.url);
export async function syncCapture() {
  const catalog = JSON.parse(await readFile(new URL('catalog.json', root), 'utf8'));
  const revision = catalog.revision;
  if (!/^[a-f0-9]{40}$/.test(revision)) throw Error('Importe um catálogo real antes de sincronizar os encontros.');
  const tables = {};
  const tableNames = ['pokemon','pokemon_species','pokemon_forms','pokemon_types','pokemon_types_past','types',
    'versions','version_groups','version_names','encounters','encounter_slots','encounter_methods','encounter_method_prose',
    'encounter_condition_value_map','encounter_condition_value_prose','location_areas','location_area_prose','locations','location_names'];
  await Promise.all(tableNames.map(async name=>{
    const path = new URL(name+'-'+revision+'.csv',root);
    let content = await readFile(path,'utf8').catch(()=>null);
    if (content === null) {
      const response = await fetch('https://raw.githubusercontent.com/PokeAPI/pokeapi/'+revision+'/data/v2/csv/'+name+'.csv',{signal:AbortSignal.timeout(120000)});
      if (!response.ok) throw Error('Falha ao importar '+name+': HTTP '+response.status);
      content = await response.text();
      await writeFile(path,content);
    }
    tables[name] = parse(content,{columns:true,skip_empty_lines:true});
  }));
  const data = buildCaptureData(tables,revision);
  if (!Object.values(data.pokemon).some(pokemon=>pokemon.encounters.length)) throw Error('Nenhum encontro importado; o guia anterior foi preservado.');
  await writeFile(new URL('capture-guide.tmp.json',root),JSON.stringify(data));
  await rename(new URL('capture-guide.tmp.json',root),new URL('capture-guide.json',root));
  console.log('Guia de captura: '+data.games.filter(game=>game.records).length+'/'+data.games.length+' jogos com encontros registrados.');
  return data;
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await syncCapture();
