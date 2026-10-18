import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
let cached, modified, cachedPath;

export async function captureGuide(entry) {
  try {
    const paths = process.env.ILLKE_DATA_DIR ? [resolve(process.env.ILLKE_DATA_DIR,'capture-guide.json')] :
      [resolve(process.cwd(),'.data/capture-guide.json'),resolve(process.cwd(),'../../.data/capture-guide.json')];
    let file;
    for (const path of paths) {
      const info = await stat(path).catch(()=>null);
      if (info) { file={path,stamp:info.mtimeMs}; break; }
    }
    if (!file) throw Error('Guia não importado.');
    if (!cached || file.stamp !== modified || file.path !== cachedPath) {
      cached=JSON.parse(await readFile(file.path,'utf8')); modified=file.stamp; cachedPath=file.path;
    }
    if (cached.revision !== entry.revision) return {available:false, reason:'O guia está sendo atualizado para a revisão deste catálogo.'};
    const pokemon = cached.pokemon[entry.attributes?.pokeapi_id || entry.national_number];
    if (!pokemon) return {available:false, reason:'Esta forma ainda não tem um registro no guia de captura.'};
    return {available:true, pokemon, games:cached.games, source:cached.source, revision:cached.revision};
  } catch {
    return {available:false, reason:'O guia de encontros ainda não foi importado nesta instalação.'};
  }
}
