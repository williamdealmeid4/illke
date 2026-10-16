import { readApi } from "$lib/api.js";
const stats = (v) =>
  Object.fromEntries(
    ["hp", "atk", "def", "spa", "spd", "spe"].map((s) => [s, v]),
  );
export async function load({ fetch, url, request }) {
  try {
    let initial = {
      name: "Minha build",
      context_id: url.searchParams.get("context_id") || "gen9ou",
      pokemon: url.searchParams.get("pokemon") || "Garchomp",
      level: 100,
      nature: "Jolly",
      ability: "Rough Skin",
      item: "",
      moves: [],
      evs: stats(0),
      ivs: stats(31),
      tera_type: "",
      role: "physical-attacker",
      strategy: "",
      visibility: "private",
    };
    if (url.searchParams.has("build")) {
      const b = await readApi(
        fetch,
        "/builds/" + url.searchParams.get("build"),
        request.headers.get("cookie") || "",
      );
      initial = { ...b.configuration, visibility: "private" };
    }
    const [options, species] = await Promise.all([
      readApi(
        fetch,
        "/options?" +
          new URLSearchParams({
            pokemon: initial.pokemon,
            context_id: initial.context_id,
          }),
      ),
      readApi(fetch, "/species"),
    ]);
    if (!url.searchParams.has("build"))
      if (!options.abilities?.includes(initial.ability)) {
        initial.ability = options.abilities?.[0] || "";
      }
    return {
      initial,
      options,
      species: species.filter(
        (p) =>
          p.num > 0 && !["CAP", "Custom", "Pokestar"].includes(p.nonstandard),
      ),
      explicit:
        url.searchParams.has("build") || url.searchParams.has("pokemon"),
      error: null,
    };
  } catch (e) {
    return { initial: null, options: null, species: [], error: e.message };
  }
}
