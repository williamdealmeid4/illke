import { readApi } from "$lib/api.js";
import { emptyBuild, referenceBuilds } from '$lib/builder.js';
export async function load({ fetch, url, request }) {
  try {
    let initial = {
      ...emptyBuild(url.searchParams.get("context_id") || "gen9ou"),
      pokemon: url.searchParams.get("pokemon") || "",
    };
    if (url.searchParams.has("build")) {
      const b = await readApi(
        fetch,
        "/builds/" + url.searchParams.get("build"),
        request.headers.get("cookie") || "",
      );
      initial = { ...b.configuration, visibility: "private" };
      for(const [field,source] of [['item','item'],['ability','ability'],['nature','nature'],['tera_type','teratypes']]) {
        const candidate=url.searchParams.get(field);
        const values=[b.alternatives?.[source]||[]].flat(2);
        if(candidate&&values.includes(candidate))initial[field]=candidate;
      }
      for(let slot=0;slot<4;slot++){
        const candidate=url.searchParams.get('move_'+slot),values=[b.alternatives?.moves?.[slot]||[]].flat(2);
        if(candidate&&values.includes(candidate))initial.moves[slot]=candidate;
      }
    }
    const references = initial.pokemon ? await referenceBuilds(fetch, initial.pokemon, initial.context_id) : [];
    if (!url.searchParams.has('build') && initial.pokemon && references.length) {
      initial = { ...emptyBuild(initial.context_id), ...references[0].configuration, visibility: 'private' };
    }
    const [options, species] = await Promise.all([
      initial.pokemon ? readApi(
        fetch,
        "/options?" +
          new URLSearchParams({
            pokemon: initial.pokemon,
            context_id: initial.context_id,
          }),
      ) : null,
      readApi(fetch, "/species"),
    ]);
    if (!url.searchParams.has("build"))
      if (options && !options.abilities?.includes(initial.ability)) {
        initial.ability = options.abilities?.[0] || "";
      }
    return {
      initial,
      options,
      references,
      species: species.filter(
        (p) =>
          p.num > 0 && !["CAP", "Custom", "Pokestar"].includes(p.nonstandard),
      ),
      explicit:
        url.searchParams.has("build") ||
        url.searchParams.has("pokemon") ||
        url.searchParams.has("context_id"),
      error: null,
    };
  } catch (e) {
    return { initial: null, options: null, species: [], error: e.message };
  }
}
