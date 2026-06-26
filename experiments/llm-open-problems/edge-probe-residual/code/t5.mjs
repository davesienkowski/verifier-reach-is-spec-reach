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
  return out;
}
