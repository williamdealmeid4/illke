import { readApi } from "$lib/api.js";
export async function load({ fetch }) {
  try {
    return { report: await readApi(fetch, "/coverage"), error: null };
  } catch (e) {
    return { report: null, error: e.message };
  }
}
