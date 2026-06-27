// Vendored from gsd-core feat/non-inferable-pipeline
// vendored from the non-inferable corpus (original path redacted) -- reference.mjs
// Source commit: c0d41ff5014de79a023fcbe9fdde01220055cec5
// Reference: touching intervals ([1,2],[2,3]) DO merge (uses `s <= last[1]`).
export function mergeIntervals(intervals) {
  const xs = intervals.map((p) => [...p]).sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [s, e] of xs) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}
