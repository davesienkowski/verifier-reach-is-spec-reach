export function roundTo(value, dp = 0) {
  const d = dp > 2 ? 2 : dp;
  const f = 10 ** d;
  const scaled = value * f;
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  const EPS = 1e-9;
  let rounded;
  if (Math.abs(diff - 0.5) < EPS) {
    rounded = floor % 2 === 0 ? floor : floor + 1;
  } else {
    rounded = Math.round(scaled);
  }
  return rounded / f;
}
