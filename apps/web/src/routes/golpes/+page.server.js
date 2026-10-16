import { readApi } from "$lib/api.js";
export async function load({ fetch, url }) {
  try {
    return {
      catalog: await readApi(fetch, "/catalog/move?" + url.searchParams),
      kind: "move",
      title: "Golpes",
      query: Object.fromEntries(url.searchParams),
      error: null,
    };
  } catch (e) {
    return {
      catalog: null,
      kind: "move",
      title: "Golpes",
      query: Object.fromEntries(url.searchParams),
      error: e.message,
    };
  }
}
