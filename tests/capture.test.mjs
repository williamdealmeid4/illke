import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCaptureData } from '../scripts/lib/capture-data.mjs';
import { captureAdvice, historicalTypes } from '../apps/web/src/lib/capture-advice.js';

test('capture import keeps version, conditions and form identity separate',()=>{
  const tables={
    pokemon:[{id:'25',species_id:'25',identifier:'pikachu'},{id:'10080',species_id:'25',identifier:'pikachu-form'}],
    pokemon_species:[{id:'25',generation_id:'1',capture_rate:'190'}],
    pokemon_forms:[{pokemon_id:'25',introduced_in_version_group_id:'1'},{pokemon_id:'10080',introduced_in_version_group_id:'2'}],
    pokemon_types:[{pokemon_id:'25',type_id:'13'}],pokemon_types_past:[],types:[{id:'13',identifier:'electric'}],
    versions:[{id:'1',identifier:'red',version_group_id:'1'},{id:'2',identifier:'violet',version_group_id:'2'}],
    version_groups:[{id:'1',generation_id:'1'},{id:'2',generation_id:'9'}],version_names:[],
    location_areas:[{id:'1',location_id:'1',identifier:'forest'}],locations:[{id:'1',identifier:'viridian-forest'}],
    location_area_prose:[],location_names:[],encounter_methods:[{id:'1',identifier:'walk'}],encounter_method_prose:[],
    encounter_slots:[{id:'1',encounter_method_id:'1',rarity:'5'},{id:'2',encounter_method_id:'1',rarity:'10'}],
    encounter_condition_value_map:[{encounter_id:'3',encounter_condition_value_id:'1'}],
    encounter_condition_value_prose:[{encounter_condition_value_id:'1',local_language_id:'9',name:'At night'}],
    encounters:[{id:'1',version_id:'1',pokemon_id:'25',location_area_id:'1',encounter_slot_id:'1',min_level:'3',max_level:'5'},
      {id:'2',version_id:'1',pokemon_id:'25',location_area_id:'1',encounter_slot_id:'2',min_level:'4',max_level:'6'},
      {id:'3',version_id:'1',pokemon_id:'25',location_area_id:'1',encounter_slot_id:'1',min_level:'3',max_level:'5'}],
  };
  const data=buildCaptureData(tables,'test');
  assert.equal(data.pokemon[25].encounters.length,2);
  assert.equal(data.pokemon[25].encounters[0].encounter_rate,15);
  assert.deepEqual(data.pokemon[25].encounters[1].conditions,['At night']);
  assert.equal(data.pokemon[25].encounters.filter(row=>row.game==='violet').length,0);
  assert.deepEqual(data.pokemon[10080].encounters,[]);
  assert.equal(data.pokemon[10080].generation,9);
  assert.equal(data.games.find(game=>game.id==='violet').records,0);
});

const pokemon={generation:1,types:['water'],past_types:[]};
test('ball recommendations follow game generation and the actual capture scenario',()=>{
  assert.equal(captureAdvice({id:'ruby',generation:3},pokemon,null,{stage:'opening'}).best,'Net Ball');
  assert.equal(captureAdvice({id:'diamond',generation:4},pokemon,null,{stage:'opening'}).best,'Quick Ball');
  assert.equal(captureAdvice({id:'violet',generation:9},pokemon,null,{stage:'prepared',night:true}).best,'Dusk Ball');
  assert.equal(captureAdvice({id:'violet',generation:9},pokemon,null,{stage:'long',night:true}).best,'Timer Ball');
  assert.equal(captureAdvice({id:'sun',generation:7},{...pokemon,generation:7,species_id:793}).best,'Beast Ball');
  assert.ok(captureAdvice({id:'red',generation:1},pokemon).balls.every(ball=>!['Net Ball','Quick Ball','Dusk Ball'].includes(ball.name)));
});
test('historical types and introductions prevent future mechanics from leaking into older games',()=>{
  const fairy={generation:1,types:['fairy'],past_types:[{through_generation:5,types:['normal']}]};
  assert.deepEqual(historicalTypes(fairy,1),['normal']);
  assert.deepEqual(historicalTypes(fairy,6),['fairy']);
  assert.deepEqual(captureAdvice({id:'red',generation:1},{...pokemon,generation:4}).balls,[]);
});
test('gifts, Safari, raids and special games do not receive ordinary battle advice',()=>{
  assert.deepEqual(captureAdvice({id:'red',generation:1},pokemon,{method:'gift'}).balls,[]);
  const safari=captureAdvice({id:'firered',generation:3},pokemon,{method:'walk',location:'Safari Zone'});
  assert.equal(safari.best,'Safari Ball');assert.equal(safari.standard,false);
  assert.equal(captureAdvice({id:'sword',generation:8},pokemon,{method:'max-raid'}).standard,false);
  assert.equal(captureAdvice({id:'legends-arceus',generation:8},pokemon).balls[0].name,'Heavy Ball');
  assert.equal(captureAdvice({id:'lets-go-pikachu',generation:7},pokemon).standard,false);
  assert.deepEqual(captureAdvice({id:'legends-za',generation:9},pokemon).balls,[]);
});
