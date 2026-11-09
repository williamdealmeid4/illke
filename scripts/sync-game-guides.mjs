import {readFile,writeFile} from 'node:fs/promises';
import {load} from 'cheerio';
import {games} from '../apps/web/src/lib/games.js';
import {gameGroups} from '../apps/web/src/lib/server/research-parser.js';
const root=new URL('../',import.meta.url),covers=JSON.parse(await readFile(new URL('apps/web/src/lib/game-covers.json',root),'utf8'));
const result={};const pending=new Map();
const aliases={'extra-pokedex-3d':'Pokédex 3D','extra-pokeland':'Pokémon Rumble Rush','extra-camp':'Camp Pokémon','extra-pokerom':'PokéROM','extra-pokemon-project-studio-red':'Pokémon Project Studio Red and Blue','extra-pokemon-project-studio-blue':'Pokémon Project Studio Red and Blue'};
async function page(title){if(pending.has(title))return pending.get(title);const task=(async()=>{const r=await fetch('https://bulbapedia.bulbagarden.net/w/api.php?'+new URLSearchParams({action:'parse',page:title,prop:'text',format:'json',redirects:'1'}),{signal:AbortSignal.timeout(15000)});const j=await r.json();if(!j.parse)return null;const $=load(j.parse.text['*']);return {title:j.parse.title,source:'https://bulbapedia.bulbagarden.net/wiki/'+encodeURIComponent(j.parse.title),sections:$('h2,h3').map((_,e)=>$(e).text().replace('[edit]','').trim()).get().filter(t=>!/Contents|Trivia|languages|References|External links/.test(t)),guides:[...new Set($('a[href]').map((_,e)=>$(e).attr('href')).get().filter(h=>h.startsWith('/wiki/Appendix:')||/strategywiki.org/.test(h)).map(h=>h.startsWith('/')?'https://bulbapedia.bulbagarden.net'+h:h))].slice(0,20),checked:new Date().toISOString().slice(0,10)};})();pending.set(title,task);return task;}
const queue=games.filter(g=>g.status!=='announced');let done=0;
async function worker(){while(queue.length){const g=queue.shift();let title=aliases[g.id]||gameGroups[g.group]?.[0]||g.name;
 if(covers[g.id]?.origin.includes('bulbapedia.bulbagarden.net/wiki/'))title=decodeURIComponent(covers[g.id].origin.split('/wiki/')[1]);
 try{const record=await page(title);result[g.id]=record||{title:g.name,source:null,sections:[],guides:[],status:'unresolved'};}catch{result[g.id]={title:g.name,source:null,sections:[],guides:[],status:'unresolved'};}
 if(++done%50===0)console.log('Games researched',done);
}}
await Promise.all(Array.from({length:4},worker));await writeFile(new URL('apps/web/src/lib/server/game-guide-sources.json',root),JSON.stringify(result));console.log('Verified game source pages',Object.values(result).filter(r=>r.source).length,'unresolved',Object.entries(result).filter(([,r])=>!r.source).map(([id])=>id));
