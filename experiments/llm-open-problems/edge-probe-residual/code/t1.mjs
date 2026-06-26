export function sortByScore(items) {
  return items.map((x) => ({ ...x })).sort((a, b) => a.score - b.score).reverse();
}
