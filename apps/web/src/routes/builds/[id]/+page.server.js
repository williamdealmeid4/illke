import { readApi } from "$lib/api.js";
import { error } from "@sveltejs/kit";
export async function load({ fetch, params, request }) {
  try {
    return {
      build: await readApi(
        fetch,
        "/builds/" + params.id,
        request.headers.get("cookie") || "",
      ),
    };
  } catch {
    error(404, "Build não encontrada.");
  }
}
