import { readApi } from "$lib/api.js";
import { error } from "@sveltejs/kit";
export async function load({ fetch, params }) {
  let entry;
  try {
    entry = await readApi(fetch, "/catalog/item/" + params.slug);
  } catch {
    error(404, "Registro não encontrado.");
  }
  let builds = null;
  if ("item" === "pokemon") {
    try {
      builds = await readApi(
        fetch,
        "/builds?q=" + encodeURIComponent(entry.name) + "&context_id=gen9ou",
      );
    } catch {}
  }
  return { entry, builds };
}
