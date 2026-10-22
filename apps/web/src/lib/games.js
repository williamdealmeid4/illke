export const consoles = {
  gb: 'Game Boy', gbc: 'Game Boy Color', gba: 'Game Boy Advance', ds: 'Nintendo DS',
  '3ds': 'Nintendo 3DS', switch: 'Nintendo Switch', switch2: 'Nintendo Switch 2',
  n64: 'Nintendo 64', gc: 'Nintendo GameCube', wii: 'Wii', wiiu: 'Wii U',
  mobile: 'Android / iOS', pc: 'PC', mini: 'Pokémon mini', pico: 'Sega Pico', arcade: 'Arcade',
};
const rows = [
 ['red|blue|yellow|green','Red|Blue|Yellow|Green','gb','Kanto',1,'red-blue|red-blue|yellow|red-green','rby'],
 ['gold|silver|crystal','Gold|Silver|Crystal','gbc','Johto',2,'gold-silver|gold-silver|crystal','gsc'],
 ['ruby|sapphire|emerald','Ruby|Sapphire|Emerald','gba','Hoenn',3,'ruby-sapphire|ruby-sapphire|emerald','emerald'],
 ['firered|leafgreen','FireRed|LeafGreen','gba','Kanto',3,'firered-leafgreen','frlg'],
 ['diamond|pearl|platinum','Diamond|Pearl|Platinum','ds','Sinnoh',4,'diamond-pearl|diamond-pearl|platinum'],
 ['heartgold|soulsilver','HeartGold|SoulSilver','ds','Johto',4,'heartgold-soulsilver'],
 ['black|white|black-2|white-2','Black|White|Black 2|White 2','ds','Unova',5,'black-white|black-white|black-2-white-2|black-2-white-2'],
 ['x|y','X|Y','3ds','Kalos',6,'x-y'],
 ['omega-ruby|alpha-sapphire','Omega Ruby|Alpha Sapphire','3ds','Hoenn',6,'omega-ruby-alpha-sapphire'],
 ['sun|moon|ultra-sun|ultra-moon','Sun|Moon|Ultra Sun|Ultra Moon','3ds','Alola',7,'sun-moon|sun-moon|ultra-sun-ultra-moon|ultra-sun-ultra-moon'],
 ['lets-go-pikachu|lets-go-eevee',"Let’s Go, Pikachu!|Let’s Go, Eevee!",'switch','Kanto',7,'lets-go-pikachu-lets-go-eevee'],
 ['sword|shield','Sword|Shield','switch','Galar',8,'sword-shield'],
 ['brilliant-diamond|shining-pearl','Brilliant Diamond|Shining Pearl','switch','Sinnoh',8,'brilliant-diamond-shining-pearl'],
 ['legends-arceus','Legends: Arceus','switch','Hisui',8,'legends-arceus'],
 ['scarlet|violet','Scarlet|Violet','switch','Paldea',9,'scarlet-violet'],
 ['legends-za','Legends: Z-A','switch,switch2','Lumiose',9,'legends-za'],
 ['winds|waves','Winds|Waves','switch2','A anunciar',10,'',null,'announced'],
];
export const games = rows.flatMap(([ids,names,platform,region,generation,groups,map,status]) => ids.split('|').map((id,i) => ({
 id, name: 'Pokémon '+names.split('|')[i], consoles: platform.split(','), region, generation,
 group: groups.split('|')[i] || groups.split('|')[0], map, category:'Série principal', status:status || 'released',
 // Green is the original Japanese version, not LeafGreen; PokéAPI has no distinct encounters for it.
 version: status === 'announced' ? null : id === 'green' ? 'green-japan' : id,
})));
const extras = [
 ['Stadium (Japão)|Stadium|Stadium 2|Snap|Puzzle League|Hey You, Pikachu!','n64'],
 ['Colosseum|XD: Gale of Darkness|Channel|Box: Ruby & Sapphire|Colosseum Bonus Disc|Colosseum: Kakuchō Disc','gc'],
 ['Battle Revolution|Ranch|Rumble|PokéPark Wii: Pikachu’s Adventure|PokéPark 2: Wonders Beyond|Mystery Dungeon: Adventure Squad (Fire)|Mystery Dungeon: Adventure Squad (Storm)|Mystery Dungeon: Adventure Squad (Light)','wii'],
 ['Rumble U|Pokkén Tournament','wiiu'],
 ['Trading Card Game|Trading Card Game 2|Pinball|Puzzle Challenge','gbc'],
 ['Pinball: Ruby & Sapphire|Mystery Dungeon: Red Rescue Team','gba'],
 ['Dash|Trozei!|Ranger|Ranger: Shadows of Almia|Ranger: Guardian Signs|Mystery Dungeon: Blue Rescue Team|Mystery Dungeon: Explorers of Time|Mystery Dungeon: Explorers of Darkness|Mystery Dungeon: Explorers of Sky|Conquest|Typing Adventure','ds'],
 ['Rumble Blast|Rumble World|Battle Trozei|Shuffle|Picross|Art Academy|Detective Pikachu|Super Mystery Dungeon|Mystery Dungeon: Gates to Infinity|Dream Radar|Bank|Transporter|Pokédex 3D|Pokédex 3D Pro','3ds'],
 ['Quest|Café ReMix|UNITE|Pokkén Tournament DX|Mystery Dungeon: Rescue Team DX|New Pokémon Snap|Detective Pikachu Returns|HOME|Champions','switch'],
 ['Pokopia','switch2'],
 ['GO|Sleep|Masters EX|Trading Card Game Pocket|Trading Card Game Live|Magikarp Jump|Smile|Playhouse|Rumble Rush|Duel|Camp|Pokédex for iOS|Pokéland|Pokémon TCG Online','mobile'],
 ['Pokémon TCG Online|Trading Card Game Live|Play It!|Play It! Version 2|PokéROM|Pokémon Project Studio Red|Pokémon Project Studio Blue|Pokémon Team Turbo|Pokémon Masters Arena','pc'],
 ['Party mini|Pinball mini|Puzzle Collection|Puzzle Collection Vol. 2|Zany Cards|Tetris|Race mini|Pichu Bros. mini|Togepi’s Great Adventure|Breeder mini','mini'],
 ['Pokémon Advanced Generation: I’ve Begun Hiragana and Katakana!|Pokémon Advanced Generation: Pokémon Number Battle!','pico'],
 ['Battrio|Tretta|Ga-Olé|Mezastar|Frienda|Pokkén Tournament (Arcade)','arcade'],
];
for (const [names,platform] of extras) for (const title of names.split('|')) {
 const name = title.includes('Pokémon') || /^(PokéPark|Pokkén|Hey You,)/.test(title) ? title : title==='Ranch' ? 'My Pokémon Ranch' : 'Pokémon '+title;
 const id = 'extra-'+title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
 const existing = games.find(g=>g.id===id);
 if (existing) existing.consoles.push(platform);
 else games.push({id,name,consoles:[platform],category:'Derivados e aplicativos',region:'Mundo próprio',version:null,status:'released'});
}
// Cross-platform releases share one entry.
for (const name of ['Quest','Café ReMix','UNITE','HOME','Champions','Shuffle']) {
 const game=games.find(g=>g.name==='Pokémon '+name);
 if (game && !game.consoles.includes('mobile')) game.consoles.push('mobile');
}
export const getGame = id => games.find(g=>g.id===id) || null;
export function withGame(path, game) {
 if (!game) return path;
 const [base,hash] = path.split('#');
 const [pathname,query=''] = base.split('?');
 const params = new URLSearchParams(query); params.set('game',game);
 return pathname+'?'+params+(hash?'#'+hash:'');
}

