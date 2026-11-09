/** Reproducible factual location index with per-record sources. */
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {games} from '../apps/web/src/lib/games.js';
import {pokemonLocations,itemAcquisition} from '../apps/web/src/lib/server/research-parser.js';
const root=new URL('../',import.meta.url),cache=new URL('.data/research-cache/',root);
await mkdir(cache,{recursive:true});
const out=new URL('apps/web/src/lib/server/research-index.json',root);
let result;try{result=JSON.parse(await readFile(out,'utf8'));}catch{result={pokemon:{},item:{},games:{}};}
const catalog=JSON.parse(await readFile(new URL('.data/catalog.json',root),'utf8'));
async function get(url){
 const path=new URL(createHash('sha256').update(url).digest('hex')+'.txt',cache);
 try{return await readFile(path,'utf8');}catch{}
 const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);
 const text=await r.text();await writeFile(path,text);return text;
}
async function checkpoint(){await writeFile(new URL(out.href+'.tmp'),JSON.stringify(result));await rename(new URL(out.href+'.tmp'),out);}
const pokemon=catalog.entities.filter(e=>e.kind==='pokemon'&&e.attributes.is_default);
// Research inventory items with existing descriptions; machine mapping is imported separately.
const items=catalog.entities.filter(e=>e.kind==='item'&&e.attributes.effect&&!/^([th]m|tr)\d/.test(e.slug));
const tasks=[...pokemon.map(entry=>({entry,kind:'pokemon'})),...items.map(entry=>({entry,kind:'item'}))];
let done=0,failed=0;
async function worker(){while(tasks.length){const {entry,kind}=tasks.shift();if(result[kind][entry.slug])continue;
 try{
  const source=kind==='pokemon'?'https://pokemondb.net/pokedex/'+entry.slug:'https://bulbapedia.bulbagarden.net/wiki/'+encodeURIComponent(entry.name);
  let data;
  if(kind==='pokemon')data=pokemonLocations(await get(source));
  else {const j=JSON.parse(await get('https://bulbapedia.bulbagarden.net/w/api.php?'+new URLSearchParams({action:'parse',page:entry.name,prop:'text',format:'json',redirects:'1'})));if(!j.parse)throw Error('Page missing');data=itemAcquisition(j.parse.text['*'],games);}
  if(Object.keys(data).length)result[kind][entry.slug]={games:data,source,checked:new Date().toISOString().slice(0,10)};
 }catch{failed++;}
 done++;if(done%100===0)console.log('Researched',done,'failures',failed);
}}
// Small warm-up makes the requested examples reviewable immediately.
tasks.sort((a,b)=>Number(['squirtle','max-revive','bulbasaur','pikachu'].includes(b.entry.slug))-Number(['squirtle','max-revive','bulbasaur','pikachu'].includes(a.entry.slug)));
await Promise.all(Array.from({length:4},worker));
result.stats={pokemon:Object.keys(result.pokemon).length,items:Object.keys(result.item).length,failed,updated:new Date().toISOString()};
await checkpoint();console.log(result.stats);
