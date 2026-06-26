#!/usr/bin/env node
/**
 * Score the LLM-in-the-loop edge-probe condition (llm-runs/*.json, produced by 7 blind
 * subagents given the real edge-probe.md protocol) against the SAME ground truth used for the
 * deterministic engine (specs/<slug>/ground-truth.json), and compare head-to-head. The
 * deterministic baseline is re-derived by re-running the engine for exactness.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SLUGS = ['bill-split', 'profile-pic-upload', 'search-filter', 'login-session',
  'due-date-reminder', 'pagination', 'csv-export'];
const ENGINE = process.env.EDGE_PROBE_JS ||
  join(HERE, '../../../.claude/worktrees/550-edge-probe/gsd-core/bin/lib/edge-probe.cjs');
const j = (p) => JSON.parse(readFileSync(p, 'utf8'));

// ground truth: per requirement { applicable[], recall[{category,persona}] }
const GT = {};
for (const slug of SLUGS) {
  GT[slug] = Object.fromEntries(j(join(HERE, 'specs', slug, 'ground-truth.json')).map((r) => [r.id, r]));
}

function scoreRun(getRaised, label) {
  let raisedT = 0, phantomT = 0, applicableT = 0, missedAppT = 0, nReq = 0;
  const rw = { vibe: { hit: 0, n: 0 }, mid: { hit: 0, n: 0 }, senior: { hit: 0, n: 0 } };
  const missedRecall = [], phantomList = [];
  for (const slug of SLUGS) {
    for (const [id, gt] of Object.entries(GT[slug])) {
      const raised = new Set(getRaised(slug, id));
      const applicable = new Set(gt.applicable);
      const fp = [...raised].filter((c) => !applicable.has(c));
      const fn = [...applicable].filter((c) => !raised.has(c));
      raisedT += raised.size; phantomT += fp.length; applicableT += applicable.size;
      missedAppT += fn.length; nReq++;
      for (const c of fp) phantomList.push(`${slug}/${id}:${c}`);
      for (const rg of gt.recall) {
        const hit = raised.has(rg.category);
        if (!hit) missedRecall.push(`${slug}/${id}:${rg.category}`);
        for (const t of ['vibe', 'mid', 'senior']) if (rg.persona[t]) { rw[t].n++; if (hit) rw[t].hit++; }
      }
    }
  }
  return { label, raisedT, phantomT, applicableT, missedAppT, nReq, rw, missedRecall, phantomList,
    precision: (raisedT - phantomT) / raisedT, underfire: missedAppT / applicableT };
}

// deterministic raised set — re-run the engine for exactness
const detRaised = {};
for (const slug of SLUGS) {
  const tmp = join('/tmp', `epr-det-${slug}.json`);
  writeFileSync(tmp, readFileSync(join(HERE, 'specs', slug, 'requirements.json')));
  const rep = JSON.parse(execFileSync('node', [ENGINE, tmp], { encoding: 'utf8' }));
  for (const it of rep.items) (detRaised[`${slug}/${it.requirement_id}`] ||= new Set()).add(it.category);
}

// llm raised set
const llmRaised = {};
for (const slug of SLUGS) {
  for (const r of j(join(HERE, 'llm-runs', `${slug}.json`)).requirements) {
    llmRaised[`${slug}/${r.id}`] = r.applicable_categories;
  }
}

const D = scoreRun((slug, id) => [...(detRaised[`${slug}/${id}`] || [])], 'deterministic engine');
const L = scoreRun((slug, id) => llmRaised[`${slug}/${id}`] || [], 'LLM-in-the-loop (opus, blind)');

const pct = (x) => (x * 100).toFixed(0) + '%';
const r = (s, t) => `${s.rw[t].hit}/${s.rw[t].n} (${pct(s.rw[t].hit / s.rw[t].n)})`;
for (const s of [D, L]) {
  console.log(`\n=== ${s.label} ===`);
  console.log(`  raised ${s.raisedT}  phantom ${s.phantomT}  → precision ${pct(s.precision)}  (${(s.phantomT / s.nReq).toFixed(2)}/req)`);
  console.log(`  applicable missed ${s.missedAppT}/${s.applicableT} → under-fire ${pct(s.underfire)}`);
  console.log(`  persona recall: vibe ${r(s, 'vibe')}  mid ${r(s, 'mid')}  senior ${r(s, 'senior')}`);
  console.log(`  phantoms: ${s.phantomList.join(', ') || 'none'}`);
  console.log(`  missed recall-GT: ${s.missedRecall.join(', ') || 'NONE'}`);
}
console.log('\n=== head-to-head ===');
console.log(`  precision:   det ${pct(D.precision)}  →  llm ${pct(L.precision)}`);
console.log(`  under-fire:  det ${pct(D.underfire)}  →  llm ${pct(L.underfire)}`);
console.log(`  vibe recall: det ${r(D, 'vibe')}  →  llm ${r(L, 'vibe')}`);
console.log(`  all recall-GT misses: det ${D.missedRecall.length}  →  llm ${L.missedRecall.length}`);
