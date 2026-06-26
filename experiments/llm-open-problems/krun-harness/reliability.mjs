// k-run harness — component 3: the reliability metric (Beyond pass@1).
// Scores k independent re-runs against the oracle and decomposes capability vs reliability:
//   capability (pass@1)  = mean per-run assertion pass-rate (how good on a single try)
//   reliability (pass^k) = fraction of runs that FULLY pass (consistency)
//   per-assertion all-k  = assertions every run passes (the durable core) vs mixed (the unreliable edge)
//   gap = capability − reliability  (the divergence the framework says grows with task difficulty)

import { readdirSync } from 'node:fs';
import { score, ASSERTIONS } from './oracle.mjs';

const runs = readdirSync(new URL('./candidates/', import.meta.url)).filter(f => /^run-\d+\.mjs$/.test(f)).sort();
const scored = [];
for (const f of runs) {
  const mod = await import(new URL('./candidates/' + f, import.meta.url));
  scored.push({ run: f, ...score(mod.formatCents) });
}
const k = scored.length;

// capability: mean per-run pass-rate
const capability = scored.reduce((s, r) => s + r.nPass / ASSERTIONS.length, 0) / k;
// reliability: fraction of runs that fully pass
const reliability = scored.filter(r => r.allPass).length / k;

// per-assertion consistency
console.log(`=== k-run reliability — formatCents, k=${k} (haiku) ===\n`);
console.log('per-run:');
for (const r of scored) console.log(`  ${r.run}: ${r.nPass}/${ASSERTIONS.length}${r.allPass ? ' (PASS)' : ' — FAIL: ' + r.results.filter(x => !x.pass).map(x => x.label).join('; ')}`);

console.log('\nper-assertion across the k runs:');
let allK = 0, mixed = 0;
for (let i = 0; i < ASSERTIONS.length; i++) {
  const passes = scored.filter(r => r.results[i].pass).length;
  const tag = passes === k ? 'all-k ✓' : passes === 0 ? 'all-k ✗' : `MIXED ${passes}/${k}`;
  if (passes === k) allK++; else if (passes > 0) mixed++;
  console.log(`  [${passes}/${k}] ${tag}\t${ASSERTIONS[i][0]}`);
}

console.log('\n=== metric ===');
console.log(`capability (pass@1, mean per-run pass-rate): ${(capability * 100).toFixed(1)}%`);
console.log(`reliability (fraction of runs fully passing): ${(reliability * 100).toFixed(1)}%`);
console.log(`capability − reliability gap: ${((capability - reliability) * 100).toFixed(1)} pp`);
console.log(`durable core (assertions all ${k} runs pass): ${allK}/${ASSERTIONS.length}`);
console.log(`unreliable edges (assertions some-but-not-all pass): ${mixed}/${ASSERTIONS.length}`);
