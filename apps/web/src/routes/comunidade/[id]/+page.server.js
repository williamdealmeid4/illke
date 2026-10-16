import { readApi } from "$lib/api.js";
import { error } from "@sveltejs/kit";
export async function load({ fetch, params, url }) {
  try {
    return await readApi(fetch, "/topics/" + params.id + url.search);
  } catch {
    error(404, "Tópico não encontrado.");
  }
}
