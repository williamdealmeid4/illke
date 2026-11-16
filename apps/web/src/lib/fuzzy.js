export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function compactText(normalized) {
  return normalized.replaceAll(' ', '');
}

export function damerauLevenshtein(a, b) {
  const lenA = a.length;
  const lenB = b.length;
  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  const d = Array.from({ length: lenA + 1 }, () => new Array(lenB + 1).fill(0));
  for (let i = 0; i <= lenA; i++) d[i][0] = i;
  for (let j = 0; j <= lenB; j++) d[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let val = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        val = Math.min(val, d[i - 2][j - 2] + cost);
      }
      d[i][j] = val;
    }
  }

  return d[lenA][lenB];
}

export function suggestMatch(query, candidates, getLabel = (item) => item) {
  const normQ = normalizeText(query);
  const compactQ = compactText(normQ);
  const qLen = compactQ.length;

  if (qLen < 3 || /^\d+$/.test(compactQ)) return null;

  const maxDist = qLen <= 4 ? 1 : qLen <= 7 ? 2 : qLen <= 11 ? 3 : Math.min(4, Math.floor(qLen * 0.35));
  let bestLabel = null;
  let bestScore = -Infinity;
  const seen = new Set();

  for (const item of candidates || []) {
    const label = getLabel(item);
    if (typeof label !== 'string' || !label) continue;

    const normC = normalizeText(label);
    const compactC = compactText(normC);
    if (!compactC || seen.has(compactC)) continue;
    seen.add(compactC);

    const cLen = compactC.length;
    if (Math.abs(qLen - cLen) > maxDist) continue;

    const dist = Math.min(
      damerauLevenshtein(normQ, normC),
      damerauLevenshtein(compactQ, compactC)
    );
    if (dist === 0 || dist > maxDist) continue;

    const maxLen = Math.max(qLen, cLen);
    const similarity = 1 - dist / maxLen;
    if (similarity < 0.55) continue;

    let prefixLen = 0;
    const minLen = Math.min(qLen, cLen);
    while (prefixLen < minLen && compactQ[prefixLen] === compactC[prefixLen]) {
      prefixLen++;
    }

    const firstCharBonus = compactQ[0] === compactC[0] ? 8 : 0;
    const score =
      similarity * 100 +
      firstCharBonus +
      prefixLen * 2 -
      Math.abs(cLen - qLen) * 0.5 -
      cLen * 0.05;

    if (score > bestScore) {
      bestScore = score;
      bestLabel = label;
    }
  }

  return bestLabel;
}
