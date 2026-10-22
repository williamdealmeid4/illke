import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Dex } = require("pokemon-showdown");
const revision = "6e7928dcbd547d50b5c644fe76e093e8da98ac3f";
const root = new URL("../apps/web/static/icons/", import.meta.url);
const types = [
  "normal",
  "fighting",
  "flying",
  "poison",
  "ground",
  "rock",
  "bug",
  "ghost",
  "steel",
  "fire",
  "water",
  "grass",
  "electric",
  "psychic",
  "ice",
  "dragon",
  "dark",
  "fairy",
  "stellar",
];
const manifest = {
  types: {},
  categories: {},
  items: {},
  moves: {},
  sources: {
    pokeapi: { url: "https://github.com/PokeAPI/sprites", revision },
    showdown: {
      url: "https://play.pokemonshowdown.com/sprites/",
      version: require("pokemon-showdown/package.json").version,
    },
  },
  files: [],
};
await mkdir(new URL("types/", root), { recursive: true });
await mkdir(new URL("categories/", root), { recursive: true });
async function download(source, path) {
  const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error("Imagem indisponível: " + source);
  const data = Buffer.from(await response.arrayBuffer());
  if (data.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a")
    throw Error("O arquivo não é PNG: " + source);
  await writeFile(new URL(path, root), data);
  manifest.files.push({
    path,
    source,
    sha256: createHash("sha256").update(data).digest("hex"),
  });
  return "/icons/" + path;
}
await Promise.all(
  types.map(async (type, index) => {
    manifest.types[type] = await download(
      `https://raw.githubusercontent.com/PokeAPI/sprites/${revision}/sprites/types/${type === "stellar" ? "generation-ix/scarlet-violet" : "generation-viii/sword-shield"}/small/${index + 1}.png`,
      `types/${type}.png`,
    );
  }),
);
await Promise.all(
  ["physical", "special", "status"].map(async (category) => {
    manifest.categories[category] = await download(
      `https://play.pokemonshowdown.com/sprites/categories/${category[0].toUpperCase() + category.slice(1)}.png`,
      `categories/${category}.png`,
    );
  }),
);
manifest.item_sheet = await download(
  "https://play.pokemonshowdown.com/sprites/itemicons-sheet.png",
  "itemicons-sheet.png",
);
for (const item of Dex.items.all()) {
  if (
    item.exists &&
    Number.isInteger(item.spritenum) &&
    item.spritenum > 0 &&
    item.spritenum < 768
  )
    manifest.items[item.id] = item.spritenum;
}
for (const move of Dex.moves.all()) {
  if (move.exists && manifest.types[move.type.toLowerCase()])
    manifest.moves[move.id] = {
      type: move.type.toLowerCase(),
      category: move.category.toLowerCase(),
    };
}
manifest.files.sort((a, b) => a.path.localeCompare(b.path));
await writeFile(
  new URL("manifest.json", root),
  JSON.stringify(manifest, null, 2) + "\n",
);
await writeFile(
  new URL("../apps/web/src/lib/icons-manifest.json", import.meta.url),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `${Object.keys(manifest.types).length} tipos, ${Object.keys(manifest.categories).length} categorias e ${Object.keys(manifest.items).length} associações de itens.`,
);
