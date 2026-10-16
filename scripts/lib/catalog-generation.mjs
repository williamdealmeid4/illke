// A form has its own debut; National Dex numbering belongs to the base species.
export function catalogGeneration(
  baseGeneration,
  showdownGeneration,
  isDefault,
  formGenerations = [],
) {
  if (showdownGeneration) return Math.max(baseGeneration, showdownGeneration);
  const known = formGenerations
    .filter(Number.isFinite)
    .filter((g) => g >= baseGeneration);
  return !isDefault && known.length ? Math.min(...known) : baseGeneration;
}
