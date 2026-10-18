import test from 'node:test';
import assert from 'node:assert/strict';
import { referenceSet } from '../scripts/lib/reference-set.mjs';
import { evolutionConditions } from '../scripts/lib/evolution-conditions.mjs';
import { legal, options, damage } from '../services/battle-engine/src/domain.js';
import { makeBenchmark, pairedComparison, finishEvaluation } from '../services/battle-engine/src/simulation.js';
import { analyzeTeam } from '../services/battle-engine/src/team-analysis.js';
import { parseBackup } from '../apps/web/src/lib/team-store.js';
const training = value => Object.fromEntries(['hp','atk','def','spa','spd','spe'].map(key=>[key,value]));
const build=(pokemon='Charizard',generation=9)=>({name:'Uma descrição editorial maior que dezoito caracteres',nickname:'',pokemon,context_id:`gen${generation}ou`,level:100,nature:'Serious',ability:generation>=3?options(pokemon,`gen${generation}ou`).abilities[0]:'',item:'',moves:[generation===1?'Flamethrower':'Protect'],evs:generation<=2?training(252):{...training(0),hp:4},ivs:training(31),tera_type:'',role:'support',strategy:'',visibility:'private'});

test('editorial build names do not become illegal Pokemon nicknames',()=>{
  assert.equal(legal(build()).status,'legal');
  assert.equal(legal({...build(),nickname:'A nickname that is far too long'}).status,'invalid');
});
test('reference import supplies historical training and a single unambiguous ability',()=>{
  const old=referenceSet('Charizard',{moves:[['Flamethrower']]},1);
  assert.deepEqual(old.evs,training(252));
  const milotic=referenceSet('Milotic',{moves:['Surf'],evs:{hp:252,def:252,spd:4}},3);
  assert.equal(milotic.ability,'Marvel Scale');
  assert.equal(old.name,'');
});
test('51 reference candidates can form complete legal benchmark teams',()=>{
  const names=['Charizard','Blastoise','Venusaur','Pikachu','Gengar','Snorlax'];
  for(const generation of [5,8,9]){
    const candidates=Array.from({length:51},(_,i)=>({...build(names[i%6],generation),legality:'legal'}));
    const teams=makeBenchmark(candidates,`gen${generation}ou`);
    assert.equal(teams.length,10);
    assert.ok(teams.every(t=>t.length===6&&new Set(t.map(b=>b.pokemon)).size===6));
  }
});
test('paired comparisons handle identical, better and worse outcomes without NaN',()=>{
  const identical=pairedComparison([0,1,0,1],[0,1,0,1]);
  assert.equal(identical.difference,0);assert.ok(identical.p_value>0.99);
  assert.equal(pairedComparison(Array(100).fill(0),Array(100).fill(1)).difference,1);
  const result=finishEvaluation({candidates:[{},{}],comparisons:[{paired:{difference:0.1,p_value:0.02}},{paired:{difference:0.1,p_value:0.04}}]});
  assert.equal(result.recommendations.length,2);assert.equal(result.comparisons[0].paired.adjusted_p,0.04);
});
test('team diagnosis identifies shared weaknesses without assigning a quality score',()=>{
  const result=analyzeTeam({builds:['Garchomp','Dragonite','Salamence'].map(name=>build(name))});
  assert.ok(result.observations.some(o=>o.code==='SHARED_WEAKNESS'&&o.title.includes('Ice')));
  assert.equal(result.type_profile.find(t=>t.type==='Ice').weak.length,3);
  assert.equal(result.speed_tiers.length,3);assert.equal(result.score,undefined);
});
test('damage calculation respects a Ground immunity',()=>{
  const result=damage({attacker:build('Garchomp'),defender:build('Corviknight'),move:'Earthquake'});
  assert.deepEqual(result.range,[0,0]);
});
test('backups validate all teams before importing and strip unknown private fields',()=>{
  const original={app:'illke',schema_version:2,teams:[{name:'Equipe',members:[{...build(),token:'secret'}]}],favorites:[]};
  const parsed=parseBackup(original);assert.equal(parsed.teams[0].members[0].token,undefined);
  assert.ok(parsed.teams[0].id);assert.equal(parsed.teams[0].members[0].name,original.teams[0].members[0].name);
  assert.throws(()=>parseBackup({...original,teams:[original.teams[0],{name:'Quebrada',members:[]}]}),/integrantes/);
});
