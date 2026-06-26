// INFERABLE-defect control for N17 (over-abstention measurement).
// Defect: never sorts output by start, violating the STATED must_have #2
// ("Return a new array of merged [start,end] pairs, sorted by start").
// This is INFERABLE from the spec alone — the rule is written down — so the
// correct verdict is gaps_found, and abstaining (insufficient_spec) here is an
// OVER-ABSTENTION error. Used to test selective abstention vs the non-inferable tasks.
export function mergeIntervals(intervals) {
  const out = [];
  for (const [s, e] of intervals.map((p) => [...p])) {
    const hit = out.find((o) => s <= o[1] && e >= o[0]);
    if (hit) {
      hit[0] = Math.min(hit[0], s);
      hit[1] = Math.max(hit[1], e);
    } else {
      out.push([s, e]);
    }
  }
  return out; // BUG: not sorted by start — mergeIntervals([[5,6],[1,2]]) -> [[5,6],[1,2]]
}
