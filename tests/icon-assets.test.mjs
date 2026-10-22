import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { consoles } from '../apps/web/src/lib/games.js';
const staticRoot=new URL('../apps/web/static/',import.meta.url);
test('type images retain the original game source and exact downloaded bytes',async()=>{
  const manifest=JSON.parse(await readFile(new URL('icons/manifest.json',staticRoot),'utf8'));
  assert.equal(Object.keys(manifest.types).length,19);
  for(const [type,path] of Object.entries(manifest.types)){
    const file=manifest.files.find(f=>'/icons/'+f.path===path);
    assert.ok(file);
    assert.ok(file.source.includes(type==='stellar'?'/generation-ix/scarlet-violet/small/':'/generation-viii/sword-shield/small/'));
    const bytes=await readFile(new URL(path.slice(1),staticRoot));
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
  }
});
test('each platform has an existing attributed image with matching provenance',async()=>{
  const manifest=JSON.parse(await readFile(new URL('consoles/sources.json',staticRoot),'utf8'));
  for(const platform of Object.keys(consoles)){
    const file=manifest.files.find(f=>f.platform===platform);assert.ok(file,platform);
    assert.ok(file.source.startsWith('https://raw.githubusercontent.com/'));
    const bytes=await readFile(new URL('consoles/'+file.file,staticRoot));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
  }
  assert.equal(manifest.sources[0].license,'CC BY 4.0');
});
