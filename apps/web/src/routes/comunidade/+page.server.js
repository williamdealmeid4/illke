import { readApi } from "$lib/api.js";
export async function load({ fetch, url }) {
  try {
    return {
      topics: await readApi(fetch, "/topics?" + url.searchParams),
      query: Object.fromEntries(url.searchParams),
      error: null,
    };
  } catch (e) {
    return {
      topics: null,
      query: Object.fromEntries(url.searchParams),
      error: e.message,
    };
  }
}
