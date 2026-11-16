import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestMatch } from '../apps/web/src/lib/fuzzy.js';
import { filterAbilitiesWithSuggestion } from '../apps/web/src/lib/abilities.js';

test('suggestMatch corrects typos across pokemon, items, moves and abilities', () => {
  assert.equal(suggestMatch('pikachisu', ['Bulbasaur', 'Pikachu', 'Charizard']), 'Pikachu');
  assert.equal(suggestMatch('chocie band', ['Leftovers', 'Choice Band', 'Choice Specs']), 'Choice Band');
  assert.equal(suggestMatch('tunderblot', ['Thunder Wave', 'Thunderbolt', 'Flamethrower']), 'Thunderbolt');
  assert.equal(suggestMatch('leviatte', ['Drizzle', 'Levitate', 'Intimidate']), 'Levitate');
});

test('suggestMatch ignores short, numeric, exact and unrelated queries', () => {
  assert.equal(suggestMatch('ab', ['Abra', 'Absol']), null);
  assert.equal(suggestMatch('25', ['Pikachu']), null);
  assert.equal(suggestMatch('pikachu', ['Pikachu', 'Raichu']), null);
  assert.equal(suggestMatch('xyzqwerty', ['Pikachu', 'Charizard']), null);
});

test('filterAbilitiesWithSuggestion suggests within active category and generation scope', () => {
  const entries = [
    { slug: 'drizzle', name: 'Drizzle', generation: 3 },
    { slug: 'levitate', name: 'Levitate', generation: 3 },
    { slug: 'intimidate', name: 'Intimidate', generation: 3 },
  ];

  const match = filterAbilitiesWithSuggestion(entries, { q: 'leviatte', category: 'defense' });
  assert.equal(match.suggestion, 'Levitate');
  assert.deepEqual(match.entries.map((e) => e.slug), ['levitate']);

  const outOfScope = filterAbilitiesWithSuggestion(entries, { q: 'leviatte', category: 'weather' });
  assert.equal(outOfScope.suggestion, null);
  assert.equal(outOfScope.entries.length, 0);
});
