import { readApi } from "$lib/api.js";
import { error } from "@sveltejs/kit";
import { captureGuide } from '$lib/server/capture.js';
export async function load({ fetch, params, url }) {
  const context_id = /^gen[1-9]ou$/.test(url.searchParams.get('context_id') || '') ? url.searchParams.get('context_id') : 'gen9ou';
  let entry;
  try {
    entry = await readApi(fetch, "/catalog/pokemon/" + params.slug);
  } catch {
    error(404, "Registro não encontrado.");
  }
  let builds = null;
  if ("pokemon" === "pokemon") {
    try {
      builds = await readApi(
        fetch,
        "/builds?q=" + encodeURIComponent(entry.name) + '&context_id=' + context_id,
      );
    } catch {}
  }
  return { entry, builds, context_id, capture:await captureGuide(entry), game:url.searchParams.get('game') };
}
