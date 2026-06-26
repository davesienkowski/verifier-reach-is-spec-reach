// Reference: STABLE descending — equal-score items keep their input order (V8 sort is stable).
export function sortByScore(items) {
  return items.map((x) => ({ ...x })).sort((a, b) => b.score - a.score);
}
