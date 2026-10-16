import { readApi } from "$lib/api.js";
export async function load({ fetch, url }) {
  try {
    return {
      builds: await readApi(fetch, "/builds?" + url.searchParams),
      query: Object.fromEntries(url.searchParams),
      error: null,
    };
  } catch (e) {
    return {
      builds: null,
      query: Object.fromEntries(url.searchParams),
      error: e.message,
    };
  }
}
