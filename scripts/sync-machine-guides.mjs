import {readFile,writeFile} from 'node:fs/promises';
import {games} from '../apps/web/src/lib/games.js';
import {itemAcquisition} from '../apps/web/src/lib/server/research-parser.js';
const root=new URL('../',import.meta.url),out=new URL('apps/web/src/lib/server/machine-guides.json',root);
const index=JSON.parse(await readFile(new URL('apps/web/src/lib/server/machine-index.json',root),'utf8'));
const items=[...new Set(index.machines.map(m=>m.item))].filter(Boolean);const result={};let done=0;
async function worker(){while(items.length){const item=items.shift();try{
 const source='https://bulbapedia.bulbagarden.net/wiki/'+item.toUpperCase();
 const r=await fetch('https://bulbapedia.bulbagarden.net/w/api.php?'+new URLSearchParams({action:'parse',page:item.toUpperCase(),prop:'text',format:'json',redirects:'1'}),{signal:AbortSignal.timeout(15000)});const j=await r.json();
 if(j.parse){const data=itemAcquisition(j.parse.text['*'],games,{machine:true});if(Object.keys(data).length)result[item]={games:data,source,checked:new Date().toISOString().slice(0,10)};}
 }catch{}if(++done%100===0)console.log('Machines researched',done);}}
await Promise.all(Array.from({length:4},worker));await writeFile(out,JSON.stringify(result));console.log('Machine guide records',Object.keys(result).length);
