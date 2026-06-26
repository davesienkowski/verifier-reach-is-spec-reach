// E3 analysis: open vs forced-choice elicitation, per model.
// Reads verdicts.tsv (one row per requirement x prompt_type x model), SELF-SCORES each
// committed answer against the corpus via the shared truthClass4 mapping (the 4-class forced
// vocabulary), and reports resolved-rate and match-to-truth per prompt type, per model,
// split by inferable.
//
// Scoring is mechanical: matches := (resolved && choice === truthClass4(intended_order)).
// An open answer that hedges (resolved=0) cannot match. matches is computed here, never read
// from the TSV, so the label-aware author of the run never hand-scores a row.
//
// The finding to look for: forced choice drives resolved-rate to ~100% but does NOT lift
// match-to-truth on the NON-INFERABLE items — i.e. it manufactures confident-but-wrong
// resolutions, the exact failure mode the soft gate exists to avoid.
import { readFileSync, writeFileSync } from 'node:fs';
import { truthClass4 } from '../scoring.mjs';

const { requirements: reqs } = JSON.parse(
  readFileSync(new URL('../corpus/requirements.json', import.meta.url), 'utf8'),
);
const byId = Object.fromEntries(reqs.map((r) => [r.id, r]));

const rows = readFileSync(new URL('./verdicts.tsv', import.meta.url), 'utf8').trim().split('\n')
  .slice(1).map((l) => {
    const c = l.split('\t');
    return { id: c[0], prompt: c[1], model: c[2], resolved: +c[3], choice: c[4] };
  })
  .filter((r) => r.model && r.model !== 'EXAMPLE')
  .map((r) => {
    const truth = truthClass4(byId[r.id]?.intended_order);
    return { ...r, truth, inferable: byId[r.id]?.inferable, matches: r.resolved && r.choice === truth ? 1 : 0 };
  });

function agg(set) {
  const n = set.length;
  if (!n) return { n: 0 };
  const resolved = set.reduce((s, r) => s + r.resolved, 0);
  const inf = set.filter((r) => r.inferable === true);
  const non = set.filter((r) => r.inferable === false);
  const matchPct = (g) => g.length ? +(100 * g.reduce((s, r) => s + r.matches, 0) / g.length).toFixed(1) : null;
  return {
    n,
    resolvedRate: +(100 * resolved / n).toFixed(1),
    matchInferable: matchPct(inf),
    matchNonInferable: matchPct(non),
  };
}

const models = [...new Set(rows.map((r) => r.model))];
const perModel = Object.fromEntries(models.map((m) => {
  const mr = rows.filter((r) => r.model === m);
  return [m, { open: agg(mr.filter((r) => r.prompt === 'open')), forced: agg(mr.filter((r) => r.prompt === 'forced')) }];
}));
const pooled = { open: agg(rows.filter((r) => r.prompt === 'open')), forced: agg(rows.filter((r) => r.prompt === 'forced')) };

const out = { pooled: rows.length ? pooled : null, perModel: rows.length ? perModel : null, rows };
writeFileSync(new URL('./results.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');

if (!rows.length) {
  process.stdout.write('E3 PENDING — verdicts.tsv holds only EXAMPLE rows; run the blind elicitation to populate.\n');
} else {
  const f = (a) => a.n ? `resolved=${a.resolvedRate}% matchInf=${a.matchInferable}% matchNonInf=${a.matchNonInferable}%` : 'no rows';
  for (const m of models) {
    process.stdout.write(`  ${m.padEnd(7)} open[ ${f(perModel[m].open)} ]\n          forced[ ${f(perModel[m].forced)} ]\n`);
  }
  process.stdout.write(`  POOLED  open[ ${f(pooled.open)} ]  forced[ ${f(pooled.forced)} ]\n`);
}
