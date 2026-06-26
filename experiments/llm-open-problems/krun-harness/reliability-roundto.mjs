// k-run harness — reliability with a CONSISTENCY-vs-CORRECTNESS decomposition.
// roundTo, spec with the x.5 tie-rule OMITTED (non-inferable edge); hidden oracle = banker's rounding
// (round half to even — the corpus's intent). Reports the danger the basic metric misses:
// assertions where all k runs AGREE but are WRONG (correlated blindness).

import { readdirSync } from 'node:fs';

// hidden oracle (banker's / round-half-to-even). Common cases are inferable; x.5 ties are not.
const ORACLE = [
  ['1.234→1.23 (common)', [1.234, 2], 1.23, false],
  ['1.236→1.24 (common)', [1.236, 2], 1.24, false],
  ['2.4→2 (common)', [2.4, 0], 2, false],
  ['2.6→3 (common)', [2.6, 0], 3, false],
  ['2.5→2 (TIE, banker\'s)', [2.5, 0], 2, true],
  ['0.5→0 (TIE, banker\'s)', [0.5, 0], 0, true],
  ['3.5→4 (TIE, banker\'s)', [3.5, 0], 4, true],
  ['1.5→2 (TIE, banker\'s)', [1.5, 0], 2, true],
];

const runs = readdirSync(new URL('./candidates-roundto/', import.meta.url)).filter(f => /^run-\d+\.mjs$/.test(f)).sort();
const fns = [];
for (const f of runs) fns.push((await import(new URL('./candidates-roundto/' + f, import.meta.url))).roundTo);
const k = fns.length;

console.log(`=== k-run reliability w/ consistency×correctness — roundTo, k=${k} (haiku) ===`);
console.log('(spec OMITS the x.5 tie rule; oracle = banker\'s rounding)\n');
console.log('assertion\t\t\toutputs across runs\tpass\tconsistent?\tcorrect?');
let capPass = 0, capTot = 0, consistentCount = 0, consistentWrong = 0;
const tieRows = [];
for (const [label, args, expected, isTie] of ORACLE) {
  const outs = fns.map(fn => { try { return fn(...args); } catch (e) { return 'THROW'; } });
  const distinct = [...new Set(outs.map(String))];
  const consistent = distinct.length === 1;
  const passes = outs.filter(o => o === expected).length;
  capPass += passes; capTot += k;
  if (consistent) consistentCount++;
  const correct = passes === k;
  if (consistent && !correct) consistentWrong++;
  if (isTie) tieRows.push({ label, out: distinct.join('|'), expected, consistent, correct });
  console.log(`${label.padEnd(28)}\t[${distinct.join(', ')}]\t\t${passes}/${k}\t${consistent ? 'YES' : 'no'}\t\t${correct ? 'YES' : 'NO'}`);
}

const capability = capPass / capTot;                 // pass@1 vs the true oracle
const consistency = consistentCount / ORACLE.length; // oracle-FREE run-to-run agreement
console.log('\n=== metric decomposition ===');
console.log(`capability (pass@1 vs true oracle):        ${(capability * 100).toFixed(1)}%`);
console.log(`consistency (run-to-run agreement, oracle-free): ${(consistency * 100).toFixed(1)}%`);
console.log(`reliability (fraction of runs fully passing):    ${(fns.filter(fn => ORACLE.every(([, a, e]) => fn(...a) === e)).length / k * 100).toFixed(1)}%`);
console.log(`\n*** consistent-BUT-WRONG assertions (the blind spot a consistency metric calls "reliable"): ${consistentWrong}/${ORACLE.length} ***`);
for (const r of tieRows.filter(r => r.consistent && !r.correct)) console.log(`   ${r.label}: all runs say ${r.out}, oracle wants ${r.expected}`);
console.log('\nKEY: consistency is 100% (all runs identical) yet capability < 100% — the runs are');
console.log('CONSISTENTLY WRONG on the non-inferable tie. A variance/consistency-only reliability');
console.log('metric would score this PERFECT and miss it. Reliability ⇒ correctness ONLY vs a true oracle.');
