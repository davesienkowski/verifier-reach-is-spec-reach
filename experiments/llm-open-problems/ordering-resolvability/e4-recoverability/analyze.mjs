// E4 analysis (model arm): can a model recover the intended order from the statement ALONE?
// Reads verdicts.tsv (blind model predictions), SELF-SCORES each prediction against the
// corpus via the shared truthClass6 mapping (the same mapping the heuristic baseline uses),
// and reports per-model + pooled recovery, split by inferable, against the heuristic + chance.
//
// The decisive comparison: NON-INFERABLE recovery vs chance. If even a strong model can't
// beat chance there, ordering's residual is non-inferable by construction => backstop/ask is
// the correct answer, not a coverage gap.
//
// Scoring is mechanical: the model emits a coarse class; matches := (class === truthClass6).
// matches_truth is NOT read from the TSV — it is computed here so the label-aware author of
// the run never hand-scores a row.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { truthClass6 } from '../scoring.mjs';

const { requirements: reqs } = JSON.parse(
  readFileSync(new URL('../corpus/requirements.json', import.meta.url), 'utf8'),
);
const byId = Object.fromEntries(reqs.map((r) => [r.id, r]));

const rows = readFileSync(new URL('./verdicts.tsv', import.meta.url), 'utf8').trim().split('\n')
  .slice(1).map((l) => { const c = l.split('\t'); return { id: c[0], model: c[1], pred: c[2] }; })
  .filter((r) => r.model && r.model !== 'EXAMPLE')
  .map((r) => ({ ...r, truth: truthClass6(byId[r.id]?.intended_order), inferable: byId[r.id]?.inferable }))
  .map((r) => ({ ...r, matches: r.pred === r.truth ? 1 : 0 }));

function split(set) {
  const inf = set.filter((r) => r.inferable === true);
  const non = set.filter((r) => r.inferable === false);
  const pct = (g) => g.length ? +(100 * g.reduce((s, r) => s + r.matches, 0) / g.length).toFixed(1) : null;
  return {
    inferable: { n: inf.length, hit: inf.reduce((s, r) => s + r.matches, 0), pct: pct(inf) },
    nonInferable: { n: non.length, hit: non.reduce((s, r) => s + r.matches, 0), pct: pct(non) },
  };
}

const models = [...new Set(rows.map((r) => r.model))];
const perModel = Object.fromEntries(models.map((m) => [m, split(rows.filter((r) => r.model === m))]));

const heurPath = new URL('./results-heuristic.json', import.meta.url);
const heuristic = existsSync(heurPath) ? JSON.parse(readFileSync(heurPath, 'utf8')) : null;

const out = {
  chancePct: +(100 / 6).toFixed(1),
  heuristic: heuristic && { inferable: heuristic.inferable, nonInferable: heuristic.nonInferable },
  pooled: rows.length ? split(rows) : null,
  perModel: rows.length ? perModel : null,
  rows, // full per-(model,id) detail incl. pred/truth/matches for audit
};
writeFileSync(new URL('./results.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');

const h = out.heuristic;
process.stdout.write(`E4 chance=${out.chancePct}%  heuristic infer=${h?.inferable?.pct}% nonInfer=${h?.nonInferable?.pct}%\n`);
if (!rows.length) {
  process.stdout.write('E4 model arm PENDING — verdicts.tsv holds only EXAMPLE rows; run the blind model arm to populate.\n');
} else {
  for (const m of models) {
    const s = perModel[m];
    process.stdout.write(`  ${m.padEnd(7)} infer=${s.inferable.hit}/${s.inferable.n} (${s.inferable.pct}%)  nonInfer=${s.nonInferable.hit}/${s.nonInferable.n} (${s.nonInferable.pct}%)\n`);
  }
  const p = out.pooled;
  process.stdout.write(`  POOLED  infer=${p.inferable.pct}%  nonInfer=${p.nonInferable.pct}%\n`);
}
