#!/usr/bin/env node
/**
 * Floor run: score 3 tiers × 3 reps (haiku/sonnet/opus) of the blind LLM classifier against the
 * same ground truth, report per-tier mean + range (variance), vs the deterministic engine baseline.
 * Inputs: llm-runs/floor/<tier>-rep<N>.json  ({runs:[{slug,requirements:[{id,applicable_categories}]}]}).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SLUGS = ['bill-split', 'profile-pic-upload', 'search-filter', 'login-session',
  'due-date-reminder', 'pagination', 'csv-export'];
const TIERS = ['haiku', 'sonnet', 'opus'];
const REPS = [1, 2, 3];
const ENGINE = process.env.EDGE_PROBE_JS ||
  join(HERE, '../../../.claude/worktrees/550-edge-probe/gsd-core/bin/lib/edge-probe.cjs');
const j = (p) => JSON.parse(readFileSync(p, 'utf8'));

const GT = {};
for (const slug of SLUGS) GT[slug] = Object.fromEntries(j(join(HERE, 'specs', slug, 'ground-truth.json')).map((r) => [r.id, r]));

// raisedFor: (slug,id) -> array of category ids
function score(raisedFor) {
  let raised = 0, phantom = 0, applicable = 0, missedApp = 0;
  const rw = { vibe: { hit: 0, n: 0 }, mid: { hit: 0, n: 0 }, senior: { hit: 0, n: 0 } };
  for (const slug of SLUGS) for (const [id, gt] of Object.entries(GT[slug])) {
    const set = new Set(raisedFor(slug, id));
    const app = new Set(gt.applicable);
    raised += set.size;
    phantom += [...set].filter((c) => !app.has(c)).length;
    applicable += app.size;
    missedApp += [...app].filter((c) => !set.has(c)).length;
    for (const rg of gt.recall) for (const t of ['vibe', 'mid', 'senior']) if (rg.persona[t]) { rw[t].n++; if (set.has(rg.category)) rw[t].hit++; }
  }
  return { precision: (raised - phantom) / raised, underfire: missedApp / applicable,
    vibe: rw.vibe.hit / rw.vibe.n, mid: rw.mid.hit / rw.mid.n, senior: rw.senior.hit / rw.senior.n,
    phantom, raised };
}

// deterministic baseline
const detRaised = {};
for (const slug of SLUGS) {
  const tmp = join('/tmp', `epr-floor-det-${slug}.json`);
  writeFileSync(tmp, readFileSync(join(HERE, 'specs', slug, 'requirements.json')));
  for (const it of JSON.parse(execFileSync('node', [ENGINE, tmp], { encoding: 'utf8' })).items)
    (detRaised[`${slug}/${it.requirement_id}`] ||= new Set()).add(it.category);
}
const det = score((s, i) => [...(detRaised[`${s}/${i}`] || [])]);

// floor reps
const perTier = {};
for (const tier of TIERS) {
  const reps = [];
  for (const n of REPS) {
    const f = join(HERE, 'llm-runs', 'floor', `${tier}-rep${n}.json`);
    if (!existsSync(f)) continue;
    const map = {};
    for (const r of j(f).runs) for (const req of r.requirements) map[`${r.slug}/${req.id}`] = req.applicable_categories || [];
    reps.push(score((s, i) => map[`${s}/${i}`] || []));
  }
  perTier[tier] = reps;
}

const pct = (x) => (x * 100).toFixed(0) + '%';
const agg = (reps, key) => {
  const v = reps.map((r) => r[key]);
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  return { mean, min: Math.min(...v), max: Math.max(...v) };
};
const cell = (reps, key) => { const a = agg(reps, key); return `${pct(a.mean)} [${pct(a.min)}–${pct(a.max)}]`; };

console.log(`\nFloor run — 3 reps/tier, ${SLUGS.length} specs / 11 reqs, scored vs same GT\n`);
console.log(`metric           deterministic     haiku(x3)              sonnet(x3)             opus(x3)`);
const row = (label, key, detKey = key) =>
  console.log(`${label.padEnd(16)} ${pct(det[detKey]).padEnd(17)} ${cell(perTier.haiku, key).padEnd(22)} ${cell(perTier.sonnet, key).padEnd(22)} ${cell(perTier.opus, key)}`);
row('precision', 'precision');
row('under-fire', 'underfire');
row('recall vibe', 'vibe');
row('recall mid', 'mid');
row('recall senior', 'senior');
console.log(`\n(under-fire = applicable edges the classifier failed to raise; lower is better. recall = on edges that tier would miss unaided; higher is better.)`);

// per-rep dump for transparency
console.log(`\nper-rep precision / under-fire:`);
for (const tier of TIERS) console.log(`  ${tier}: ` + perTier[tier].map((r, i) => `r${i + 1} ${pct(r.precision)}/${pct(r.underfire)}`).join('  '));

// write tsv
const rows = [['tier', 'rep', 'precision', 'underfire', 'recall_vibe', 'recall_mid', 'recall_senior', 'phantom', 'raised']];
rows.push(['deterministic', '-', det.precision, det.underfire, det.vibe, det.mid, det.senior, det.phantom, det.raised].map(String));
for (const tier of TIERS) perTier[tier].forEach((r, i) =>
  rows.push([tier, `rep${i + 1}`, r.precision.toFixed(3), r.underfire.toFixed(3), r.vibe.toFixed(3), r.mid.toFixed(3), r.senior.toFixed(3), r.phantom, r.raised].map(String)));
writeFileSync(join(HERE, 'floor-results.tsv'), rows.map((r) => r.join('\t')).join('\n') + '\n');
console.log(`\nwrote floor-results.tsv`);
