import { readApi } from "$lib/api.js";
export async function load({ fetch, url }) {
  try {
    return {
      catalog: await readApi(fetch, "/catalog/pokemon?" + url.searchParams),
      kind: "pokemon",
      title: "Pokédex",
      query: Object.fromEntries(url.searchParams),
      error: null,
    };
  } catch (e) {
    return {
      catalog: null,
      kind: "pokemon",
      title: "Pokédex",
      query: Object.fromEntries(url.searchParams),
      error: e.message,
    };
  }
}
