// Self-validation of the ordering corpus: enforces the label invariants and asserts the
// deliberate trap rows exist. A corpus that violates these is not a valid probe substrate.
import { readFileSync } from 'node:fs';

const { requirements: reqs } = JSON.parse(
  readFileSync(new URL('./requirements.json', import.meta.url), 'utf8'),
);

let ok = true;
const fail = (id, msg) => { ok = false; console.log(`  ❌ ${id}: ${msg}`); };

for (const r of reqs) {
  if (r.order_relevant === false) {
    if (r.intended_order !== null) fail(r.id, 'irrelevant order must have intended_order=null');
    if (r.inferable !== null) fail(r.id, 'irrelevant order must have inferable=null');
  } else if (r.order_relevant === true) {
    if (typeof r.intended_order !== 'string' || !r.intended_order) fail(r.id, 'relevant order needs a non-empty intended_order');
    if (typeof r.inferable !== 'boolean') fail(r.id, 'relevant order needs a boolean inferable');
  } else {
    fail(r.id, 'order_relevant must be a boolean');
  }
  // a non-inferable order is only meaningful when order is relevant
  if (r.inferable === false && r.order_relevant !== true) fail(r.id, 'inferable=false requires order_relevant=true');
}

// the experiments are only interesting if the traps are present
const need = {
  'r11': 'Map<_,Array> false-dismiss trap',
  'r24': 'order-bearing type whose order derives from an upstream set',
  'r13': 'inferable sort + non-inferable tie-break',
  'r21': 'inferable primary sort + non-inferable tie-break',
};
for (const [id, why] of Object.entries(need)) {
  if (!reqs.find((r) => r.id === id)) fail(id, `missing required trap (${why})`);
}

const n = reqs.length;
const rel = reqs.filter((r) => r.order_relevant === true);
const irrel = reqs.filter((r) => r.order_relevant === false);
const nonInf = rel.filter((r) => r.inferable === false);
console.log(`corpus: ${n} requirements | order-relevant ${rel.length} | order-irrelevant ${irrel.length} | of relevant, non-inferable ${nonInf.length}`);
console.log(`\nCorpus valid: ${ok ? 'YES ✅' : 'NO ❌'}`);
process.exit(ok ? 0 : 1);
