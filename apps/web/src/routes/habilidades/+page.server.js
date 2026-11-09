import { readApi } from '$lib/api.js';
import { abilityCategories, filterAbilities, paginateAbilities } from '$lib/abilities.js';

// Filter complete successful API snapshots; failed requests are never cached.
let cached = null;
let expires = 0;
let pending = null;
async function allAbilities(fetch) {
  if (cached && Date.now() < expires) return cached;
  if (!pending) pending = (async () => {
    const first = await readApi(fetch, '/catalog/ability?page=1');
    const rest = await Promise.all(Array.from({ length: Math.max(0, first.last_page - 1) },
      (_, index) => readApi(fetch, `/catalog/ability?page=${index + 2}`)));
    cached = [first, ...rest].flatMap((page) => page.data);
    expires = Date.now() + 300_000;
    return cached;
  })().finally(() => { pending = null; });
  return pending;
}

export async function load({ fetch, url }) {
  const query = Object.fromEntries(url.searchParams);
  if (!abilityCategories.some((category) => category.id === query.category)) query.category = '';
  if (!/^[1-9]$/.test(query.generation || '')) query.generation = '';
  try {
    const entries = await allAbilities(fetch);
    const scope = filterAbilities(entries, { ...query, category: '' });
    return { query, catalog: paginateAbilities(filterAbilities(entries, query), url),
      categories: abilityCategories.map((category) => ({ ...category,
        count: category.id === 'all' ? scope.length : filterAbilities(scope, { category: category.id }).length })),
      total: entries.length, error: null };
  } catch {
    return { query, catalog: null, categories: abilityCategories, total: 0,
      error: 'Não foi possível carregar as habilidades. Tente novamente em instantes.' };
  }
}
