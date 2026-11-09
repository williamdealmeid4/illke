/** Download missing catalog artwork from attributed Bulbagarden archive files. */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {games} from '../apps/web/src/lib/games.js';
const root=new URL('../',import.meta.url);
const manifestPath=new URL('apps/web/src/lib/game-covers.json',root);
const records=JSON.parse(await readFile(manifestPath,'utf8'));
const aliases={
 'omega-ruby':'Pokémon Omega Ruby and Alpha Sapphire', 'alpha-sapphire':'Pokémon Omega Ruby and Alpha Sapphire',
 'winds':'Pokémon Winds and Waves','waves':'Pokémon Winds and Waves',
 'extra-stadium-japao':'Pokémon Stadium (Japanese)',
 'extra-stadium':'Pokémon Stadium (English)',
 'extra-colosseum-kakucho-disc':'Pokémon Colosseum Bonus Disc',
 'extra-typing-adventure':'Learn with Pokémon: Typing Adventure',
 'extra-transporter':'Poké Transporter',
 'extra-pokemon-tcg-online':'Pokémon Trading Card Game Online',
 'extra-pokemon-advanced-generation-i-ve-begun-hiragana-and-katakana':'Pokémon Advanced Generation: I’ve Begun Hiragana and Katakana!',
};
const overrides={
 'extra-xd-gale-of-darkness':'File:XD EN boxart.jpg',
 'extra-box-ruby-sapphire':'File:Box RS EN boxart.png',
 'extra-colosseum-kakucho-disc':'File:Colosseum Bonus Disc cover JP.jpg',
 'extra-mystery-dungeon-adventure-squad-fire':'File:PMD KGBAS Title Screen.png',
 'extra-mystery-dungeon-adventure-squad-storm':'File:PMD LGSAS Title Screen.png',
 'extra-mystery-dungeon-adventure-squad-light':'File:PMD GFILAS Title Screen.png',
 'extra-pokedex-3d':'File:Pokédex 3D logo.png',
 'extra-camp':'File:Camp Pokémon.png',
 'extra-pokeland':'File:Pokéland logo.png',
 'extra-pokemon-tcg-online':'File:TCGOlogo.png',
 'extra-pokerom':'File:Pikachu PokéROM disc.png',
 'extra-pokemon-project-studio-red':'File:Project Studio Red EN boxart.png',
 'extra-pokemon-project-studio-blue':'File:Project Studio Blue EN boxart.png',
 'extra-pichu-bros-mini':'File:Pichu Bros mini JP boxart.png',
 'extra-togepi-s-great-adventure':'File:Togepi Great Adventure JP boxart.png',
 'extra-pokemon-advanced-generation-i-ve-begun-hiragana-and-katakana':'File:AG Ive Begun Hiragana and Katakana JP boxart.jpg',
 'extra-ga-ole':'File:Pokémon Ga-Olé logo English.png',
 'extra-battrio':'File:Pokémon Battrio logo.png',
 'extra-transporter':'File:Poké Transporter logo.png',
};
Object.assign(aliases,{
 'extra-camp':'Camp Pokémon','extra-pokeland':'Pokémon Rumble Rush','extra-pokerom':'PokéROM',
 'extra-pokemon-project-studio-red':'Pokémon Project Studio Red and Blue','extra-pokemon-project-studio-blue':'Pokémon Project Studio Red and Blue',
 'extra-pichu-bros-mini':'Pichu Bros. mini','extra-togepi-s-great-adventure':"Togepi's Great Adventure",
 'extra-pokedex-3d':'Pokédex 3D','extra-box-ruby-sapphire':'Pokémon Box Ruby & Sapphire',
 'extra-mystery-dungeon-adventure-squad-fire':'Pokémon Mystery Dungeon (WiiWare)',
 'extra-mystery-dungeon-adventure-squad-storm':'Pokémon Mystery Dungeon (WiiWare)',
 'extra-mystery-dungeon-adventure-squad-light':'Pokémon Mystery Dungeon (WiiWare)',
});
async function api(params){const r=await fetch('https://bulbapedia.bulbagarden.net/w/api.php?'+new URLSearchParams({format:'json',...params}),{signal:AbortSignal.timeout(20000)});return r.json();}
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/pok[eé]mon|file:|project|\.(png|jpg|jpeg)$/gi,'').replace(/[^a-z0-9]/g,'');
async function lookup(game){
 const title=aliases[game.id]||game.name;
 if(overrides[game.id])return {game,title,file:overrides[game.id]};
 const j=await api({action:'query',titles:title,redirects:'1',prop:'images',imlimit:'500'});
 const files=Object.values(j.query.pages)[0].images?.map(i=>i.title)||[];
 const titleKey=normalize(game.name);
 const candidates=files.filter(f=>!(/project|strategywiki|bulbanews|red en boxart|bulbapedia/i.test(f))).map(file=>{
 const key=normalize(file);
 const words=game.name.replace(/Pokémon/g,'').split(/[^a-zA-Z]+/).filter(w=>w.length>3);
 const matches=words.filter(w=>file.toLowerCase().includes(w.toLowerCase())).length;
 return {file,score:(/boxart/i.test(file)?100:/logo/i.test(file)?60:/title/i.test(file)?35:0)+matches*10+(/EN boxart/i.test(file)?10:0),matches};
 }).filter(c=>c.matches>0&&c.score>=35).sort((a,b)=>b.score-a.score);
 const file=overrides[game.id]||candidates[0]?.file;
 console.log(game.id,JSON.stringify(candidates.slice(0,4)));
 return {game,title,file};
}
async function save({game,title,file}){
 if(!file)return;
 const j=await api({action:'query',titles:file,prop:'imageinfo',iiprop:'url'});
 const info=Object.values(j.query.pages)[0].imageinfo?.[0];if(!info)return;
 const response=await fetch(info.url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Download '+response.status);
 const data=Buffer.from(await response.arrayBuffer());
 const png=data.subarray(0,8).toString('hex')==='89504e470d0a1a0a';const jpg=data[0]===255&&data[1]===216;
 if(!png&&!jpg)throw Error('Not a PNG/JPEG');
 const path='covers/'+game.id+(png?'.png':'.jpg');
 await writeFile(new URL('apps/web/static/'+path,root),data);
 records[game.id]={image:'/'+path,source:info.url,origin:'https://bulbapedia.bulbagarden.net/wiki/'+encodeURIComponent(title),kind:/boxart/i.test(file)?'box':/logo/i.test(file)?'logo':'reference-art',sha256:createHash('sha256').update(data).digest('hex')};
}
for(const game of games.filter(g=>!records[g.id])){
 try {await save(await lookup(game));}catch(e){console.log('FAILED',game.id,e.message);}
}
await writeFile(manifestPath,JSON.stringify(records,null,2)+'\n');
await writeFile(new URL('apps/web/static/covers/sources.json',root),JSON.stringify(records,null,2)+'\n');
console.log('Missing:',games.filter(g=>!records[g.id]).map(g=>g.id));
