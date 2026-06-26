#!/usr/bin/env node
/**
 * edge-probe-relevance — run the shipped edge-probe engine over an app-flavored corpus and
 * score M1 (relevance precision) + M2 (persona-weighted blind-spot recall).
 *
 * The engine under test is the compiled deterministic artifact from PR #584
 * (gsd-core/bin/lib/edge-probe.cjs). Override its path with EDGE_PROBE_JS.
 *
 * Output: writes specs/<slug>/requirements.json (real engine inputs), prints a summary, and
 * writes results.tsv + phantoms.tsv + misses.tsv.
 *
 * "applicable" / "recall_gt" / persona blind-spots are author-labeled ground truth. Persona
 * blind-spot labels are anchored to noninferable-corpus/verdicts.tsv (Anchor A): adjacency,
 * encoding, and precision-tie edges were missed 0/6 by opus (senior proxy), so they are scored
 * as missed across all tiers. See DESIGN.md.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ENGINE =
  process.env.EDGE_PROBE_JS ||
  join(HERE, '../../../.claude/worktrees/550-edge-probe/gsd-core/bin/lib/edge-probe.cjs');

const ALL_CATS = ['boundary', 'adjacency', 'empty', 'encoding', 'ordering', 'precision', 'idempotency', 'concurrency'];

// persona blind-spot helper: which tiers MISS this edge unaided (true = misses).
// Anchored to Anchor A where applicable.
const MISS_ALL = { vibe: true, mid: true, senior: true };
const MISS_VM = { vibe: true, mid: true, senior: false };
const MISS_V = { vibe: true, mid: false, senior: false };

/**
 * Corpus. Each requirement: realistic vibe-coder prose (what they'd actually type),
 * `applicable` = categories that genuinely apply (precision GT), `recall` = the omitted edge(s)
 * that matter most with the persona blind-spot label (recall GT).
 */
const CORPUS = [
  {
    slug: 'bill-split',
    title: 'Split a bill evenly among friends',
    requirements: [
      { id: 'R1', text: 'Divide the total bill by the number of people so each person sees what they owe',
        applicable: ['boundary', 'empty', 'precision'],
        recall: [{ category: 'precision', why: 'leftover cent when total does not divide evenly', persona: MISS_ALL }] },
      { id: 'R2', text: 'Round each share to two decimal places before showing it',
        applicable: ['precision', 'boundary'],
        recall: [{ category: 'precision', why: 'rounding direction / who absorbs the remainder', persona: MISS_ALL }] },
    ],
  },
  {
    slug: 'profile-pic-upload',
    title: 'Upload a profile picture',
    requirements: [
      { id: 'R1', text: 'Let the user upload a profile picture file',
        applicable: ['encoding', 'boundary', 'empty'],
        recall: [
          { category: 'boundary', why: 'max file size limit', persona: MISS_VM },
          { category: 'encoding', why: 'filename normalization / unicode / type sniffing', persona: MISS_ALL },
        ] },
      { id: 'R2', text: 'Save the uploaded image and show it on their profile page',
        applicable: ['idempotency', 'concurrency'],
        recall: [{ category: 'idempotency', why: 're-upload / double-submit replaces cleanly', persona: MISS_VM }] },
    ],
  },
  {
    slug: 'search-filter',
    title: 'Search and filter a product list',
    requirements: [
      { id: 'R1', text: 'Let users search the list of products by name',
        applicable: ['empty', 'encoding', 'ordering'],
        recall: [
          { category: 'empty', why: 'no-results state', persona: MISS_V },
          { category: 'ordering', why: 'stable / relevance ordering of results', persona: MISS_VM },
        ] },
      { id: 'R2', text: 'Filter the results by category and price range',
        applicable: ['boundary', 'empty', 'ordering'],
        recall: [{ category: 'boundary', why: 'inclusive/exclusive price-range endpoints', persona: MISS_VM }] },
    ],
  },
  {
    slug: 'login-session',
    title: 'Login and session expiry',
    requirements: [
      { id: 'R1', text: 'Log the user in and keep them signed in until the session expires',
        applicable: ['boundary', 'concurrency', 'idempotency'],
        recall: [
          { category: 'boundary', why: 'behavior exactly at the expiry instant', persona: MISS_VM },
          { category: 'concurrency', why: 'parallel logins / refresh race', persona: MISS_VM },
        ] },
      { id: 'R2', text: 'Let the user log out and end their session',
        applicable: ['idempotency', 'concurrency'],
        recall: [{ category: 'idempotency', why: 'double logout is a no-op', persona: MISS_VM }] },
    ],
  },
  {
    slug: 'due-date-reminder',
    title: 'Send a reminder when a task is due',
    requirements: [
      { id: 'R1', text: 'Send the user a reminder when their task is due',
        applicable: ['boundary', 'idempotency', 'concurrency'],
        recall: [
          { category: 'boundary', why: 'timezone / due exactly at midnight', persona: MISS_ALL },
          { category: 'idempotency', why: 'do not double-send on retry', persona: MISS_VM },
        ] },
    ],
  },
  {
    slug: 'pagination',
    title: 'Paginate a list of results',
    requirements: [
      { id: 'R1', text: 'Show the results in pages of twenty items each',
        applicable: ['boundary', 'ordering', 'empty'],
        recall: [
          { category: 'boundary', why: 'requesting a page past the end', persona: MISS_VM },
          { category: 'ordering', why: 'stable order across page boundaries', persona: MISS_ALL },
        ] },
    ],
  },
  {
    slug: 'csv-export',
    title: 'Export records to CSV',
    requirements: [
      { id: 'R1', text: 'Export the table of records to a CSV file the user can download',
        applicable: ['encoding', 'empty'],
        recall: [{ category: 'encoding', why: 'escaping commas/quotes/newlines/unicode in cells', persona: MISS_ALL }] },
    ],
  },
];

