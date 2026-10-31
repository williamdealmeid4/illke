import test from 'node:test';
import assert from 'node:assert/strict';
import { abilityMeta, filterAbilities, paginateAbilities } from '../apps/web/src/lib/abilities.js';

const entry = (slug, name, generation) => ({ slug, name, generation });
const entries = [entry('drizzle', 'Drizzle', 3), entry('blaze', 'Blaze', 3),
  entry('static', 'Static', 3), entry('snow-warning', 'Snow Warning', 4),
  entry('levitate', 'Levitate', 3), entry('intimidate', 'Intimidate', 3)];

test('thematic icons distinguish core battle mechanics', () => {
  assert.deepEqual(['drizzle', 'blaze', 'static', 'levitate', 'intimidate', 'battle-armor'].map((slug) => abilityMeta(slug).icon),
    ['CloudRain', 'Flame', 'Zap', 'Feather', 'Eye', 'Shield']);
});

test('category, generation and name intersect across the complete catalogue', () => {
  assert.deepEqual(filterAbilities(entries, { category: 'weather', generation: '4', q: 'snow' }).map((item) => item.slug), ['snow-warning']);
  assert.deepEqual(filterAbilities(entries, { category: 'weather', generation: '3' }).map((item) => item.slug), ['drizzle']);
  assert.equal(filterAbilities(entries, { category: 'defense', q: 'drizzle' }).length, 0);
  assert.equal(filterAbilities(entries, { q: '  DRIZZLE  ' }).length, 1);
});

test('pagination retains filters and game, clamps invalid pages and handles empty results', () => {
  const url = new URL('https://illke.test/habilidades?category=weather&generation=3&game=emerald&page=999');
  const result = paginateAbilities(entries, url, 4);
  assert.equal(result.current_page, 2);
  assert.equal(result.from, 5);
  assert.equal(result.to, 6);
  assert.equal(result.next_page_url, null);
  const previous = new URL(result.prev_page_url);
  assert.equal(previous.searchParams.get('category'), 'weather');
  assert.equal(previous.searchParams.get('game'), 'emerald');
  assert.equal(previous.searchParams.get('generation'), '3');
  assert.equal(previous.searchParams.get('page'), '1');
  assert.deepEqual(paginateAbilities([], url).data, []);
  assert.equal(paginateAbilities([], url).from, 0);
  assert.equal(paginateAbilities([], url).current_page, 1);
  assert.equal(paginateAbilities(entries, new URL('https://illke.test/habilidades?page=NaN')).current_page, 1);
});
