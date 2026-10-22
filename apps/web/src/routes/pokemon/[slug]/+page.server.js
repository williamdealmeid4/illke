import { readApi } from "$lib/api.js";
import { error } from "@sveltejs/kit";
import { loadGuide } from "$lib/server/guides.js";
export async function load({ fetch, params, parent, url }) {
  let entry;
  try { entry = await readApi(fetch, "/catalog/pokemon/" + encodeURIComponent(params.slug)); }
  catch (cause) { error(cause.status === 404 ? 404 : 503, cause.message); }
  const { selectedGame } = await parent();
  const context = /^gen[1-9]ou$/.test(url.searchParams.get("context_id") || "") ? url.searchParams.get("context_id") : selectedGame?.generation && selectedGame.generation <= 9 ? `gen${selectedGame.generation}ou` : "gen9ou";
  const [guide, builds] = await Promise.all([
    loadGuide(entry, selectedGame?.id),
    entry.kind === "pokemon" ? readApi(fetch, "/builds?" + new URLSearchParams({q:entry.name, context_id:context})).catch(()=>null) : null,
  ]);
  return { entry, guide, builds, referenceContext:context };
}
