export function mergeIntervals(intervals) {
  const xs = [...intervals].sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const p of xs) {
    const last = out[out.length - 1];
    if (last && p[0] <= last[1]) last[1] = Math.max(last[1], p[1]);
    else out.push(p);
  }
  return out;
}
