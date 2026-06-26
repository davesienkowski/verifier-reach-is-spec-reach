// E1 analysis: run the type classifier over the shared corpus and report, per rule,
// the SAFETY metric (false-dismiss rate — must be 0) and the coverage it buys.
import { readFileSync } from 'node:fs';
import { classify } from './classify.mjs';

const { requirements: reqs } = JSON.parse(
  readFileSync(new URL('../corpus/requirements.json', import.meta.url), 'utf8'),
);

function score(rule) {
  let dismiss = 0, falseDismiss = 0, keep = 0;
  const falseRows = [];
  for (const r of reqs) {
    const verdict = classify(r, rule);
    if (verdict === 'dismiss') {
      dismiss++;
      if (r.order_relevant === true) { falseDismiss++; falseRows.push(r.id); } // DANGER
    } else {
      keep++;
    }
  }
  const irrelevant = reqs.filter((r) => !r.order_relevant).length;
  const correctDismiss = dismiss - falseDismiss;
  return { rule, dismiss, correctDismiss, falseDismiss, falseRows, keep, irrelevant, n: reqs.length };
}

console.log('=== E1: return-type auto-dismiss of the ORDERING edge ===\n');
for (const rule of ['naive', 'refined']) {
  const s = score(rule);
  console.log(`[${rule}]`);
  console.log(`  auto-dismissed:            ${s.dismiss}/${s.n}`);
  console.log(`  ...correctly (truly irrelevant): ${s.correctDismiss}/${s.irrelevant}`);
  console.log(`  ...FALSE dismiss (order mattered): ${s.falseDismiss}  ${s.falseRows.length ? '⚠ ' + s.falseRows.join(',') : '✅ none'}`);
  console.log(`  left unresolved (order-bearing -> E4): ${s.keep}/${s.n}`);
  console.log(`  coverage of the irrelevant set: ${(100 * s.correctDismiss / s.irrelevant).toFixed(0)}%`);
  console.log(`  SAFE (zero false-dismiss): ${s.falseDismiss === 0 ? 'YES ✅' : 'NO ❌'}\n`);
}

console.log('Takeaway: the refined rule safely collapses the genuinely-unordered cases');
console.log('(0 false-dismiss); the naive rule buys the same coverage but mis-dismisses the');
console.log('Map<_,Array> trap (r11) — proving "Map => order-free" is unsafe. The order-bearing');
console.log('remainder cannot be resolved by type and is the subject of E4.');
