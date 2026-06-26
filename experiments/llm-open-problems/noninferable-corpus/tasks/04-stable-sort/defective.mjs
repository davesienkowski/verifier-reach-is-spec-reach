// Plausible-wrong: ascending stable sort then reverse — this FLIPS the relative order of equal-score
// items. Reads as a correct "sort descending" solution; passes visible (distinct scores). Fails held-out.
export function sortByScore(items) {
  return items.map((x) => ({ ...x })).sort((a, b) => a.score - b.score).reverse();
}
