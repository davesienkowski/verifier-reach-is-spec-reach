// edge-probe-residual analysis. Reads verdicts.tsv.
// NI tasks: defect present on a non-inferable edge. INF: defect on a STATED rule.
//   narrow  (no abstain): honest=gaps_found; FAIL=passed(false-pass)
//   surfaced-unresolved (abstain avail, edge-probe tag): honest=abstain|gaps_found; FAIL=passed
//   surfaced-resolved (edge written as criterion): correct=gaps_found; RESIDUAL=passed
//
// Every rate is reported as  "<point>% [lo-hi]"  where [lo-hi] is the Wilson score 95% CI in
// percentage points. Wilson (not normal/Wald) is used deliberately: rates here saturate at 0% and
// 100% (opus abstain 100%, MISS catch 0%, ...); the Wald interval degenerates to zero width or
// escapes [0,1] at those boundaries, understating uncertainty at small n. Wilson stays in [0,1].
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(fileURLToPath(import.meta.url));
const FILE = process.argv[2] || 'verdicts.tsv';   // default unchanged; pass verdicts.v2.tsv for the powered run
if (FILE !== 'verdicts.tsv') console.error(`(reading ${FILE})`);
const rows = readFileSync(join(ROOT, FILE), 'utf8').trim().split('\n').slice(1)
  .map((l) => { const [rep, model, condition, task, regime, edgeprobe, verdict, confidence] = l.split('\t');
    return { rep, model, condition, task, regime, edgeprobe, verdict, confidence }; });

// --- statistics: Wilson score interval for a binomial proportion x successes in n trials ---
const Z = 1.959964; // two-sided 95%
function wilson(x, n, z = Z) {
  const p = x / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const margin = (z / denom) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return { lo: Math.max(0, center - margin), hi: Math.min(1, center + margin) };
}
// point estimate (unchanged arithmetic) + Wilson 95% CI, e.g. "94% [80-99]"; "n/a" when d===0.
const ci = (n, d) => {
  if (d === 0) return 'n/a';
  const w = wilson(n, d);
  return `${((100 * n) / d).toFixed(0)}% [${Math.round(100 * w.lo)}-${Math.round(100 * w.hi)}]`;
};
const CW = 15;                                   // column width that fits "100% [76-100]"
const col = (n, d) => ci(n, d).padEnd(CW);       // a rate cell, padded
const head = (...labels) => labels.map((l) => l.padEnd(CW)).join('');

const CONDS = ['narrow', 'surfaced-unresolved', 'surfaced-resolved'];
const ni = rows.filter((r) => r.regime === 'NI');
const inf = rows.filter((r) => r.regime === 'INF');

console.log('=== NON-INFERABLE tasks by condition (ground truth: defect present) ===');
console.log('rates as point% [Wilson 95% CI, percentage points]');
console.log(`condition              n    ${head('false_pass', 'abstain', 'catch')}`);
for (const c of CONDS) {
  const s = ni.filter((r) => r.condition === c);
  const fp = s.filter((r) => r.verdict === 'passed').length;
  const ab = s.filter((r) => r.verdict === 'insufficient_spec').length;
  const ca = s.filter((r) => r.verdict === 'gaps_found').length;
  console.log(`${c.padEnd(22)} ${String(s.length).padEnd(4)} ${col(fp, s.length)}${col(ab, s.length)}${col(ca, s.length)}`);
}

console.log('\n=== Abstention (honest deferral) by model tier — surfaced-unresolved, NI tasks ===');
console.log(`model    n    ${head('false_pass', 'abstain', 'catch', 'honest(ab+ca)')}`);
for (const m of ['opus', 'sonnet', 'haiku']) {
  const s = ni.filter((r) => r.condition === 'surfaced-unresolved' && r.model === m);
  const fp = s.filter((r) => r.verdict === 'passed').length;
  const ab = s.filter((r) => r.verdict === 'insufficient_spec').length;
  const ca = s.filter((r) => r.verdict === 'gaps_found').length;
  console.log(`${m.padEnd(8)} ${String(s.length).padEnd(4)} ${col(fp, s.length)}${col(ab, s.length)}${col(ca, s.length)}${col(ab + ca, s.length)}`);
}

console.log('\n=== Residual after edge-probe RESOLVE (surfaced-resolved false-pass = the fix failing) ===');
console.log(`model    n    ${head('catch', 'RESIDUAL(fp)')}`);
for (const m of ['opus', 'sonnet', 'haiku']) {
  const s = ni.filter((r) => r.condition === 'surfaced-resolved' && r.model === m);
  const ca = s.filter((r) => r.verdict === 'gaps_found').length;
  const fp = s.filter((r) => r.verdict === 'passed').length;
  console.log(`${m.padEnd(8)} ${String(s.length).padEnd(4)} ${col(ca, s.length)}${col(fp, s.length)}`);
}

console.log('\n=== By edge-probe recall: does residual concentrate on the MISS task? ===');
console.log('(surfaced-unresolved NI: false_pass on HIT tasks vs the MISS task t3=rounding-tie)');
console.log(`edge-probe   n    ${head('false_pass', 'abstain', 'catch')}`);
for (const ep of ['HIT', 'MISS']) {
  const s = ni.filter((r) => r.condition === 'surfaced-unresolved' && r.edgeprobe === ep);
  const fp = s.filter((r) => r.verdict === 'passed').length;
  const ab = s.filter((r) => r.verdict === 'insufficient_spec').length;
  const ca = s.filter((r) => r.verdict === 'gaps_found').length;
  console.log(`${ep.padEnd(5)} ${String(s.length).padEnd(7)} ${col(fp, s.length)}${col(ab, s.length)}${col(ca, s.length)}`);
}

console.log('\n=== INF control (defect on STATED rule; correct=catch, over-abstain=BAD) ===');
console.log(`condition              n    ${head('catch', 'miss', 'OVER_ABSTAIN')}`);
for (const c of ['narrow', 'surfaced-unresolved']) {
  const s = inf.filter((r) => r.condition === c);
  const ca = s.filter((r) => r.verdict === 'gaps_found').length;
  const ms = s.filter((r) => r.verdict === 'passed').length;
  const oa = s.filter((r) => r.verdict === 'insufficient_spec').length;
  console.log(`${c.padEnd(22)} ${String(s.length).padEnd(4)} ${col(ca, s.length)}${col(ms, s.length)}${col(oa, s.length)}`);
}

console.log('\n=== Baseline blind-spot reproduction (narrow NI, by model) ===');
for (const m of ['opus', 'sonnet', 'haiku']) {
  const s = ni.filter((r) => r.condition === 'narrow' && r.model === m);
  const fp = s.filter((r) => r.verdict === 'passed').length;
  console.log(`${m.padEnd(8)} false_pass ${ci(fp, s.length)} (n=${s.length})`);
}
console.log(`\nTotal verdicts: ${rows.length}`);
