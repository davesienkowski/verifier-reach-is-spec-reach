// Reference: round half-to-EVEN (banker's). Exact .5 ties go to the nearest even integer.
export function roundToInt(x) {
  const f = Math.floor(x);
  const d = x - f;
  if (d < 0.5) return f;
  if (d > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}
