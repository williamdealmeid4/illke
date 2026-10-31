import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { games } from '../apps/web/src/lib/games.js';

test('every catalog game has a local attributed raster with intact provenance', async () => {
  const manifest = JSON.parse(await readFile(new URL('../apps/web/src/lib/game-covers.json', import.meta.url), 'utf8'));
  const published = JSON.parse(await readFile(new URL('../apps/web/static/covers/sources.json', import.meta.url), 'utf8'));
  assert.deepEqual(manifest, published);
  assert.deepEqual(Object.keys(manifest).sort(), games.map(game => game.id).sort());
  for (const game of games) {
    const file = manifest[game.id];
    assert.match(file.image, /^\/covers\/[a-z0-9-]+\.(png|jpg|webp)$/, game.id);
    assert.equal(new URL(file.source).protocol, 'https:', game.id);
    assert.equal(new URL(file.origin).protocol, 'https:', game.id);
    assert.ok(['box', 'official-art', 'logo'].includes(file.kind), game.id);
    assert.ok(file.width >= 32 && file.height >= 32, game.id);
    const bytes = await readFile(new URL('../apps/web/static' + file.image, import.meta.url));
    const png = bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
    const jpeg = bytes.subarray(0, 3).toString('hex') === 'ffd8ff';
    const webp = bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
    assert.ok(png || jpeg || webp, game.id + ' must be a raster, not HTML or a placeholder');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, game.id);
    if (png) {
      assert.equal(bytes.readUInt32BE(16), file.width, game.id);
      assert.equal(bytes.readUInt32BE(20), file.height, game.id);
    }
  }
});
