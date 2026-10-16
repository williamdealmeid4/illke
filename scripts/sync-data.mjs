import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { createRequire } from "node:module";
import { parse } from "csv-parse/sync";
import { createHash } from "node:crypto";
import { catalogGeneration } from "./lib/catalog-generation.mjs";
const require = createRequire(import.meta.url);
const { Dex, TeamValidator } = require("pokemon-showdown");
const root = new URL("../.data/", import.meta.url);
await mkdir(root, { recursive: true });
async function get(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw Error(`${res.status}: ${url}`);
  return res.text();
}
async function csv(name, revision) {
  const path = new URL(`${name}-${revision}.csv`, root);
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch {
    text = await get(
      `https://raw.githubusercontent.com/PokeAPI/pokeapi/${revision}/data/v2/csv/${name}.csv`,
    );
    await writeFile(path, text);
  }
  return parse(text, { columns: true, skip_empty_lines: true });
}
const revision = JSON.parse(
  await get("https://api.github.com/repos/PokeAPI/pokeapi/commits/master"),
).sha;
const spriteRevision = JSON.parse(
  await get("https://api.github.com/repos/PokeAPI/sprites/commits/master"),
).sha;
console.log("Importando PokéAPI", revision.slice(0, 12));
const names = [
  "pokemon",
  "pokemon_species",
  "pokemon_types",
  "types",
  "pokemon_stats",
  "stats",
  "pokemon_abilities",
  "abilities",
  "items",
  "item_names",
  "item_prose",
  "moves",
  "move_names",
  "move_effect_prose",
  "version_groups",
  "versions",
  "pokemon_evolution",
  "pokemon_forms",
  "pokemon_species_names",
  "pokemon_game_indices",
  "pokemon_dex_numbers",
];
const tables = Object.fromEntries(
  await Promise.all(names.map(async (n) => [n, await csv(n, revision)])),
);
const byId = (name) => new Map(tables[name].map((x) => [x.id, x]));
const grouped = (rows, key) => {
  const map = new Map();
  for (const row of rows) {
    const id = row[key];
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(row);
  }
  return map;
};
const typeMap = byId("types"),
  statMap = byId("stats"),
  abilityMap = byId("abilities"),
  speciesMap = byId("pokemon_species");
const types = grouped(tables.pokemon_types, "pokemon_id"),
  stats = grouped(tables.pokemon_stats, "pokemon_id"),
  abilities = grouped(tables.pokemon_abilities, "pokemon_id");
const gameIndices = grouped(tables.pokemon_game_indices, "pokemon_id"),
  evolutions = grouped(tables.pokemon_species, "evolves_from_species_id");
const tree = async (sha) =>
  JSON.parse(
    await get(`https://api.github.com/repos/PokeAPI/sprites/git/trees/${sha}`),
  );
const rootTree = await tree(spriteRevision);
const spritesTree = await tree(
  rootTree.tree.find((x) => x.path === "sprites").sha,
);
const pokemonTree = await tree(
  spritesTree.tree.find((x) => x.path === "pokemon").sha,
);
const imagePaths = new Set(
  pokemonTree.tree
    .filter((x) => x.type === "blob")
    .map((x) => "sprites/pokemon/" + x.path),
);
for (const folder of ["back", "shiny"]) {
  const child = await tree(pokemonTree.tree.find((x) => x.path === folder).sha);
  for (const entry of child.tree.filter((x) => x.type === "blob"))
    imagePaths.add(`sprites/pokemon/${folder}/${entry.path}`);
}
const other = await tree(pokemonTree.tree.find((x) => x.path === "other").sha);
const art = await tree(
  other.tree.find((x) => x.path === "official-artwork").sha,
);
for (const entry of art.tree.filter((x) => x.type === "blob"))
  imagePaths.add("sprites/pokemon/other/official-artwork/" + entry.path);
const itemsTree = await tree(
  spritesTree.tree.find((x) => x.path === "items").sha,
);
for (const entry of itemsTree.tree.filter((x) => x.type === "blob"))
  imagePaths.add("sprites/items/" + entry.path);
