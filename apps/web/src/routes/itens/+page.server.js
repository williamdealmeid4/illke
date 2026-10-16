import { readApi } from "$lib/api.js";
export async function load({ fetch, url }) {
  try {
    return {
      catalog: await readApi(fetch, "/catalog/item?" + url.searchParams),
      kind: "item",
      title: "Itens",
      query: Object.fromEntries(url.searchParams),
      error: null,
    };
  } catch (e) {
    return {
      catalog: null,
      kind: "item",
      title: "Itens",
      query: Object.fromEntries(url.searchParams),
      error: e.message,
    };
  }
}
