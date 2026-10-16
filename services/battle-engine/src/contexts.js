export const contexts = Array.from({ length: 9 }, (_, index) => {
  const generation = index + 1;
  return {
    id: `gen${generation}ou`,
    label: `Geração ${generation} · Singles OU`,
    generation,
    format: `gen${generation}ou`,
    status: "supported",
    scope:
      "Formato do simulador; não comprova obtenção em um cartucho específico.",
    default_level: 100,
    capabilities: {
      nature: generation >= 3,
      evs: true,
      ivs: true,
      ability: generation >= 3,
      held_item: generation >= 2,
      tera: generation === 9,
      mega: generation === 6 || generation === 7,
      dynamax: false,
      max_moves: 4,
      ev_max: 252,
      ev_total: generation <= 2 ? 1512 : 510,
      iv_max: 31,
    },
  };
});
contexts[8].label = "Scarlet / Violet · Singles OU";
export function getContext(id = "gen9ou") {
  const context = contexts.find(
    (c) => c.id === (id === "sv-ou-r1" ? "gen9ou" : id),
  );
  if (!context) throw Error("Contexto não suportado pelo motor.");
  return context;
}
