import test from 'node:test';
import assert from 'node:assert/strict';
import { games, getGame, withGame, consoles } from '../apps/web/src/lib/games.js';
import { mapFor } from '../apps/web/src/lib/maps.js';
import { encounterHints, loadGuide, poke } from '../apps/web/src/lib/server/guides.js';
import { handle } from '../apps/web/src/hooks.server.js';

test('game catalog has unique identifiers, real consoles and distinct remakes', () => {
  assert.equal(new Set(games.map(g=>g.id)).size,games.length);
  for(const game of games) for(const platform of game.consoles) assert.ok(consoles[platform]);
  assert.deepEqual(getGame('gold').consoles,['gbc']);
  assert.equal(getGame('green').version,'green-japan');
  assert.equal(getGame('firered').generation,3);
  assert.equal(getGame('sword').group,'sword-shield');
  assert.equal(getGame('the-isle-of-armor-shield').group,'the-isle-of-armor');
  assert.equal(getGame('brilliant-diamond').group,'brilliant-diamond-shining-pearl');
  assert.equal(getGame('red').generation,1);
  assert.equal(getGame('winds').status,'announced');
  assert.equal(getGame('the-teal-mask-violet').version,'the-teal-mask-violet');
  assert.equal(getGame('not-a-game'),null);
});
test('game links preserve search and fragments without duplicating game',()=>{
  assert.equal(withGame('/pokedex?q=eevee&game=gold#where','silver'),'/pokedex?q=eevee&game=silver#where');
});
test('encounter hints never leak locations, rates or conditions from another version',()=>{
  const rows=[{location_area:{name:'kanto-route-2-south-towards-viridian-city'},version_details:[
    {version:{name:'red'},encounter_details:[{min_level:3,max_level:5,chance:15,method:{name:'walk'},condition_values:[{name:'time-night'}]}]},
    {version:{name:'blue'},encounter_details:[{min_level:8,max_level:8,chance:40,method:{name:'surf'},condition_values:[]}]},
  ]}];
  const red=encounterHints(rows,'red');assert.equal(red.length,1);assert.equal(red[0].chance,15);assert.deepEqual(red[0].conditions,['Noite']);
  assert.equal(encounterHints(rows,'blue')[0].method,'Usar Surf');
  assert.deepEqual(encounterHints(rows,'gold'),[]);
});
test('regional markers use the correct edition and do not guess missing coordinates',()=>{
  const red=mapFor(getGame('red'),'viridian-forest-area');
  const remake=mapFor(getGame('firered'),'viridian-forest-area');
  assert.notEqual(red.image,remake.image);assert.ok(red.point);assert.ok(remake.point);
  assert.deepEqual([red.point.x,red.point.y],[36,45]);
  assert.deepEqual([remake.point.x,remake.point.y],[68,84]);
  assert.equal(mapFor(getGame('red'),'unknown-location').point,null);
  const modern=mapFor(getGame('scarlet'),'south-province-area-one');
  assert.equal(modern.illustration,true);assert.equal(modern.point,null);
});
test('unannounced encounter coverage never becomes a false unavailable claim',async()=>{
  const guide=await loadGuide({kind:'pokemon',attributes:{},slug:'pikachu'},'winds');
  assert.equal(guide.status,'unsupported');assert.deepEqual(guide.hints,[]);
});
test('upstream resource validation blocks arbitrary URLs and path traversal',async()=>{
  for(const path of ['https://example.com','pokemon/../../item/1','pokemon/1?url=evil']) await assert.rejects(poke(path),/inválido/);
});
test('local item evidence survives upstream outage and is not applied to other cartridges',async()=>{
  const original=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('offline');};
  try {
    const entry={kind:'item',slug:'leftovers',attributes:{}};
    const guide=await loadGuide(entry,'firered');
    assert.equal(guide.status,'ready');assert.equal(guide.hints.length,2);assert.ok(guide.hints.some(h=>h.area==='route-12'));
    assert.equal((await loadGuide(entry,'ruby')).hints.length,0);
    assert.equal((await loadGuide(entry,'leafgreen')).hints.length,2);
  } finally {globalThis.fetch=original;}
});
test('API mutations reject foreign origins before proxying',async()=>{
  let resolved=false;
  const event={url:new URL('https://illke.example/api/v1/topics'),request:new Request('https://illke.example/api/v1/topics',{method:'POST',headers:{origin:'https://evil.example'}})};
  const response=await handle({event,resolve:async()=>{resolved=true;return new Response('bad');}});
  assert.equal(response.status,403);assert.equal(resolved,false);
});
test('HTML responses have defensive browser headers',async()=>{
  const event={url:new URL('https://illke.example/jogos'),request:new Request('https://illke.example/jogos')};
  const response=await handle({event,resolve:async()=>new Response('ok')});
  assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');
  assert.equal(response.headers.get('X-Frame-Options'),'DENY');
});

test('item walkthrough uses exact source map, target tile and Snorlax requirements',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('offline');};
 try{
  const guide=await loadGuide({kind:'item',slug:'leftovers',name:'Leftovers',attributes:{}},'firered');
  const hint=guide.hints.find(h=>h.area==='route-16');
  assert.deepEqual(hint.tile,{x:31,y:13});
  assert.equal(hint.walkthrough.paths[0].mapId,'MAP_ROUTE16');
  assert.deepEqual(hint.walkthrough.paths[0].steps.map(s=>s.title),['Celadon City','Route 16']);
  assert.ok(hint.walkthrough.requirements.some(s=>s.includes('Poké Flute')));
  assert.ok(hint.walkthrough.steps.some(s=>s.text.includes('pise exatamente')));
  assert.match(guide.localMaps.MAP_ROUTE16.image,/firered\/Route16.webp$/);
 }finally{globalThis.fetch=original;}
});