function runEngine(requirements) {
  const reqPath = join('/tmp', `epr-${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(reqPath, JSON.stringify(requirements.map((r) => ({ id: r.id, text: r.text }))));
  const out = execFileSync('node', [ENGINE, reqPath], { encoding: 'utf8' });
  return JSON.parse(out);
}

const results = [];
const phantoms = [];
const misses = [];
let recallWeighted = { vibe: { hit: 0, n: 0 }, mid: { hit: 0, n: 0 }, senior: { hit: 0, n: 0 } };
const catPhantom = Object.fromEntries(ALL_CATS.map((c) => [c, 0]));
const catRaised = Object.fromEntries(ALL_CATS.map((c) => [c, 0]));

for (const spec of CORPUS) {
  // write the real engine input artifact
  const specDir = join(HERE, 'specs', spec.slug);
  mkdirSync(specDir, { recursive: true });
  writeFileSync(join(specDir, 'requirements.json'),
    JSON.stringify(spec.requirements.map((r) => ({ id: r.id, text: r.text })), null, 2) + '\n');
  writeFileSync(join(specDir, 'ground-truth.json'), JSON.stringify(spec.requirements, null, 2) + '\n');

  const report = runEngine(spec.requirements);
  const raisedByReq = {};
  for (const it of report.items) {
    (raisedByReq[it.requirement_id] ||= new Set()).add(it.category);
    catRaised[it.category]++;
  }

  for (const req of spec.requirements) {
    const raised = raisedByReq[req.id] || new Set();
    const applicable = new Set(req.applicable);
    const tp = [...raised].filter((c) => applicable.has(c));        // raised & applicable
    const fp = [...raised].filter((c) => !applicable.has(c));       // phantom edges
    const fn = [...applicable].filter((c) => !raised.has(c));       // applicable but not raised
    for (const c of fp) { phantoms.push([spec.slug, req.id, c]); catPhantom[c]++; }

    const precision = raised.size ? tp.length / raised.size : 1;
    results.push({ slug: spec.slug, req: req.id, raised: raised.size, applicable: applicable.size,
      tp: tp.length, phantom: fp.length, missed_applicable: fn.length, precision });

    // recall (M2): is each recall-GT edge raised? weight by persona blind-spot.
    for (const rg of req.recall) {
      const hit = raised.has(rg.category);
      if (!hit) misses.push([spec.slug, req.id, rg.category, rg.why]);
      for (const tier of ['vibe', 'mid', 'senior']) {
        if (rg.persona[tier]) { // tier would MISS this unaided -> probe has value here
          recallWeighted[tier].n++;
          if (hit) recallWeighted[tier].hit++;
        }
      }
    }
  }
}

// ---- summary ----
const totRaised = results.reduce((a, r) => a + r.raised, 0);
const totPhantom = results.reduce((a, r) => a + r.phantom, 0);
const totApplicable = results.reduce((a, r) => a + r.applicable, 0);
const totMissedApp = results.reduce((a, r) => a + r.missed_applicable, 0);
const nReqs = results.length;
const microPrecision = (totRaised - totPhantom) / totRaised;

const fmt = (x) => (x * 100).toFixed(0) + '%';
console.log(`\nENGINE: ${ENGINE}`);
console.log(`Corpus: ${CORPUS.length} specs, ${nReqs} requirements\n`);
console.log(`M1 — RELEVANCE PRECISION`);
console.log(`  edges raised: ${totRaised}   phantom (FP): ${totPhantom}   micro-precision: ${fmt(microPrecision)}`);
console.log(`  phantom edges per requirement: ${(totPhantom / nReqs).toFixed(2)}  (N18 shippable bar ~2.2/task)`);
console.log(`  applicable edges the engine MISSED: ${totMissedApp}/${totApplicable} (${fmt(totMissedApp / totApplicable)} of applicable not raised)`);
console.log(`  phantoms by category: ${ALL_CATS.filter((c) => catPhantom[c]).map((c) => `${c}=${catPhantom[c]}`).join(', ') || 'none'}`);
console.log(`\nM2 — PERSONA-WEIGHTED BLIND-SPOT RECALL (recall on edges each tier would miss unaided)`);
for (const t of ['vibe', 'mid', 'senior']) {
  const w = recallWeighted[t];
  console.log(`  ${t.padEnd(7)} ${w.hit}/${w.n} recall-GT edges surfaced = ${w.n ? fmt(w.hit / w.n) : 'n/a'}`);
}
console.log(`\nMissed recall-GT edges (the ones the probe should catch and didn't):`);
for (const m of misses) console.log(`  ${m[0]}/${m[1]}: ${m[2]} — ${m[3]}`);

// ---- tsvs ----
const w = (p, rows) => writeFileSync(join(HERE, p), rows.map((r) => r.join('\t')).join('\n') + '\n');
w('results.tsv', [['slug', 'req', 'raised', 'applicable', 'tp', 'phantom', 'missed_applicable', 'precision'],
  ...results.map((r) => [r.slug, r.req, r.raised, r.applicable, r.tp, r.phantom, r.missed_applicable, r.precision.toFixed(2)])]);
w('phantoms.tsv', [['slug', 'req', 'phantom_category'], ...phantoms]);
w('misses.tsv', [['slug', 'req', 'missed_category', 'why'], ...misses]);
console.log(`\nwrote results.tsv, phantoms.tsv, misses.tsv, specs/*/`);
