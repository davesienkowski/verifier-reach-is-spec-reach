// Plausible-wrong: Math.round is half-UP on ties (0.5->1, 2.5->3). Reads as a correct "nearest integer"
// solution and passes visible (no ties). The spec never states the tie rule. Fails held-out.
export function roundToInt(x) {
  return Math.round(x);
}
