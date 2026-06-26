// Plausible-wrong: uses Math.round, which rounds half UP (toward +∞) on ties.
// Passes the visible suite (no exact ties) and looks correct against the spec
// ("round to dp decimals" — the spec never says how ties resolve). Fails held-out.
export function roundTo(value, dp = 0) {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}
