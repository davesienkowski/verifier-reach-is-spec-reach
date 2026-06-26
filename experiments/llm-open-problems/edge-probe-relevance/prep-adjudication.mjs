#!/usr/bin/env node
/**
 * Test B prep — collect every phantom (raised-but-GT-marked-inapplicable) edge from the deterministic
 * engine and from sonnet (floor rep1) on the ORIGINAL corpus, source-blinded, for a judge to rate
 * "genuinely applies / spurious". Writes adjudication-items.json (judge input: id+req text+category
 * only) and adjudication-key.json (id→source, for scoring).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ENGINE = process.env.EDGE_PROBE_JS ||
  join(HERE, '../../../.claude/worktrees/550-edge-probe/gsd-core/bin/lib/edge-probe.cjs');
const SLUGS = ['bill-split', 'profile-pic-upload', 'search-filter', 'login-session', 'due-date-reminder', 'pagination', 'csv-export'];
const j = (p) => JSON.parse(readFileSync(p, 'utf8'));
const PROBE = {
  boundary: 'Behavior exactly at a min/max/threshold and one step either side',
  adjacency: 'When two things are exactly equal or just touch, do they merge/collide/separate',
  empty: 'Result for empty, single-element, or null input',
  encoding: 'Whose definition of length/equality applies (bytes, code points, graphemes, normalization)',
  ordering: 'When elements compare equal, is output order specified and stable',
  precision: 'Where precision loss or overflow can occur, and the contract',
  idempotency: 'What happens if this runs twice on the same input',
  concurrency: 'If interrupted or run in parallel, what is guaranteed',
};

const GT = {}, TEXT = {};
for (const slug of SLUGS) {
  for (const r of j(join(HERE, 'specs', slug, 'ground-truth.json'))) { GT[`${slug}/${r.id}`] = new Set(r.applicable); TEXT[`${slug}/${r.id}`] = r.text; }
}
// deterministic raised
const detRaised = {};
for (const slug of SLUGS) {
  const tmp = join('/tmp', `adj-${slug}.json`); writeFileSync(tmp, readFileSync(join(HERE, 'specs', slug, 'requirements.json')));
  for (const it of JSON.parse(execFileSync('node', [ENGINE, tmp], { encoding: 'utf8' })).items) (detRaised[`${slug}/${it.requirement_id}`] ||= new Set()).add(it.category);
}
// sonnet rep1 raised
const sonRaised = {};
for (const r of j(join(HERE, 'llm-runs', 'floor', 'sonnet-rep1.json')).runs) for (const req of r.requirements) sonRaised[`${r.slug}/${req.id}`] = new Set(req.applicable_categories || []);

// collect phantoms per source
const phantoms = {}; // key `${rk}|${cat}` -> {rk, cat, sources:Set}
function addPhantoms(raisedMap, source) {
  for (const rk of Object.keys(GT)) for (const cat of (raisedMap[rk] || [])) {
    if (!GT[rk].has(cat)) { const k = `${rk}|${cat}`; (phantoms[k] ||= { rk, cat, sources: new Set() }).sources.add(source); }
  }
}
addPhantoms(detRaised, 'engine');
addPhantoms(sonRaised, 'sonnet');

const items = [], key = {};
let i = 0;
for (const { rk, cat, sources } of Object.values(phantoms)) {
  const id = `Q${++i}`;
  items.push({ id, requirement: TEXT[rk], category: cat, category_means: PROBE[cat] });
  key[id] = { rk, cat, sources: [...sources] };
}
// shuffle items so order leaks no source signal
for (let a = items.length - 1; a > 0; a--) { const b = Math.floor(Math.random() * (a + 1)); [items[a], items[b]] = [items[b], items[a]]; }
writeFileSync(join(HERE, 'adjudication-items.json'), JSON.stringify(items, null, 2) + '\n');
writeFileSync(join(HERE, 'adjudication-key.json'), JSON.stringify(key, null, 2) + '\n');
console.log(`${items.length} phantom items to adjudicate (engine: ${Object.values(phantoms).filter((p) => p.sources.has('engine')).length}, sonnet: ${Object.values(phantoms).filter((p) => p.sources.has('sonnet')).length})`);
