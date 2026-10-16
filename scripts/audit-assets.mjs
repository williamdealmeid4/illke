import { readFile } from "node:fs/promises";
const catalog = JSON.parse(
  await readFile(new URL("../.data/catalog.json", import.meta.url), "utf8"),
);
const pokemon = catalog.entities.filter((e) => e.kind === "pokemon");
console.log(
  JSON.stringify(
    {
      revision: catalog.sprite_revision,
      total: pokemon.length,
      associated: pokemon.filter((p) => p.image).length,
      missing: pokemon.filter((p) => !p.image).map((p) => p.slug),
      scope: "Sprites genéricos. Associação exata a jogos ainda não auditada.",
    },
    null,
    2,
  ),
);
