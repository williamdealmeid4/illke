import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { referenceSet } from './lib/reference-set.mjs';
if(process.env.CI!=='true'||process.env.APP_ENV!=='testing')throw Error('Fixtures só podem ser geradas em CI com APP_ENV=testing.');
const require=createRequire(import.meta.url);const {Dex,TeamValidator}=require('pokemon-showdown');
const sources=[['Charizard','Flamethrower'],['Blastoise','Surf'],['Venusaur','Razor Leaf'],['Pikachu','Thunderbolt'],['Gengar','Thunderbolt'],['Snorlax','Body Slam'],['Garchomp','Protect']];
const builds=[];
for(let generation=1;generation<=9;generation++)for(const [pokemon,move] of sources){
  const context_id='gen'+generation+'ou', species=Dex.forFormat(context_id).species.get(pokemon);
  if(species.gen>generation || (pokemon==='Garchomp' && generation!==9))continue;
  const set=referenceSet(pokemon,{ability:pokemon==='Garchomp'?'Rough Skin':species.abilities['0'],moves:[move],evs:generation<=2?undefined:{hp:4,spa:252,spe:252}},generation);
  const issues=new TeamValidator(context_id).validateSet(structuredClone(set),{})||[];
  if(issues.length)throw Error(context_id+' '+pokemon+': '+issues.join(' '));
  builds.push({slug:context_id+'-'+species.id,name:'Referência de teste',nickname:'',pokemon,context_id,level:100,nature:set.nature,ability:set.ability,item:'',moves:set.moves,evs:set.evs,ivs:set.ivs,tera_type:'',role:'support',strategy:'Fixture determinística de integração.',visibility:'public',alternatives:{moves:[move]},legality:'legal',issues:[],source_name:'Fixture CI',source_url:'https://github.com/smogon/pokemon-showdown'});
}
const entities=sources.map(([name])=>{const species=Dex.species.get(name);return {kind:'pokemon',slug:species.id,name,national_number:species.num,generation:species.gen,image:{url:'/sprite-unavailable.svg'},attributes:{pokeapi_id:species.num,showdown_id:species.id,types:species.types.map(x=>x.toLowerCase()),stats:species.baseStats,abilities:[],height:1,weight:1,evolves_to:[]}};});
const data={schema_version:2,revision:'ci-fixture-v2',sprite_revision:'ci-fixture-v2',entities,builds,imports:[],coverage:{pokemon:entities.length,builds:builds.length,legal_builds:builds.length},imported_at:'2026-01-01T00:00:00Z'};
data.snapshot_id=createHash('sha256').update(JSON.stringify(data)).digest('hex');await mkdir('.data/snapshots',{recursive:true});await writeFile('.data/catalog.json',JSON.stringify(data));await writeFile('.data/snapshots/'+data.snapshot_id+'.json',JSON.stringify(data));
await writeFile('.data/capture-guide.json',JSON.stringify({schema_version:1,revision:data.revision,source:'https://github.com/PokeAPI/pokeapi',games:[{id:'red',label:'Red',generation:1,records:1},{id:'violet',label:'Violet',generation:9,records:0}],pokemon:{25:{id:25,species_id:25,generation:1,types:['electric'],past_types:[],encounters:[{game:'red',location:'Viridian Forest',area:'Viridian Forest',area_id:321,method:'walk',method_label:'Walking in tall grass or a cave',conditions:[],min_level:3,max_level:5,encounter_rate:5}]}}}));