const imageBase = `https://raw.githubusercontent.com/PokeAPI/sprites/${spriteRevision}/`;
function image(path) {
  return imagePaths.has(path)
    ? {
        url: imageBase + path,
        path,
        source: "PokeAPI/sprites",
        revision: spriteRevision,
        scope: "generic",
        exact_game: false,
      }
    : null;
}
const enNames = new Map(
  tables.pokemon_species_names
    .filter((x) => x.local_language_id === "9")
    .map((x) => [x.pokemon_species_id, x.name]),
);
const showdownSpecies = new Map(
  Dex.species
    .all()
    .filter((x) => x.exists)
    .map((x) => [Dex.toID(x.name), x]),
);
const formsByPokemon = grouped(tables.pokemon_forms, "pokemon_id");
const versionGroupsById = byId("version_groups");
const entities = [];
for (const p of tables.pokemon) {
  const s = speciesMap.get(p.species_id);
  const candidate =
    showdownSpecies.get(Dex.toID(p.identifier)) ||
    Dex.species
      .all()
      .find(
        (x) =>
          x.num === +p.species_id &&
          ((p.is_default === "1" && !x.forme) ||
            Dex.toID(x.forme) ===
              Dex.toID(p.identifier.replace(s.identifier + "-", ""))),
      );
  entities.push({
    kind: "pokemon",
    slug: p.identifier,
    name:
      candidate?.name ||
      (p.is_default === "1" ? enNames.get(p.species_id) : null) ||
      p.identifier,
    national_number: +p.species_id,
    generation: catalogGeneration(
      +s.generation_id,
      candidate?.gen,
      p.is_default === "1",
      (formsByPokemon.get(p.id) || []).map((form) =>
        Number(
          versionGroupsById.get(form.introduced_in_version_group_id)
            ?.generation_id,
        ),
      ),
    ),
    image: image(`sprites/pokemon/${p.id}.png`),
    attributes: {
      pokeapi_id: +p.id,
      species_slug: s.identifier,
      showdown_id: candidate?.id || null,
      is_default: p.is_default === "1",
      types: (types.get(p.id) || []).map(
        (x) => typeMap.get(x.type_id).identifier,
      ),
      stats: Object.fromEntries(
        (stats.get(p.id) || []).map((x) => [
          statMap.get(x.stat_id).identifier,
          +x.base_stat,
        ]),
      ),
      abilities: (abilities.get(p.id) || []).map((x) => ({
        name: abilityMap.get(x.ability_id).identifier,
        hidden: x.is_hidden === "1",
      })),
      height: +p.height / 10,
      weight: +p.weight / 10,
      evolves_from: s.evolves_from_species_id
        ? speciesMap.get(s.evolves_from_species_id)?.identifier
        : null,
      evolves_to: (evolutions.get(p.species_id) || []).map((x) => x.identifier),
      game_indices: (gameIndices.get(p.id) || []).map((x) => +x.version_id),
      availability_scope:
        "game_indices are historical indices, not proof of obtainability",
      sprites: {
        front: image(`sprites/pokemon/${p.id}.png`),
        back: image(`sprites/pokemon/back/${p.id}.png`),
        shiny: image(`sprites/pokemon/shiny/${p.id}.png`),
        artwork: image(`sprites/pokemon/other/official-artwork/${p.id}.png`),
      },
    },
  });
}
const itemNames = new Map(
  tables.item_names
    .filter((x) => x.local_language_id === "9")
    .map((x) => [x.item_id, x.name]),
);
const itemProse = new Map(
  tables.item_prose
    .filter((x) => x.local_language_id === "9")
    .map((x) => [x.item_id, x.short_effect]),
);
for (const i of tables.items)
  entities.push({
    kind: "item",
    slug: i.identifier,
    name: itemNames.get(i.id) || i.identifier,
    national_number: +i.id,
    generation: null,
    image: image(`sprites/items/${i.identifier}.png`),
    attributes: {
      cost: +i.cost,
      effect: itemProse.get(i.id) || "",
      showdown: Dex.items.get(i.identifier).exists
        ? Dex.items.get(i.identifier).name
        : null,
    },
  });
const moveNames = new Map(
  tables.move_names
    .filter((x) => x.local_language_id === "9")
    .map((x) => [x.move_id, x.name]),
);
const effects = new Map(
  tables.move_effect_prose
    .filter((x) => x.local_language_id === "9")
    .map((x) => [x.move_effect_id, x.short_effect]),
);
for (const m of tables.moves)
  entities.push({
    kind: "move",
    slug: m.identifier,
    name: moveNames.get(m.id) || m.identifier,
    national_number: +m.id,
    generation: +m.generation_id,
    image: null,
    attributes: {
      type: typeMap.get(m.type_id)?.identifier,
      power: m.power ? +m.power : null,
      accuracy: m.accuracy ? +m.accuracy : null,
      pp: +m.pp,
      priority: +m.priority,
      category: { 1: "status", 2: "physical", 3: "special" }[m.damage_class_id],
      effect: effects.get(m.effect_id) || "",
    },
  });
