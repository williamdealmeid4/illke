import { readApi } from "$lib/api.js";
export async function load({ fetch, url }) {
  try {
    return {
      catalog: await readApi(fetch, "/catalog/ability?" + url.searchParams),
      kind: "ability",
      title: "Habilidades",
      query: Object.fromEntries(url.searchParams),
      error: null,
    };
  } catch (e) {
    return {
      catalog: null,
      kind: "ability",
      title: "Habilidades",
      query: Object.fromEntries(url.searchParams),
      error: e.message,
    };
  }
}
