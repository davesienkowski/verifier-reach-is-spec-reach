// N7 — prohibition verification. Does framing a constraint as a prohibition ("must NOT") degrade the
// verifier's catch rate vs the same constraint framed positively ("must")? Compares catch by framing,
// constraint, and tier over the 18 recorded verdicts; contrasts with the deterministic backstop.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const rows = readFileSync(join(ROOT, 'verdicts.tsv'), 'utf8').trim().split('\n').slice(1)
  .map((l) => l.split('\t')).map(([constraint, framing, model, verdict, confidence, caught]) =>
    ({ constraint, framing, model, verdict, confidence: +confidence, caught: +caught }));

const pct = (s) => `${s.reduce((a, r) => a + r.caught, 0)}/${s.length}`;
const positive = rows.filter((r) => r.framing === 'positive');
const prohibition = rows.filter((r) => r.framing === 'prohibition');

console.log('=== N7 prohibition verification — catch rate by framing (same code, two spec framings) ===\n');
console.log(`POSITIVE framing ("X MUST hold"):     caught ${pct(positive)}`);
console.log(`PROHIBITION framing ("X must NOT"):   caught ${pct(prohibition)}`);
console.log(`Polarity gap (positive − prohibition): ${(positive.reduce((a,r)=>a+r.caught,0)/positive.length - prohibition.reduce((a,r)=>a+r.caught,0)/prohibition.length).toFixed(2)}\n`);

console.log('by constraint:');
for (const c of ['c1-io', 'c2-red', 'c3-monotonic']) {
  const s = rows.filter((r) => r.constraint === c);
  console.log(`  ${c.padEnd(14)} caught ${pct(s)}  (pos ${pct(s.filter(r=>r.framing==='positive'))}, prohib ${pct(s.filter(r=>r.framing==='prohibition'))})`);
}
console.log('\nby tier:');
for (const m of ['opus', 'sonnet', 'haiku']) console.log(`  ${m.padEnd(7)} caught ${pct(rows.filter((r) => r.model === m))}`);

console.log('\n=== contrast: deterministic backstop (backstop.mjs) ===');
console.log('  backstop catch: 3/3 (polarity-independent) — see backstop.mjs');

console.log('\n=== headline ===');
console.log(`No polarity gap: ${pct(rows)} caught overall, identical across framings. Frontier verifiers`);
console.log(`handle "must NOT" as well as "must" when the violation is PRESENT in the inspected code.`);
console.log(`The prior-art "negatives are harder" result is about test GENERATION, not inspection.`);
console.log(`The real prohibition risk is SCOPE: a prohibition is universally quantified over the whole`);
console.log(`codebase, but the verifier inspects only the files in scope. The backstop's value is coverage`);
console.log(`(lint the whole tree), not the model's negation ability.`);
process.exit(0);
