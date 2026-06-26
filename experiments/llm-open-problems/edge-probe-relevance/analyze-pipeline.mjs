#!/usr/bin/env node
/**
 * Test #4 — end-to-end of the PROPOSED pipeline: LLM infers shapes → deterministic engine maps
 * shapes→categories. Scores the engine's category output (not the LLM's category picks). Compares to
 * (a) deterministic engine with its own regex shapes, (b) LLM-picks-categories-directly proxy (floor).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ENGINE = process.env.EDGE_PROBE_JS ||
  join(HERE, '../../../.claude/worktrees/550-edge-probe/gsd-core/bin/lib/edge-probe.cjs');
const SLUGS = ['bill-split', 'profile-pic-upload', 'search-filter', 'login-session', 'due-date-reminder', 'pagination', 'csv-export'];
const VALID_SHAPES = new Set(['numeric-range', 'collection', 'text', 'stateful', 'io']);
const j = (p) => JSON.parse(readFileSync(p, 'utf8'));

const GT = {}, TEXT = {};
for (const s of SLUGS) for (const r of j(join(HERE, 'specs', s, 'ground-truth.json'))) { (GT[s] ??= {})[r.id] = r; TEXT[`${s}/${r.id}`] = r.text; }

function score(raisedFor) {
  let raised = 0, ph = 0, app = 0, miss = 0; const rw = { vibe: [0, 0], mid: [0, 0], senior: [0, 0] };
  for (const s of SLUGS) for (const [id, gt] of Object.entries(GT[s])) {
    const set = new Set(raisedFor(s, id)); const a = new Set(gt.applicable);
    raised += set.size; ph += [...set].filter((c) => !a.has(c)).length; app += a.size; miss += [...a].filter((c) => !set.has(c)).length;
    for (const rg of gt.recall) for (const t of ['vibe', 'mid', 'senior']) if (rg.persona[t]) { rw[t][1]++; if (set.has(rg.category)) rw[t][0]++; }
  }
  const p = (x) => Math.round(100 * x) + '%';
  return `precision ${p((raised - ph) / raised).padEnd(4)} under-fire ${p(miss / app).padEnd(4)} recall ${p(rw.vibe[0] / rw.vibe[1])}/${p(rw.mid[0] / rw.mid[1])}/${p(rw.senior[0] / rw.senior[1])}`;
}

function engineOn(reqsBySpec) { // reqsBySpec: slug -> [{id,text,shapes?}]
  const raised = {};
  for (const s of SLUGS) {
    const tmp = join('/tmp', `pipe-${s}-${Math.random().toString(36).slice(2)}.json`);
    writeFileSync(tmp, JSON.stringify(reqsBySpec[s]));
    for (const it of JSON.parse(execFileSync('node', [ENGINE, tmp], { encoding: 'utf8' })).items)
      (raised[`${s}/${it.requirement_id}`] ||= new Set()).add(it.category);
  }
  return (s, i) => [...(raised[`${s}/${i}`] || [])];
}

// (a) deterministic — engine classifies shapes from prose
const detReqs = {}; for (const s of SLUGS) detReqs[s] = j(join(HERE, 'specs', s, 'requirements.json'));
const det = engineOn(detReqs);

// (4) pipeline — LLM shapes -> engine
function pipelineFor(repFile) {
  const shapes = {};
  for (const r of j(repFile).runs) for (const req of r.requirements) shapes[`${r.slug}/${req.id}`] = (req.shapes || []).filter((x) => VALID_SHAPES.has(x));
  const reqs = {};
  for (const s of SLUGS) reqs[s] = Object.keys(GT[s]).map((id) => ({ id, text: TEXT[`${s}/${id}`], shapes: shapes[`${s}/${id}`] || [] }));
  return engineOn(reqs);
}

console.log('\nTest #4 — proposed pipeline (LLM infers shapes -> deterministic engine maps -> categories)\n');
console.log(`  (a) deterministic (regex shapes -> engine):     ${score(det)}`);
for (const rep of ['rep1', 'rep2']) {
  console.log(`  (4) LLM shapes ${rep} -> engine:                  ${score(pipelineFor(join(HERE, 'llm-runs', 'shapes', `sonnet-${rep}.json`)))}`);
}
console.log(`\n  ref: LLM-picks-categories-directly (sonnet floor): precision 83% under-fire 14% recall 88/87/100%`);
// dump the LLM-inferred shapes for transparency
console.log('\n  LLM-inferred shapes (rep1):');
for (const r of j(join(HERE, 'llm-runs', 'shapes', 'sonnet-rep1.json')).runs)
  for (const req of r.requirements) console.log(`    ${(r.slug + '/' + req.id).padEnd(28)} ${req.shapes.join(', ')}`);
