import {load} from 'cheerio';
export const gameGroups={
 'red-blue':['Pokémon Red and Blue Versions'], 'yellow':['Pokémon Yellow Version'],
 'red-green':['Pokémon Red and Green Versions'],'gold-silver':['Pokémon Gold and Silver Versions'],
 'crystal':['Pokémon Crystal Version'],'ruby-sapphire':['Pokémon Ruby and Sapphire Versions'],
 'emerald':['Pokémon Emerald Version'],'firered-leafgreen':['Pokémon FireRed and LeafGreen Versions'],
 'diamond-pearl':['Pokémon Diamond and Pearl Versions'],'platinum':['Pokémon Platinum Version'],
 'heartgold-soulsilver':['Pokémon HeartGold and SoulSilver Versions'],'black-white':['Pokémon Black and White Versions'],
 'black-2-white-2':['Pokémon Black and White Versions 2'],'x-y':['Pokémon X and Y'],
 'omega-ruby-alpha-sapphire':['Pokémon Omega Ruby and Alpha Sapphire'], 'sun-moon':['Pokémon Sun and Moon'],
 'ultra-sun-ultra-moon':['Pokémon Ultra Sun and Ultra Moon'],
 'lets-go-pikachu-lets-go-eevee':["Pokémon: Let's Go, Pikachu! and Let's Go, Eevee!"],
 'sword-shield':['Pokémon Sword and Shield'],'brilliant-diamond-shining-pearl':['Pokémon Brilliant Diamond and Shining Pearl'],
 'legends-arceus':['Pokémon Legends: Arceus'],'scarlet-violet':['Pokémon Scarlet and Violet'],
 'legends-za':['Pokémon Legends: Z-A'],
};
export function pokemonLocations(html){
 const $=load(html),heading=$('h2').filter((_,e)=>$(e).text().startsWith('Where to find')).first();
 const table=heading.nextAll().find('table').first();const result={};
 table.find('tr').each((_,row)=>{
  const cell=$(row).children('td').first();const text=cell.text().replace(/\s+/g,' ').trim();
  const links=cell.find('a[href^="/location/"]').map((_,a)=>({name:$(a).text(),slug:$(a).attr('href').split('/').at(-1)})).get();
  $(row).find('th .igame').each((_,span)=>{
   let game=$(span).attr('class').split(' ').find(c=>c!=='igame');if(game==='legends-z-a')game='legends-za';
   if(['winds','waves'].includes(game))return;
   const status=/not available in this game/i.test(text)?'absent':/not yet available/i.test(text)?'unknown':/trade|migrate|transfer/i.test(text)?'transfer':text?'present':'unknown';
   // Keep factual place names; do not redistribute guide prose.
   result[game]={status,locations:links,...(!links.length&&status==='present'?{method:text}:{} )};
  });
 });return result;
}
export function itemAcquisition(html,games,{machine=false}={}){
 const $=load(html);const heading=$('#Acquisition').closest('h2,h3,h4');
 const table=machine?$('table').filter((_,t)=>$(t).find('th').toArray().some(h=>$(h).text().trim()==='Location')):heading.nextAll('table').first();const result={};
 table.find('tr').each((_,tr)=>{
  const cells=$(tr).children('td');if(cells.length<2||$(tr).find('table').length)return;
  const titles=cells.eq(0).find('a').map((_,a)=>$(a).attr('title')).get();
  for(const game of games){
   if(game.status==='announced')continue;
   const names=gameGroups[game.group]||[game.name];
   if(!names.some(name=>titles.includes(name)))continue;
   const methods=[];
   (machine?cells.slice(1,2):cells.slice(1)).each((i,cell)=>{
    const places=$(cell).find('a').filter((_,a)=>!$(a).closest('sup').length).map((_,a)=>({name:$(a).text().trim(),title:$(a).attr('title')||''})).get().filter(x=>x.name);
    if(places.length)methods.push({type:i===0?'finite':'repeatable',places});
   });
   if(methods.length)result[game.id]={status:'present',methods};
  }
 });return result;
}
