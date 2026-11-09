import {readFile,writeFile} from 'node:fs/promises';
import {parse} from 'csv-parse/sync';
const root=new URL('../',import.meta.url);
const catalog=JSON.parse(await readFile(new URL('.data/catalog.json',root),'utf8'));
const revision=catalog.revision;
async function csv(name){const r=await fetch(`https://raw.githubusercontent.com/PokeAPI/pokeapi/${revision}/data/v2/csv/${name}.csv`);if(!r.ok)throw Error(name+' '+r.status);return parse(await r.text(),{columns:true,skip_empty_lines:true});}
const [machines,items,moves,groups,indices]=await Promise.all(['machines','items','moves','version_groups','item_game_indices'].map(csv));
const byId=rows=>Object.fromEntries(rows.map(r=>[r.id,r]));const im=byId(items),mm=byId(moves),gm=byId(groups);
const data=machines.map(m=>({group:gm[m.version_group_id]?.identifier,item:im[m.item_id]?.identifier,move:mm[m.move_id]?.identifier,number:Number(m.machine_number)}));
const debut={};for(const row of indices){const slug=im[row.item_id]?.identifier;if(slug)debut[slug]=Math.min(debut[slug]||Infinity,Number(row.generation_id));}
await writeFile(new URL('apps/web/src/lib/server/machine-index.json',root),JSON.stringify({revision,machines:data,itemDebut:debut}));
console.log('Machine assignments',data.length,'item generation evidence',Object.keys(debut).length);