const dlcs = [
 ['the-isle-of-armor-sword','Sword: The Isle of Armor','switch','Ilha da Armadura',8,'the-isle-of-armor'],
 ['the-isle-of-armor-shield','Shield: The Isle of Armor','switch','Ilha da Armadura',8,'the-isle-of-armor'],
 ['the-crown-tundra-sword','Sword: The Crown Tundra','switch','Crown Tundra',8,'the-crown-tundra'],
 ['the-crown-tundra-shield','Shield: The Crown Tundra','switch','Crown Tundra',8,'the-crown-tundra'],
 ['the-teal-mask-scarlet','Scarlet: The Teal Mask','switch','Kitakami',9,'the-teal-mask'],
 ['the-teal-mask-violet','Violet: The Teal Mask','switch','Kitakami',9,'the-teal-mask'],
 ['the-indigo-disk-scarlet','Scarlet: The Indigo Disk','switch','Blueberry Academy',9,'the-indigo-disk'],
 ['the-indigo-disk-violet','Violet: The Indigo Disk','switch','Blueberry Academy',9,'the-indigo-disk'],
 ['mega-dimension','Legends: Z-A — Mega Dimension','switch','Lumiose',9,'mega-dimension'],
 ['red-japan','Red (Japão)','gb','Kanto',1,'red-green-japan'],
 ['blue-japan','Blue (Japão)','gb','Kanto',1,'blue-japan'],
];
for (const [id,title,platform,region,generation,group] of dlcs) games.push({id,name:'Pokémon '+title,consoles:platform==='switch'&&id==='mega-dimension'?['switch','switch2']:[platform],region,generation,group,category:'Série principal',version:id,status:'released',map:['red-japan','blue-japan'].includes(id)?'rby':undefined});
for (const [id,version] of [['extra-colosseum','colosseum'],['extra-xd-gale-of-darkness','xd'],['extra-champions','champions']]) {const game=getGame(id); if(game)game.version=version;}
