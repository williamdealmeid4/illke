import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
const root=new URL('../',import.meta.url),path=new URL('apps/web/src/lib/server/research-index.json',root);
const data=JSON.parse(await readFile(path,'utf8'));
const catalog=JSON.parse(await readFile(new URL('.data/catalog.json',root),'utf8'));
const roman={I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10};let total=0;
for(const entry of catalog.entities.filter(e=>e.kind==='item'&&data.item[e.slug])){
 const url='https://bulbapedia.bulbagarden.net/w/api.php?'+new URLSearchParams({action:'parse',page:entry.name,prop:'text',format:'json',redirects:'1'});
 try{const j=JSON.parse(await readFile(new URL('.data/research-cache/'+createHash('sha256').update(url).digest('hex')+'.txt',root),'utf8'));
 const $=load(j.parse.text['*']);const match=$('table').first().text().match(/Introduced in Generation\s+([IVX]+)\b/);
 if(match){data.item[entry.slug].introduced=roman[match[1]];total++;}
 }catch{}
}
await writeFile(path,JSON.stringify(data));console.log('Source-confirmed item introductions',total);
