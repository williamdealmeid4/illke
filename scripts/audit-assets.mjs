import { readFile } from "node:fs/promises";
import { makeBenchmark } from '../services/battle-engine/src/simulation.js';
import { legal, speciesData } from '../services/battle-engine/src/domain.js';
const catalog = JSON.parse(
  await readFile(new URL("../.data/catalog.json", import.meta.url), "utf8"),
);
const pokemon = catalog.entities.filter((e) => e.kind === "pokemon");
const problems=[];
const contexts=Array.from({length:9},(_,index)=>{const id='gen'+(index+1)+'ou';const builds=catalog.builds.filter(b=>b.context_id===id);try{return {id,total:builds.length,legal:builds.filter(b=>b.legality==='legal').length,benchmark_teams:makeBenchmark(catalog.builds,id).length};}catch(error){problems.push(id+': '+error.message);return {id,error:error.message};}});
for(const build of catalog.builds.filter(b=>b.legality==='legal'))if(legal(build).status!=='legal')problems.push(build.context_id+' '+build.pokemon+' / '+build.name+' diverge da validação do motor.');
const normalize=name=>String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const names=new Set(pokemon.flatMap(p=>[p.name,p.slug,p.attributes.showdown_id].filter(Boolean).map(normalize)));
const unresolved=speciesData().filter(s=>s.num>0&&s.gen<=9&&!['CAP','Custom','Pokestar'].includes(s.nonstandard)&&!names.has(normalize(s.name))).map(s=>s.name);
console.log(
  JSON.stringify(
    {
      revision: catalog.sprite_revision,
      snapshot_id: catalog.snapshot_id,
      contexts,
      unresolved_motor_names: unresolved,
      content: Object.fromEntries(['item','move','ability'].map(kind=>{const entries=catalog.entities.filter(e=>e.kind===kind);return [kind,{total:entries.length,missing_effect:entries.filter(e=>!e.attributes.effect).length}];})),
      problems,
      total: pokemon.length,
      associated: pokemon.filter((p) => p.image).length,
      missing: pokemon.filter((p) => !p.image).map((p) => p.slug),
      scope: "Sprites genéricos. Associação exata a jogos ainda não auditada.",
    },
    null,
    2,
  ),
);
process.exitCode=problems.length?1:0;
