import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { makeBenchmark } from '../../services/battle-engine/src/simulation.js';

const pageErrors=new WeakMap();
test.beforeEach(async({page})=>{const errors=[];pageErrors.set(page,errors);page.on('pageerror',error=>errors.push(error.message));});
test.afterEach(async({page})=>{expect(pageErrors.get(page)||[]).toEqual([]);});

const stats=value=>Object.fromEntries(['hp','atk','def','spa','spd','spe'].map(key=>[key,value]));
const members=['Garchomp','Corviknight','Dragapult','Great Tusk','Gholdengo','Kingambit'].map((pokemon,index)=>({name:'Teste de equipe',pokemon,context_id:'gen9ou',level:100,nature:'Serious',ability:['Rough Skin','Pressure','Clear Body','Protosynthesis','Good as Gold','Defiant'][index],item:'',moves:['Protect'],evs:{...stats(0),hp:4},ivs:stats(31),tera_type:'',role:'support',strategy:'Anotações que precisam ser preservadas.',visibility:'private'}));

test('reference opening preserves all six members and creates an independent team',async({page})=>{
  await page.addInitScript(team=>{if(!localStorage.getItem('seeded')){localStorage.setItem('illke-team-v1',JSON.stringify(team));localStorage.setItem('seeded','1');}},{name:'Equipe protegida',members});
  await page.goto('/builder');await expect(page.getByRole('button',{name:'Editar Kingambit',exact:true})).toBeVisible();
  await page.goto('/builder?pokemon=Pikachu');await expect(page.getByRole('heading',{name:'Como você quer usar Pikachu?'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Editar Kingambit',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Criar nova equipe',exact:true}).click();await expect(page).toHaveURL(/\/builder\?team=/);
  await expect(page.getByRole('button',{name:'Editar Pikachu',exact:true})).toBeVisible();
  await page.goto('/equipes');await expect(page.locator('article')).toHaveCount(2);await expect(page.locator('article').filter({hasText:'Equipe protegida'})).toContainText('Kingambit');
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar backup',exact:true}).click();const download=await downloadPromise;
  const backup=JSON.parse(await readFile(await download.path(),'utf8'));expect(backup.schema_version).toBe(2);expect(backup.teams).toHaveLength(2);
  await page.locator('input[type=file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await expect(page.locator('article')).toHaveCount(4);
});

test('favorites survive reload and can be found and removed',async({page,request})=>{
  const response=await request.get('/api/v1/builds');const build=(await response.json()).data[0];expect(build).toBeTruthy();
  await page.goto('/builds/'+build.public_id);await page.getByRole('button',{name:'Favoritar',exact:true}).click();await expect(page.getByRole('button',{name:'Remover favorito',exact:true})).toBeVisible();
  await page.reload();await expect(page.getByRole('button',{name:'Remover favorito',exact:true})).toBeVisible();
  await page.goto('/favoritos');await expect(page.getByRole('button',{name:'Remover favorito de '+build.pokemon,exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Remover favorito de '+build.pokemon,exact:true}).click();await expect(page.getByRole('heading',{name:'Nenhuma build favoritada'})).toBeVisible();
});

test('PDF download tolerates missing external artwork',async({page,request})=>{
  const response=await request.get('/api/v1/builds');const build=(await response.json()).data[0];
  await page.route('**/api/v1/sprite/**?style=artwork',route=>route.fulfill({status:503,body:'unavailable'}));
  await page.goto('/builds/'+build.public_id);const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Salvar PDF',exact:true}).click();const download=await promise;expect(download.suggestedFilename()).toMatch(/\.pdf$/);expect((await readFile(await download.path())).length).toBeGreaterThan(1000);
});

test('damage calculator handles immunity and compares the previous result',async({page})=>{
  await page.goto('/calculos');await page.getByRole('button',{name:'Calcular dano',exact:true}).click();await expect(page.getByText('0–0 HP',{exact:true})).toBeVisible();
  await page.getByLabel('Golpe',{exact:true}).fill('Dragon Claw');await page.getByRole('button',{name:'Calcular dano',exact:true}).click();await expect(page.getByRole('heading',{name:'Comparação anterior'})).toBeVisible();
});

test('error pages and cancelled requests do not take down the frontend',async({page,request})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(let i=0;i<8;i++){const response=await page.goto('/pokemon/nao-existe-auditoria');expect(response.status()).toBe(404);await page.goto('/');}
  await page.evaluate(async()=>{await Promise.allSettled(Array.from({length:20},()=>{const controller=new AbortController();const promise=fetch('/api/v1/session',{signal:controller.signal});controller.abort();return promise;}));});
  expect((await request.get('/')).ok()).toBe(true);expect(errors).toEqual([]);
});

test('mobile editor fits the viewport and exposes a disabled support preset',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/builder?new=1');
  await expect(page.getByText('Salvo neste navegador',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Adicionar primeiro Pokémon',exact:true}).click();
  await page.getByLabel('Nome, forma ou número — gerações 1 a 9').fill('Garchomp');
  await page.getByRole('button',{name:'Selecionar Garchomp',exact:true}).click();
  await page.locator('select:has(option[value="support"])').selectOption('support');await expect(page.getByRole('button',{name:'Distribuir pela função'})).toBeDisabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('builder starts empty, loads reference moves and removes the last member permanently',async({page,request})=>{
  const response=await request.get('/api/v1/builds?q=Garchomp&context_id=gen9ou');
  const reference=(await response.json()).data.find(build=>build.pokemon==='Garchomp'&&build.source_key&&build.legality==='legal');
  expect(reference).toBeTruthy();
  await page.goto('/builder?new=1');
  await expect(page.getByRole('heading',{name:'Sua equipe está vazia',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/^Editar /})).toHaveCount(0);
  await expect(page.getByRole('button',{name:/^Adicionar integrante /})).toHaveCount(6);
  await page.getByRole('button',{name:'Adicionar integrante 4',exact:true}).click();
  await page.getByLabel('Nome, forma ou número — gerações 1 a 9').fill('Garchomp');
  await page.getByRole('button',{name:'Selecionar Garchomp',exact:true}).click();
  await expect(page.getByRole('button',{name:'Editar Garchomp',exact:true})).toBeVisible();
  for(let slot=0;slot<reference.configuration.moves.length;slot++) await expect(page.getByRole('button',{name:'Alterar golpe '+(slot+1),exact:true})).toContainText(reference.configuration.moves[slot]);
  await expect(page.locator('.natural-types')).toContainText('Dragon');
  await expect(page.locator('.natural-types')).toContainText('Ground');
  await expect(page.getByLabel('Tipo Tera',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Alterar golpe 1',exact:true}).click();
  await page.getByLabel('Pesquisar golpes que Garchomp aprende').fill('Flamethrower');
  await page.getByRole('button',{name:/^Flamethrower /}).click();
  await expect(page.getByRole('button',{name:'Alterar golpe 1',exact:true})).toContainText('Flamethrower');
  await page.getByRole('button',{name:'Alterar golpe 1',exact:true}).click();
  await page.getByLabel('Pesquisar golpes que Garchomp aprende').fill('não existe');
  await expect(page.getByText('Nenhum golpe encontrado no repertório deste Pokémon.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Fechar',exact:true}).click();
  await expect(page.getByText('Salvo neste navegador',{exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button',{name:'Alterar golpe 1',exact:true})).toContainText('Flamethrower');
  await page.getByRole('button',{name:'Remover Garchomp da equipe',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Sua equipe está vazia',exact:true})).toBeVisible();
  await expect(page.getByText('Salvo neste navegador',{exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Sua equipe está vazia',exact:true})).toBeVisible();
  await page.goto('/equipes');
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Exportar backup',exact:true}).click();
  const backup=JSON.parse(await readFile(await (await downloadPromise).path(),'utf8'));
  expect(backup.teams[0].members).toEqual([]);
});

test('capture atlas separates games, maps and ball advice for the selected scenario',async({page})=>{
  await page.goto('/pokemon/pikachu?game=red');
  const guide=page.getByRole('region',{name:'Onde encontrar',exact:true});
  await expect(page.getByLabel('Jogo selecionado',{exact:true})).toHaveValue('red');
  await expect(guide.locator('.hint-card').filter({hasText:'Viridian Forest'}).first()).toBeVisible();
  await expect(guide.locator('.map-pin').first()).toBeVisible();
  await guide.locator('.map-pin').first().click();
  await expect(guide.locator('.active-hint')).toContainText('Viridian Forest');
  await expect(guide.getByText(/Opção indicada:/)).toContainText('Compare Great Ball e Ultra Ball');
  await page.getByLabel('Jogo selecionado',{exact:true}).selectOption('violet');
  await expect(page.getByLabel('Jogo selecionado',{exact:true})).toHaveValue('violet');
  await expect(guide.locator('.hint-card').filter({hasText:'Viridian Forest'})).toHaveCount(0);
  await expect(guide.getByText(/Opção indicada:/)).toContainText('Quick Ball');
  await guide.getByLabel('Momento da tentativa',{exact:true}).selectOption('prepared');
  await guide.getByLabel('É noite',{exact:true}).check();
  await expect(guide.getByText(/Opção indicada:/)).toContainText('Dusk Ball');
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('game catalog filters consoles and opens the correct regional map',async({page})=>{
  await page.goto('/jogos');
  await page.getByLabel('Console',{exact:true}).selectOption('gbc');
  await expect(page.locator('.game-card').filter({hasText:'Pokémon Gold'})).toHaveCount(1);
  await expect(page.locator('.game-card').filter({hasText:'Pokémon Scarlet'})).toHaveCount(0);
  await page.getByRole('link',{name:/Pokémon Gold Game Boy Color/}).click();
  await expect(page).toHaveURL(/\/jogos\/gold\?game=gold/);
  await expect(page.getByRole('heading',{name:'Pokémon Gold',exact:true})).toBeVisible();
  await page.getByText('Mapa regional e áreas de Johto',{exact:true}).click();
  await page.getByLabel('Destacar local',{exact:true}).selectOption('Violet City');
  await expect(page.locator('.region-map .map-pin')).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('item map selects source-backed ground items and preserves version',async({page})=>{
  await page.goto('/item/leftovers?game=firered');
  const guide=page.getByRole('region',{name:'Onde encontrar',exact:true});
  await expect(guide.locator('.hint-card')).toHaveCount(2);
  await guide.locator('.hint-card').filter({hasText:'Route16'}).click();
  await expect(guide.locator('.active-hint')).toContainText('Route16');
  await expect(guide.locator('.active-hint')).toContainText('coluna 31, linha 13');
  await expect(guide.locator('.local-target')).toContainText('Alvo');
  await expect(guide.locator('.local-scene img')).toHaveAttribute('src',/Route16.webp$/);
  await expect(guide.getByText('Use o Itemfinder',{exact:true})).toBeVisible();
});

test('full simulation survives reload and evaluates every distinct alternative',async({page,request})=>{
  test.skip(process.env.FULL_SIMULATION!=='1','Ative FULL_SIMULATION=1 para executar 1.000 batalhas por alternativa.');
  test.setTimeout(900000);
  const catalog=JSON.parse(await readFile('.data/catalog.json','utf8'));
  const team=makeBenchmark(catalog.builds,'gen9ou')[0];
  const slot=team.findIndex(member=>catalog.builds.filter(build=>build.context_id==='gen9ou'&&build.legality==='legal'&&build.pokemon===member.pokemon).length>1);
  expect(slot).toBeGreaterThanOrEqual(0);
  await page.addInitScript(members=>{if(!localStorage.getItem('seeded')){localStorage.setItem('illke-team-v1',JSON.stringify({name:'Simulação completa',members}));localStorage.setItem('seeded','1');}},team);
  await page.goto('/builder');
  await expect(page.getByRole('button',{name:'Avaliar equipe completa',exact:true})).toBeEnabled();
  await page.getByLabel('Procurar alternativa para',{exact:true}).selectOption(String(slot));
  const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/v1/evaluations')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Avaliar equipe completa',exact:true}).click();
  const response=await responsePromise;expect(response.status()).toBe(202);let evaluation=await response.json();
  await expect(page.getByText('Avaliação iniciada. Você pode recarregar a página para continuar acompanhando.',{exact:true})).toBeVisible();
  await page.reload();await expect(page.getByRole('heading',{name:'Avaliação da equipe',exact:true})).toBeVisible();
  await expect.poll(async()=>{const response=await page.request.get('/api/v1/evaluations/'+evaluation.public_id);expect(response.ok()).toBe(true);evaluation=await response.json();return evaluation.status;},{timeout:840000,intervals:[1000,2000,3000]}).toBe('completed');
  expect(evaluation.result.samples).toBe(1000);
  expect(evaluation.result.wins+evaluation.result.losses+evaluation.result.draws).toBe(1000);
  expect(evaluation.result.search_summary.tested).toBeGreaterThan(0);
  expect(evaluation.result.search_summary.tested).toBe(evaluation.result.candidates.length);
  expect(evaluation.result.complete).toBe(true);
  expect(evaluation.snapshot_id).toBe(evaluation.result.snapshot_id);
  await writeFile('.runtime/full-simulation-result.json',JSON.stringify(evaluation,null,2));
});


test('opening plays on entry and reload but not during menu navigation',async({page})=>{
  await page.goto('/');
  const opening=page.getByRole('dialog',{name:'Abertura do illke',exact:true});
  await expect(opening).toBeVisible();
  await expect(opening.locator('.shell-top')).toHaveCSS('animation-name',/shell-open-top$/);
  await expect(opening.locator('.opening-ball')).toHaveCSS('animation-name',/ball-turn$/);
  await opening.getByRole('button',{name:'Pular abertura'}).click();
  await expect(opening).toHaveCount(0);
  await expect(page.locator('.app')).not.toHaveAttribute('inert','');
  await page.getByRole('navigation',{name:'Principal',exact:true}).getByRole('link',{name:'Jogos e mapas',exact:true}).click();
  await expect(page).toHaveURL(/\/jogos$/);
  await expect(page.getByRole('dialog',{name:'Abertura do illke',exact:true})).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('dialog',{name:'Abertura do illke',exact:true})).toBeVisible();
});

test('opening finishes automatically and restores access to the system',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('dialog',{name:'Abertura do illke',exact:true})).toHaveCount(0,{timeout:5000});
  await expect(page.locator('.app')).not.toHaveAttribute('inert','');
  await expect(page.getByRole('link',{name:'Trocar jogo',exact:true})).toBeVisible();
});

test('opening respects reduced motion without blocking navigation',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.getByRole('dialog',{name:'Abertura do illke',exact:true})).not.toBeVisible();
  await expect(page.locator('.app')).not.toHaveAttribute('inert','');
});

test('sidebar navigation uses one tab and fills the desktop workspace',async({page,context})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:1512,height:982});
  await page.goto('/');
  const navigation=page.getByRole('navigation',{name:'Principal',exact:true});
  await expect(navigation).toBeVisible();
  const sidebar=await page.locator('.workspace-sidebar').boundingBox();
  const main=await page.locator('main').boundingBox();
  expect(sidebar.x).toBe(0);expect(main.x).toBe(sidebar.width);expect(main.width).toBeGreaterThan(1200);
  for(const [name,path] of [['Jogos e mapas','/jogos'],['Pokédex','/pokedex'],['Itens','/itens']]){
    await navigation.getByRole('link',{name,exact:true}).click();
    await expect(page).toHaveURL(new RegExp(path+'(?:\\?|$)'));
    expect(context.pages()).toHaveLength(1);
  }
  expect(await page.locator('a[target="_blank"]').count()).toBe(0);
});

test('mobile sidebar opens, navigates and closes without horizontal overflow',async({page,context})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  await expect(page.locator('.workspace-sidebar')).not.toBeVisible();
  await page.getByRole('button',{name:'Abrir menu',exact:true}).click();
  await expect(page.locator('.workspace-sidebar')).toBeVisible();
  await page.getByRole('navigation',{name:'Principal',exact:true}).getByRole('link',{name:'Jogos e mapas',exact:true}).click();
  await expect(page).toHaveURL(/\/jogos$/);await expect(page.locator('.workspace-sidebar')).not.toBeVisible();
  expect(context.pages()).toHaveLength(1);
  for(const width of [320,390,768,1024,1512]){
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});


test('game search opens an actionable item walkthrough in the same workspace',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/jogos/firered?kind=item&target=leftovers');
 await expect(page.locator('.local-target')).toContainText('Alvo');
 await expect(page.getByRole('heading',{name:'Como chegar e o que fazer'})).toBeVisible();
 await expect(page.locator('.guide-requirements')).toContainText('Poké Flute');
 await expect(page.locator('.walkthrough-instructions')).toContainText('pise exatamente');
 await page.getByRole('button',{name:'Mapa regional',exact:true}).click();
 await expect(page.locator('.regional-route')).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('calculator fields and expanded training fit narrow and wide screens',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/calculos');
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const details of await page.locator('.damage-calculator details').all())await details.evaluate(el=>el.open=true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const field of await page.locator('.damage-sides input,.damage-sides select').all()){const box=await field.boundingBox();expect(box.width).toBeGreaterThan(45);expect(box.x+box.width).toBeLessThanOrEqual(width);}
 }
});
