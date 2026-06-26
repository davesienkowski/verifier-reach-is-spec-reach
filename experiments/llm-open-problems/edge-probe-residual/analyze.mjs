// edge-probe-residual analysis. Reads verdicts.tsv.
// NI tasks: defect present on a non-inferable edge. INF: defect on a STATED rule.
//   narrow  (no abstain): honest=gaps_found; FAIL=passed(false-pass)
//   surfaced-unresolved (abstain avail, edge-probe tag): honest=abstain|gaps_found; FAIL=passed
//   surfaced-resolved (edge written as criterion): correct=gaps_found; RESIDUAL=passed
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(fileURLToPath(import.meta.url));
const rows = readFileSync(join(ROOT, 'verdicts.tsv'), 'utf8').trim().split('\n').slice(1)
  .map((l) => { const [rep, model, condition, task, regime, edgeprobe, verdict, confidence] = l.split('\t');
    return { rep, model, condition, task, regime, edgeprobe, verdict, confidence }; });
const pct = (n, d) => d === 0 ? ' n/a' : `${((100 * n) / d).toFixed(0)}%`;
const CONDS = ['narrow', 'surfaced-unresolved', 'surfaced-resolved'];
const ni = rows.filter((r) => r.regime === 'NI');
const inf = rows.filter((r) => r.regime === 'INF');

console.log('=== NON-INFERABLE tasks by condition (ground truth: defect present) ===');
console.log('condition              n   false_pass  abstain   catch');
for (const c of CONDS) {
  const s = ni.filter((r) => r.condition === c);
  const fp = s.filter((r) => r.verdict === 'passed').length;
  const ab = s.filter((r) => r.verdict === 'insufficient_spec').length;
  const ca = s.filter((r) => r.verdict === 'gaps_found').length;
  console.log(`${c.padEnd(22)} ${String(s.length).padEnd(3)} ${pct(fp, s.length).padStart(6)}      ${pct(ab, s.length).padStart(4)}     ${pct(ca, s.length).padStart(4)}`);
}

console.log('\n=== Abstention (honest deferral) by model tier — surfaced-unresolved, NI tasks ===');
console.log('model    n   false_pass  abstain   catch   (honest = abstain+catch)');
for (const m of ['opus', 'sonnet', 'haiku']) {
  const s = ni.filter((r) => r.condition === 'surfaced-unresolved' && r.model === m);
  const fp = s.filter((r) => r.verdict === 'passed').length;
  const ab = s.filter((r) => r.verdict === 'insufficient_spec').length;
  const ca = s.filter((r) => r.verdict === 'gaps_found').length;
  console.log(`${m.padEnd(8)} ${String(s.length).padEnd(3)} ${pct(fp, s.length).padStart(6)}      ${pct(ab, s.length).padStart(4)}     ${pct(ca, s.length).padStart(4)}    ${pct(ab + ca, s.length)}`);
}

console.log('\n=== Residual after edge-probe RESOLVE (surfaced-resolved false-pass = the fix failing) ===');
console.log('model    n   catch   RESIDUAL(false_pass)');
for (const m of ['opus', 'sonnet', 'haiku']) {
  const s = ni.filter((r) => r.condition === 'surfaced-resolved' && r.model === m);
  const ca = s.filter((r) => r.verdict === 'gaps_found').length;
  const fp = s.filter((r) => r.verdict === 'passed').length;
  console.log(`${m.padEnd(8)} ${String(s.length).padEnd(3)} ${pct(ca, s.length).padStart(5)}   ${pct(fp, s.length)}`);
}

console.log('\n=== By edge-probe recall: does residual concentrate on the MISS task? ===');
console.log('(surfaced-unresolved NI: false_pass on HIT tasks vs the MISS task t3=rounding-tie)');
for (const ep of ['HIT', 'MISS']) {
  const s = ni.filter((r) => r.condition === 'surfaced-unresolved' && r.edgeprobe === ep);
  const fp = s.filter((r) => r.verdict === 'passed').length;
  const ab = s.filter((r) => r.verdict === 'insufficient_spec').length;
  const ca = s.filter((r) => r.verdict === 'gaps_found').length;
  console.log(`edge-probe ${ep.padEnd(5)} n=${String(s.length).padEnd(3)} false_pass ${pct(fp, s.length).padStart(5)}  abstain ${pct(ab, s.length).padStart(5)}  catch ${pct(ca, s.length)}`);
}

console.log('\n=== INF control (defect on STATED rule; correct=catch, over-abstain=BAD) ===');
console.log('condition              n   catch   miss   OVER_ABSTAIN');
for (const c of ['narrow', 'surfaced-unresolved']) {
  const s = inf.filter((r) => r.condition === c);
  const ca = s.filter((r) => r.verdict === 'gaps_found').length;
  const ms = s.filter((r) => r.verdict === 'passed').length;
  const oa = s.filter((r) => r.verdict === 'insufficient_spec').length;
  console.log(`${c.padEnd(22)} ${String(s.length).padEnd(3)} ${pct(ca, s.length).padStart(5)}   ${pct(ms, s.length).padStart(4)}   ${pct(oa, s.length)}`);
}

console.log('\n=== Baseline blind-spot reproduction (narrow NI, by model) ===');
for (const m of ['opus', 'sonnet', 'haiku']) {
  const s = ni.filter((r) => r.condition === 'narrow' && r.model === m);
  const fp = s.filter((r) => r.verdict === 'passed').length;
  console.log(`${m.padEnd(8)} false_pass ${pct(fp, s.length)} (n=${s.length})`);
}
console.log(`\nTotal verdicts: ${rows.length}`);
