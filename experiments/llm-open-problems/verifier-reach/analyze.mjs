// N1 — Verifier reach as a measured coverage score. Joins the manifest (ground truth) with the
// 36 recorded verdicts (12 candidates x opus/sonnet/haiku) and computes:
//   - reach: RAW = verdict 'gaps_found'; TRUE = caught the *planted* edge (named the right must_have)
//   - split by inferability, and within non-inferable by arbitrary vs convention-bearing
//   - clean-control specificity (false-positive rate)
//   - confidence calibration (the A1 blind-spot signature)
//   - cross-tier verdict disagreement (the N11 bonus signal)
// Deterministic; reproduces RESULTS.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const tsv = (f) => readFileSync(join(ROOT, f), 'utf8').trim().split('\n').map((l) => l.split('\t'));

const man = Object.fromEntries(tsv('manifest.tsv').slice(1).map(([id, task, fn, category, cls]) => [id, { id, task, category, cls }]));
const rows = tsv('verdicts.tsv').slice(1).map(([id, model, verdict, confidence, caught_edge]) =>
  ({ ...man[id], model, verdict, confidence: +confidence, caught_edge: +caught_edge }));

// genuinely-arbitrary non-inferable edges (no general convention fixes them) vs convention-bearing
const ARBITRARY = new Set(['01-noninf-tie', '03-noninf-grapheme']);   // half-even tie, grapheme-vs-codeunit
const CONVENTION = new Set(['02-noninf-touching']);                    // touching ~ <= is a CS convention

const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(0)}%` : 'n/a');
const rawReach = (s) => s.filter((r) => r.verdict === 'gaps_found').length;
const trueReach = (s) => s.reduce((acc, r) => acc + r.caught_edge, 0);

function report(set, label) {
  const n = set.length;
  console.log(`${label.padEnd(34)} n=${String(n).padStart(2)}  raw gaps_found ${String(rawReach(set)+'/'+n).padEnd(6)} ${pct(rawReach(set),n).padStart(4)}   TRUE reach(caught edge) ${String(trueReach(set)+'/'+n).padEnd(6)} ${pct(trueReach(set),n).padStart(4)}`);
}

const inf = rows.filter((r) => r.cls === 'inferable');
const non = rows.filter((r) => r.cls === 'noninferable');
const nonArb = non.filter((r) => ARBITRARY.has(r.id));
const nonConv = non.filter((r) => CONVENTION.has(r.id));
const clean = rows.filter((r) => r.cls === 'clean');

console.log('=== VERIFIER REACH — mutation-tested goal-backward verifier (3 tiers x 12 candidates = 36 verdicts) ===\n');
report(inf, 'INFERABLE mutants');
report(nonConv, 'NON-INFERABLE (convention-bearing)');
report(nonArb, 'NON-INFERABLE (genuinely arbitrary)');
report(non, 'NON-INFERABLE (all)');
console.log('');
const passedClean = clean.filter((r) => r.verdict === 'passed').length;
console.log(`${'CLEAN controls'.padEnd(34)} n=${clean.length}   specificity(passed) ${passedClean}/${clean.length} ${pct(passedClean,clean.length)}   FALSE-POSITIVES ${clean.length - passedClean}/${clean.length} ${pct(clean.length-passedClean,clean.length)}`);

console.log('\n=== by model tier (TRUE reach = caught the planted edge) ===');
for (const m of ['opus', 'sonnet', 'haiku']) {
  const mi = inf.filter((r) => r.model === m), mn = non.filter((r) => r.model === m), mc = clean.filter((r) => r.model === m);
  console.log(`  ${m.padEnd(7)} inferable ${pct(trueReach(mi),mi.length).padStart(4)}   non-inf ${pct(trueReach(mn),mn.length).padStart(4)}   clean-specificity ${pct(mc.filter((r)=>r.verdict==='passed').length,mc.length).padStart(4)}`);
}

console.log('\n=== confidence calibration (verdict-correct = gaps_found on mutant / passed on clean) ===');
const correct = (r) => r.cls === 'clean' ? r.verdict === 'passed' : r.verdict === 'gaps_found';
function calib(set, label) {
  const n = set.length; if (!n) return;
  const acc = set.filter(correct).length / n;
  const conf = set.reduce((s, r) => s + r.confidence, 0) / n;
  const brier = set.reduce((s, r) => s + (r.confidence - (correct(r) ? 1 : 0)) ** 2, 0) / n;
  console.log(`  ${label.padEnd(26)} n=${n}  acc=${(acc*100).toFixed(0)}%  meanConf=${conf.toFixed(3)}  gap=${(acc-conf).toFixed(3)}  Brier=${brier.toFixed(3)}`);
}
calib(inf, 'inferable'); calib(nonArb, 'non-inf arbitrary'); calib(nonConv, 'non-inf convention'); calib(clean, 'clean');

// N11 bonus: cross-tier verdict disagreement per candidate
console.log('\n=== cross-tier disagreement (N11 signal) ===');
let disagree = 0;
for (const id of Object.keys(man)) {
  const v = rows.filter((r) => r.id === id).map((r) => r.verdict);
  const split = new Set(v).size > 1;
  if (split) { disagree++; console.log(`  DISAGREE  ${id.padEnd(20)} [${rows.filter((r)=>r.id===id).map((r)=>r.model[0]+':'+(r.verdict==='gaps_found'?'gap':'pass')).join('  ')}]  (${man[id].cls})`); }
}
console.log(`  ${disagree}/12 candidates split across tiers. Note: the genuinely-arbitrary blind spots are UNANIMOUS (no disagreement) — uniform blindness gives no signal.`);

console.log('\n=== headline ===');
console.log(`TRUE verifier reach is bimodal: ${pct(trueReach(inf),inf.length)} inferable vs ${pct(trueReach(nonArb),nonArb.length)} on genuinely-arbitrary edges (tie, grapheme).`);
console.log(`Convention-bearing "non-inferable" edges (touching) are recoverable: ${pct(trueReach(nonConv),nonConv.length)} — verifier reach = spec reach + general-convention reach.`);
console.log(`Raw gaps_found OVERSTATES non-inferable reach (${pct(rawReach(non),non.length)}) vs true edge-catch (${pct(trueReach(non),non.length)}): the grapheme mutant is rejected for the WRONG reason.`);
console.log(`Skeptical prompting costs specificity: ${pct(clean.length-passedClean,clean.length)} false-positive rate on correct reference code (flags defensible choices on spec-ambiguous points).`);
