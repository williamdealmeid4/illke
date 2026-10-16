/** Mensagens nunca interpretam menções fornecidas pelo visitante. */
export function buildMessage({ id, configuration: b, image_url }) {
  const clean = (text, max = 1024) => String(text ?? "").slice(0, max);
  const training = Object.entries(b.evs)
    .filter(([, v]) => v)
    .map(([s, v]) => `${v} ${s.toUpperCase()}`)
    .join(" / ");
  return {
    nonce: id.replaceAll("-", "").slice(0, 25),
    enforce_nonce: true,
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: clean(`${b.pokemon} | ${b.name}`, 256),
        description: clean(
          b.strategy || "Build compartilhada pelo builder do illke.",
          3500,
        ),
        color: 0xe7bd61,
        ...(image_url ? { thumbnail: { url: image_url } } : {}),
        fields: [
          { name: "Formato", value: clean(b.context_id), inline: true },
          {
            name: "Nível / Nature",
            value: clean(`${b.level} / ${b.nature}`),
            inline: true,
          },
          {
            name: "Habilidade",
            value: clean(b.ability || "Não se aplica"),
            inline: true,
          },
          { name: "Item", value: clean(b.item || "Sem item"), inline: true },
          {
            name: "Tera",
            value: clean(b.tera_type || "Não informado"),
            inline: true,
          },
          { name: "Função", value: clean(b.role), inline: true },
          { name: "Golpes", value: clean(b.moves.join("\n")) },
          { name: "EVs", value: clean(training || "Sem distribuição") },
          {
            name: "IVs",
            value: clean(
              Object.entries(b.ivs)
                .map(([s, v]) => `${v} ${s.toUpperCase()}`)
                .join(" / "),
            ),
          },
        ],
        footer: {
          text: "illke · Legalidade do conjunto no simulador; sem promessa de taxa de vitória.",
        },
      },
    ],
  };
}
