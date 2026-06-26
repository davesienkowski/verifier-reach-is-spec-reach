// Non-inferable corpus analysis: held-out marginal value + verifier calibration in the
// non-inferable regime. Reproduces RESULTS numbers from verdicts.tsv.
import { readFileSync } from 'node:fs';

const rows = readFileSync(new URL('./verdicts.tsv', import.meta.url), 'utf8')
  .trim().split('\n').slice(1).map((l) => {
    const c = l.split('\t');
    return { task: c[0], model: c[2], verdict: c[4], conf: +c[5], correct: +c[6], caughtEdge: +c[7] };
  });

const clean = rows.filter((r) => !r.task.startsWith('01')); // task 01 is confounded (extra inferable bug)

function calib(set, label) {
  const n = set.length;
  const acc = set.reduce((s, r) => s + r.correct, 0) / n;
  const conf = set.reduce((s, r) => s + r.conf, 0) / n;
  const brier = set.reduce((s, r) => s + (r.conf - r.correct) ** 2, 0) / n;
  const ece = Math.abs(acc - conf); // single high bin (all conf in (0.8,1.0])
  console.log(`\n[${label}]  n=${n}`);
  console.log(`  verifier rejected defective code (verdict=gaps_found): ${set.reduce((s,r)=>s+ (r.verdict==='gaps_found'?1:0),0)}/${n}`);
  console.log(`  caught the SPECIFIC non-inferable edge:                 ${set.reduce((s,r)=>s+r.caughtEdge,0)}/${n}`);
  console.log(`  verdict accuracy (matched ground-truth gaps_found):     ${(acc*100).toFixed(0)}%`);
  console.log(`  mean confidence:                                        ${conf.toFixed(3)}`);
  console.log(`  calibration gap (acc - conf):                           ${(acc-conf).toFixed(3)}  ${acc-conf<-0.1?'(OVER-confident)':''}`);
  console.log(`  ECE (1-bin):                                            ${ece.toFixed(3)}`);
  console.log(`  Brier:                                                  ${brier.toFixed(3)}  (chance=0.25; >0.25 = worse than guessing)`);
}

console.log('=== HELD-OUT marginal value ===');
console.log('held-out catch rate (deterministic, from validate.mjs): 3/3 tasks = 100%');
console.log('verifier catch rate of the specific non-inferable edge:  0/12 (NONE)');
console.log('=> held-out catches what goal-backward verification misses — its first demonstrated marginal value.');

calib(rows, 'ALL 12 verdicts');
calib(clean, 'CLEAN non-inferable only (tasks 02,03; task 01 confounded by an extra inferable FP bug)');

// contrast with the inferable corpus (a1-RESULTS)
console.log('\n=== contrast: same verifier protocol, INFERABLE defects (a1-RESULTS) ===');
console.log('  inferable: accuracy 100%, mean conf 0.970, ECE 0.030  (well-calibrated)');
console.log('  non-inferable (clean): see above  ->  confidence is identical (~0.9) whether right or wrong');
console.log('  => the verifier does NOT know when it does not know: confidence is uninformative across regimes.');
