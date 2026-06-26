// k-run harness — component 2: the scoring oracle.
// The 10 assertions are lifted VERBATIM from goodthrough-v4
// packages/shared/src/rule-engine/money.test.ts (formatCents describe block) — so a re-run is scored
// against the project's REAL test, not a paraphrase. score(fn) → per-assertion pass/fail + allPass.

const DASH = '—'; // em dash — the "unknown" sentinel
export const ASSERTIONS = [
  ['12345', 12345, '$123.45'],
  ['0', 0, '$0.00'],
  ['null', null, DASH],
  ['undefined', undefined, DASH],
  ['5 (sub-dollar)', 5, '$0.05'],
  ['1234.5 (frac half up)', 1234.5, '$12.35'],
  ['1234.4 (frac down)', 1234.4, '$12.34'],
  ['-0.4 (no -$0.00)', -0.4, '$0.00'],
  ['-1234.5 (neg half — JS Math.round)', -1234.5, '-$12.34'], // the reliability discriminator
  ['-1234.6 (neg)', -1234.6, '-$12.35'],
];

export function score(fn) {
  const results = ASSERTIONS.map(([label, input, expected]) => {
    let got, pass;
    try { got = fn(input); pass = got === expected; } catch (e) { got = `THROW:${e.message.slice(0, 30)}`; pass = false; }
    return { label, input, expected, got, pass };
  });
  return { results, allPass: results.every(r => r.pass), nPass: results.filter(r => r.pass).length };
}