for (const a of tables.abilities)
  entities.push({
    kind: "ability",
    slug: a.identifier,
    name: Dex.abilities.get(a.identifier).name || a.identifier,
    national_number: +a.id,
    generation: +a.generation_id,
    image: null,
    attributes: { effect: Dex.abilities.get(a.identifier).desc || "" },
  });
const builds = [];
const imports = [];
for (let gen = 1; gen <= 9; gen++) {
  const format = `gen${gen}ou`;
  try {
    const sets = JSON.parse(
      await get(`https://data.pkmn.cc/sets/${format}.json`),
    );
    const validator = new TeamValidator(format);
    for (const [pokemon, entries] of Object.entries(sets))
      for (const [name, alternatives] of Object.entries(entries)) {
        const first = (v) => (Array.isArray(v) ? v[0] : v);
        const evs = Object.fromEntries(
          ["hp", "atk", "def", "spa", "spd", "spe"].map((s) => [
            s,
            alternatives.evs?.[s] ?? 0,
          ]),
        );
        const ivs = Object.fromEntries(
          ["hp", "atk", "def", "spa", "spd", "spe"].map((s) => [
            s,
            alternatives.ivs?.[s] ?? 31,
          ]),
        );
        const set = {
          species: pokemon,
          name,
          level: 100,
          item: first(alternatives.item) || "",
          ability: first(alternatives.ability) || "",
          nature: first(alternatives.nature) || "Serious",
          moves: (alternatives.moves || []).map(first),
          evs,
          ivs,
          teraType: first(alternatives.teratypes) || undefined,
        };
        const issues = validator.validateSet(structuredClone(set), {}) || [];
        const role =
          evs.hp + evs.def + evs.spd > evs.atk + evs.spa + evs.spe
            ? "wall"
            : evs.atk > evs.spa
              ? "physical-attacker"
              : "special-attacker";
        const build = {
          name,
          context_id: `gen${gen}ou`,
          pokemon,
          level: 100,
          item: set.item,
          ability: set.ability,
          nature: set.nature,
          moves: set.moves,
          evs,
          ivs,
          tera_type: set.teraType || "",
          role,
          strategy: `${name}: configuração de referência para ${pokemon} em ${format}. ${role === "wall" ? "O treinamento prioriza resistência." : role === "physical-attacker" ? "O treinamento favorece pressão física." : "O treinamento favorece pressão especial."} Consulte as alternativas e o contexto antes de adaptar à sua equipe.`,
          visibility: "public",
        };
        builds.push({
          slug: createHash("sha256")
            .update(JSON.stringify([format, pokemon, name]))
            .digest("hex")
            .slice(0, 24),
          ...build,
          alternatives,
          source_url: `https://data.pkmn.cc/sets/${format}.json`,
          source_name: "Smogon / pkmn",
          legality: issues.length ? "illegal" : "legal",
          issues,
        });
      }
    imports.push({
      format,
      status: "imported",
      count: builds.filter((b) => b.context_id === format).length,
    });
  } catch (e) {
    imports.push({ format, status: "unavailable", message: e.message });
  }
}
const collisions = [];
const entityKeys = new Set();
for (const entry of entities) {
  const key = entry.kind + ":" + entry.slug;
  if (entityKeys.has(key)) {
    collisions.push({
      kind: entry.kind,
      slug: entry.slug,
      id: entry.national_number,
    });
    entry.slug += "-" + entry.national_number;
  }
  entityKeys.add(entry.kind + ":" + entry.slug);
}
const output = {
  collisions,
  revision,
  sprite_revision: spriteRevision,
  imported_at: new Date().toISOString(),
  source: "https://github.com/PokeAPI/pokeapi",
  entities,
  builds,
  games: tables.versions.map((v) => ({
    ...v,
    ...{
      generation: tables.version_groups.find((g) => g.id === v.version_group_id)
        ?.generation_id,
    },
  })),
  imports,
  coverage: {
    pokemon: entities.filter((e) => e.kind === "pokemon").length,
    items: entities.filter((e) => e.kind === "item").length,
    moves: entities.filter((e) => e.kind === "move").length,
    abilities: entities.filter((e) => e.kind === "ability").length,
    sprites: entities.filter((e) => e.kind === "pokemon" && e.image).length,
    builds: builds.length,
    obtainability: "partial",
    historical_learnsets: "engine-generation-only",
  },
};
await writeFile(new URL("catalog.tmp.json", root), JSON.stringify(output));
await rename(new URL("catalog.tmp.json", root), new URL("catalog.json", root));
console.log(JSON.stringify(output.coverage, null, 2));
