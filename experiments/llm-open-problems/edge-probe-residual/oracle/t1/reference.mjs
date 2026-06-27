// Vendored from gsd-core feat/non-inferable-pipeline
// vendored from the non-inferable corpus (original path redacted) -- reference.mjs
// Source commit: c0d41ff5014de79a023fcbe9fdde01220055cec5
// Reference: STABLE descending — equal-score items keep their input order (V8 sort is stable).
export function sortByScore(items) {
  return items.map((x) => ({ ...x })).sort((a, b) => b.score - a.score);
}
