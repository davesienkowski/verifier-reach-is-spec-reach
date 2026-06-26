// N18 — prohibition-elicitation analysis (shape controls + canon-backed + canon-less, engagement &
// non-engagement; precision second-stage with recall + false-positive checks).
// scores.tsv: hit = method named the task's GROUND-TRUTH omitted constraint.
// task_class: shape | holistic. inferability: shape | high | med | low-med | low | none (low/none = canon-less).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const rows = readFileSync(join(ROOT, 'scores.tsv'), 'utf8')
  .trim().split('\n').slice(1)
  .map((l) => {
    const [method, task, task_class, inferability, model, hit, n_items, note] = l.split('\t');
    return { method, task, task_class, inferability, model, hit: +hit, n_items: +n_items, note };
  });
const isCanonless = (r) => ['low', 'none'].includes(r.inferability);
const METHODS = ['edge-probe', 'adversarial', 'three-amigos'];
const h = (a) => `${a.filter((r) => r.hit).length}/${a.length}`;

console.log('=== RECALL by task class ===');
console.log('method        shape    holistic   canon-backed   canon-less');
for (const m of METHODS) {
  const f = (p) => h(rows.filter((r) => r.method === m && p(r)));
  console.log(`${m.padEnd(13)} ${f((r) => r.task_class === 'shape').padEnd(8)} ` +
    `${f((r) => r.task_class === 'holistic').padEnd(10)} ` +
    `${f((r) => r.task_class === 'holistic' && !isCanonless(r)).padEnd(14)} ` +
    `${f((r) => isCanonless(r))}`);
}

console.log('\n=== CANON-LESS recall by model (7 tasks: C1,D1-3,E1-3) ===');
console.log('method        opus     sonnet   haiku');
for (const m of ['adversarial', 'three-amigos']) {
  const cl = rows.filter((r) => r.method === m && isCanonless(r));
  const cell = (mod) => h(cl.filter((r) => r.model === mod)).padEnd(8);
  console.log(`${m.padEnd(13)} ${cell('opus')} ${cell('sonnet')} ${cell('haiku')}`);
}
console.log('(adversarial is model-robust; three-amigos needs a strong model and still misses soft-trap C1/E1)');

console.log('\n=== HAIKU (weak model): canon-backed vs canon-less ===');
for (const m of ['adversarial', 'three-amigos']) {
  const hk = rows.filter((r) => r.method === m && r.model === 'haiku' && r.task_class === 'holistic');
  console.log(`${m.padEnd(13)} canon-backed ${h(hk.filter((r) => !isCanonless(r)))}   canon-less ${h(hk.filter(isCanonless))}`);
}
console.log('(even haiku catches canon-backed via either method; canon-less needs the adversarial framing)');

console.log('\n=== PRECISION second-stage (probe -> classifier) ===');
const prec = readFileSync(join(ROOT, 'precision.tsv'), 'utf8')
  .trim().split('\n').slice(1)
  .map((l) => {
    const [kind, task, n_in, prohib_out, gt_total, gt_found, eng_promoted, note] = l.split('\t');
    return { kind, task, n_in: +n_in, prohib_out: +prohib_out, gt_total: +gt_total, gt_found: +gt_found, eng_promoted: +eng_promoted };
  });
const recall = prec.filter((p) => p.kind === 'recall');
const fp = prec.filter((p) => p.kind === 'falsepos');
const multi = prec.filter((p) => p.kind === 'multi');

const gtRet = recall.filter((p) => p.gt_found === p.gt_total).length;
const mb = (recall.reduce((s, p) => s + p.n_in, 0) / recall.length).toFixed(1);
const ma = (recall.reduce((s, p) => s + p.prohib_out, 0) / recall.length).toFixed(1);
console.log(`recall:      GT retained ${gtRet}/${recall.length} tasks; mean list ${mb} -> ${ma}`);

const promoted = fp.reduce((s, p) => s + p.eng_promoted, 0);
const none = fp.filter((p) => p.prohib_out === 0).length;
console.log(`false-pos:   engineering-robustness items promoted to prohibitions: ${promoted}/${fp.length} specs (0 = no harmful false positives)`);
console.log(`             ${none}/${fp.length} returned NONE; the rest surfaced only genuine security/fairness items (proto-pollution, path-traversal, non-ASCII erasure)`);

const allGt = multi.every((p) => p.gt_found === p.gt_total);
console.log(`multi-prohibition: each spec's distinct prohibitions found ${multi.map((p) => `${p.task} ${p.gt_found}/${p.gt_total}`).join(', ')} -> ${allGt ? 'ALL found (no single-prohibition cap)' : 'INCOMPLETE'}`);
console.log('             (precision is input-adaptive: ops-heavy lists cut ~10->2; prohibition-dense lists kept intact)');
