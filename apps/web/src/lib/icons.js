import manifest from "./icons-manifest.json";
export const uiIcons = manifest;
export const iconId = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
export const categoryLabels = {
  physical: "Físico",
  special: "Especial",
  status: "Status",
};
export function moveIconData(name) {
  return manifest.moves[iconId(name)] || null;
}
export function itemIconIndex(name) {
  return manifest.items[iconId(name)] ?? null;
}
