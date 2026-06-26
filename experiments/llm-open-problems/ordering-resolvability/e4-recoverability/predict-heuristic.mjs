// E4 (heuristic arm): can a cheap keyword heuristic recover the intended order from the
// STATEMENT ALONE for the order-bearing requirements E1 could not dismiss?
// This is the deterministic baseline the model arm (verdicts.tsv) is compared against.
import { readFileSync, writeFileSync } from 'node:fs';
import { classify } from '../e1-type-dismiss/classify.mjs';
import { truthClass6 as truthClass } from '../scoring.mjs';

const { requirements: reqs } = JSON.parse(
  readFileSync(new URL('../corpus/requirements.json', import.meta.url), 'utf8'),
);

// the population E4 reasons about = what E1(refined) could NOT auto-dismiss
const survivors = reqs.filter((r) => classify(r, 'refined') === 'keep');

// crude order-cue extractor: maps statement phrases to a coarse predicted order class
function predictOrder(stmt) {
  const s = stmt.toLowerCase();
  if (/\branked by|sorted|alphabetical|ascending|descending|by upvotes|by relevance|top \d/.test(s)) return 'sorted-by-field';
  if (/order they occurred|encounter|chronological|timestamp/.test(s)) return 'chronological';
  if (/preserv\w* input order|original order|stable/.test(s)) return 'stable-input';
  if (/shuffle|random/.test(s)) return 'nondeterministic';
  if (/path|from .* to /.test(s)) return 'sequence-significant';
  return 'UNSTATED'; // the heuristic found no order cue in the statement
}

let inf = { n: 0, hit: 0 }, nonInf = { n: 0, hit: 0 };
const rows = [];
for (const r of survivors) {
  const pred = predictOrder(r.statement);
  const truth = truthClass(r.intended_order);
  const hit = pred === truth ? 1 : 0;
  const bucket = r.inferable ? inf : nonInf;
  bucket.n++; bucket.hit += hit;
  rows.push({ id: r.id, inferable: r.inferable, pred, truth, hit });
}

console.log('=== E4 (heuristic arm): recover intended order from the statement alone ===\n');
console.log('id   inferable  predicted             truth                 hit');
for (const r of rows) {
  console.log(`${r.id}  ${String(r.inferable).padEnd(9)} ${r.pred.padEnd(21)} ${r.truth.padEnd(21)} ${r.hit ? '✅' : '·'}`);
}
const pct = (h, n) => n ? (100 * h / n).toFixed(0) + '%' : 'n/a';
console.log(`\n  INFERABLE (order named in statement):     ${inf.hit}/${inf.n} = ${pct(inf.hit, inf.n)}`);
console.log(`  NON-INFERABLE (order matters, unstated):  ${nonInf.hit}/${nonInf.n} = ${pct(nonInf.hit, nonInf.n)}`);
console.log(`\n  Chance baseline ~= 1/6 classes ≈ 17%.`);
console.log('  Expectation: high on inferable, ~chance on non-inferable -> the residual is');
console.log('  non-inferable BY CONSTRUCTION, so "ask / backstop" is correct, not a gap.');

// machine-readable dump (the rtk stdout hook mangles console output; read this instead)
writeFileSync(new URL('./results-heuristic.json', import.meta.url), JSON.stringify({
  survivors: survivors.length,
  inferable: { ...inf, pct: inf.n ? +(100 * inf.hit / inf.n).toFixed(1) : null },
  nonInferable: { ...nonInf, pct: nonInf.n ? +(100 * nonInf.hit / nonInf.n).toFixed(1) : null },
  rows,
}, null, 2) + '\n');
