import { statLabels, roles, sprite } from "./api.js";
const safe = (value) =>
  String(value ?? "")
    .replaceAll("♀", " F")
    .replaceAll("♂", " M")
    .replaceAll("—", "-")
    .replaceAll("–", "-");
function base64(buffer) {
  let result = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 8192)
    result += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(result);
}
async function portrait(pokemon) {
  const response = await fetch(sprite(pokemon) + "?style=artwork");
  if (!response.ok)
    throw Error("A imagem deste Pokémon não está disponível para o PDF.");
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#202c3d";
  ctx.beginPath();
  ctx.arc(320, 320, 285, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#e7bd61";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(320, 320, 285, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowColor = "#00000055";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 15;
  const scale = Math.min(540 / bitmap.width, 540 / bitmap.height);
  ctx.drawImage(
    bitmap,
    (640 - bitmap.width * scale) / 2,
    (640 - bitmap.height * scale) / 2,
    bitmap.width * scale,
    bitmap.height * scale,
  );
  bitmap.close();
  return canvas.toDataURL("image/png");
}
/** Geração local: o documento não exige cadastro nem envia a build a terceiros. */
export async function buildPdf(
  build,
  { download = true, analysis = null } = {},
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const font = await fetch("/fonts/Barlow-Regular.ttf");
  if (!font.ok) throw Error("Não foi possível carregar a fonte do documento.");
  doc.addFileToVFS("Barlow-Regular.ttf", base64(await font.arrayBuffer()));
  doc.addFont("Barlow-Regular.ttf", "Barlow", "normal");
  doc.setFont("Barlow");
  doc.setProperties({
    title: `${build.pokemon} - ${build.name} | illke`,
    subject: "Ficha de build Pokémon",
    author: "illke",
  });
  const image = await portrait(build.pokemon);
  const text = (value, x, y, size = 11, color = "#202c3d", options = {}) => {
    doc.setTextColor(color);
    doc.setFontSize(size);
    doc.text(safe(value), x, y, options);
  };
  doc.setFillColor("#111723");
  doc.rect(0, 0, 210, 86, "F");
  doc.setFillColor("#e7bd61");
  doc.rect(14, 15, 3, 9, "F");
  text("illke", 21, 22, 22, "#e8edf6");
  text("Ficha de batalha", 14, 35, 10, "#a6b2c7");
  const title = doc.splitTextToSize(safe(build.pokemon), 111);
  text(title, 14, 50, title.length > 1 ? 25 : 29, "#e8edf6");
  text(
    doc.splitTextToSize(safe(build.name), 110).slice(0, 2),
    14,
    70,
    13,
    "#e7bd61",
  );
  text(`${build.context_id}  /  Nível ${build.level}`, 14, 83, 10, "#a6b2c7");
  doc.addImage(image, "PNG", 138, 17, 61, 61);
  let y = 95;
  function rule() {
    doc.setDrawColor("#d7dfe9");
    doc.line(14, y, 196, y);
    y += 8;
  }
  function newPage() {
    doc.addPage();
    y = 20;
    text(build.pokemon + " / " + build.name, 14, y, 14);
    y += 12;
  }
  function ensure(height) {
    if (y + height > 265) newPage();
  }
  function section(title) {
    ensure(22);
    text(title, 14, y, 16);
    y += 9;
  }
  function paragraph(value, width = 182) {
    const lines = doc.splitTextToSize(safe(value), width);
    for (const line of lines) {
      ensure(6);
      text(line, 14, y, 11);
      y += 5.5;
    }
    y += 5;
  }
  const fields = [
    ["Função", roles[build.role] || build.role],
    ["Habilidade", build.ability || "Não se aplica"],
    ["Item", build.item || "Sem item"],
    ["Nature", build.nature],
    ["Tipo Tera", build.tera_type || "Não informado"],
    ["Formato", build.context_id],
  ];
  for (let i = 0; i < fields.length; i += 2) {
    for (let j = 0; j < 2; j++) {
      const [label, value] = fields[i + j];
      const x = j ? 108 : 14;
      text(label, x, y, 9, "#52617a");
      text(doc.splitTextToSize(safe(value), 85).slice(0, 2), x, y + 6, 12);
    }
    y += 16;
  }
  rule();
  section("Golpes");
  for (const [index, move] of build.moves.filter(Boolean).entries()) {
    text(String(index + 1).padStart(2, "0"), 14, y, 10, "#875a08");
    text(move, 27, y, 12);
    y += 7;
  }
  y += 4;
  ensure(42);
  rule();
  section("Treinamento");
  const columns = Object.keys(statLabels);
  columns.forEach((s, i) =>
    text(statLabels[s], 41 + i * 25, y, 8, "#52617a", { align: "center" }),
  );
  y += 8;
  text("EVs", 14, y, 10);
  columns.forEach((s, i) =>
    text(build.evs[s] ?? 0, 41 + i * 25, y, 11, "#202c3d", { align: "center" }),
  );
  y += 8;
  text("IVs", 14, y, 10);
  columns.forEach((s, i) =>
    text(build.ivs[s] ?? 31, 41 + i * 25, y, 11, "#202c3d", {
      align: "center",
    }),
  );
  y += 12;
  if (build.strategy) {
    section("Estratégia");
    paragraph(build.strategy);
  }
  if (analysis) {
    section("Análise do conjunto");
    paragraph(
      analysis.legality?.status === "legal"
        ? "Conjunto legal no formato do simulador. A obtenção no cartucho não foi comprovada."
        : "Conjunto não validado ou com incompatibilidades.",
    );
  }
  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    text(
      "Imagem: PokeAPI/sprites. Pokémon pertence aos respectivos titulares.",
      14,
      273,
      8,
      "#52617a",
    );
    text(
      "Esta ficha depende das regras do formato e não comprova chance de vitória.",
      14,
      278,
      8,
      "#52617a",
    );
    doc.setDrawColor("#d7dfe9");
    doc.line(14, 282, 196, 282);
    text("illke / " + build.context_id, 14, 289, 9, "#52617a");
    text(`${page} / ${count}`, 196, 289, 9, "#52617a", { align: "right" });
  }
  if (download)
    doc.save(
      "illke-" +
        build.pokemon.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
        ".pdf",
    );
  return doc;
}
