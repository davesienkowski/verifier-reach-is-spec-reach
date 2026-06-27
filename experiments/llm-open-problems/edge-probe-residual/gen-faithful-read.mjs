// gen-faithful-read.mjs
// Regenerates the v4 dispatch harness for Task B (wider NI task set: t1–t7).
//
// Produces:
//   BD_narrow/                — specs/tN__narrow.md + code/tN.mjs (tasks t1–t7)
//   BD_surfaced-unresolved/   — specs/tN__surfaced-unresolved.md + code/tN.mjs (tasks t1–t7)
//   BD_surfaced-resolved/     — specs/tN__surfaced-resolved.md + code/tN.mjs (tasks t1,t2,t3,t4,t6,t7; t5 excluded)
//   dispatch-table.json       — 45-cell deterministic dispatch table (3 models × 3 conditions × 5 reps)
//   prompts.json              — verbatim per-condition prompt text
//
// HARD INVARIANT: each BD copies ONLY specs/{tN}__{condition}.md + code/tN.mjs via explicit
// per-file copy. oracle/ is NEVER referenced and never enters any BD.
//
// Does NOT spawn subagents (Wave 5 owns dispatch; this is Wave 4).
//
// Usage:
//   node gen-faithful-read.mjs            -- build BDs + dispatch table
//   node gen-faithful-read.mjs --preflight -- also check model-ID availability via Anthropic API

import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { request } from 'node:https';

const ROOT = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Model pinning — must match v4 exactly for pooling (Assumption A5)
// ---------------------------------------------------------------------------
const MODELS = [
  { short: 'opus',   id: 'claude-opus-4-8' },
  { short: 'sonnet', id: 'claude-sonnet-4-6' },
  { short: 'haiku',  id: 'claude-haiku-4-5-20251001' },
];

// ---------------------------------------------------------------------------
// Per-condition task lists
// t5 (INF control) is excluded from surfaced-resolved: no t5__surfaced-resolved.md exists.
// ---------------------------------------------------------------------------
const CONDITION_TASKS = {
  'narrow':              ['t1','t2','t3','t4','t5','t6','t7'],
  'surfaced-unresolved': ['t1','t2','t3','t4','t5','t6','t7'],
  'surfaced-resolved':   ['t1','t2','t3','t4','t6','t7'],       // t5 excluded
};

const CONDITIONS = ['narrow', 'surfaced-unresolved', 'surfaced-resolved'];
const REPS = [1, 2, 3, 4, 5];

// ---------------------------------------------------------------------------
// Verbatim per-condition prompts (from PROMPTS.md — copy verbatim; task lists
// updated to include t6,t7 per Task B; t5 absent from surfaced-resolved list).
// insufficient_spec verdict offered ONLY in surfaced-unresolved.
// ---------------------------------------------------------------------------
const PROMPTS = {
  'narrow':
`You are a GSD goal-backward verifier. By INSPECTION ONLY (do NOT execute code), decide for each task whether the code satisfies EVERY must_have in its spec.
Verdicts: \`passed\` or \`gaps_found\`. Confidence in [0,1]. Treat each task INDEPENDENT. Spec and code with same Tn prefix are a matched pair.
For each T in [t1,t2,t3,t4,t5,t6,t7]: Read BD/specs/T__narrow.md and BD/code/T.mjs.
Return ONLY a TSV, one row per task: task\tverdict\tconfidence\tone-line note`,

  'surfaced-unresolved':
`You are a GSD goal-backward verifier. By INSPECTION ONLY (do NOT execute code), decide for each task whether the code satisfies EVERY must_have in its spec.
Verdicts: \`passed\` · \`gaps_found\` · \`insufficient_spec\` (spec does not determine behavior on an edge that could change correctness — cannot responsibly rule). Each spec lists "UNRESOLVED edges"; if such an edge could change observed behavior and the spec doesn't decide it, \`insufficient_spec\` is appropriate. Confidence in [0,1]. Treat each task INDEPENDENT. Spec and code with same Tn prefix are a matched pair.
For each T in [t1,t2,t3,t4,t5,t6,t7]: Read BD/specs/T__surfaced-unresolved.md and BD/code/T.mjs.
Return ONLY a TSV, one row per task: task\tverdict\tconfidence\tone-line note`,

  'surfaced-resolved':
`You are a GSD goal-backward verifier. By INSPECTION ONLY (do NOT execute code), decide for each task whether the code satisfies EVERY must_have in its spec (each spec includes an explicit resolved acceptance criterion — check the code against it).
Verdicts: \`passed\` (satisfies all must_haves) or \`gaps_found\` (violates/omits a must_have). Confidence in [0,1]. Treat each task INDEPENDENT. Spec and code with same Tn prefix are a matched pair.
For each T in [t1,t2,t3,t4,t6,t7]: Read BD/specs/T__surfaced-resolved.md and BD/code/T.mjs.
Return ONLY a TSV, one row per task: task\tverdict\tconfidence\tone-line note`,
};

// ---------------------------------------------------------------------------
// Step 1: Build per-condition BDs via explicit allowlist copy
// NEVER oracle/; NEVER cp -r; explicit per-file copy only.
// ---------------------------------------------------------------------------
for (const cond of CONDITIONS) {
  const bdDir   = join(ROOT, `BD_${cond}`);
  const specsDir = join(bdDir, 'specs');
  const codeDir  = join(bdDir, 'code');
  mkdirSync(specsDir, { recursive: true });
  mkdirSync(codeDir,  { recursive: true });

  const tasks = CONDITION_TASKS[cond];
  for (const tN of tasks) {
    // Allowlist copy 1: only this condition's spec file (other conditions absent)
    copyFileSync(
      join(ROOT, 'specs', `${tN}__${cond}.md`),
      join(specsDir, `${tN}__${cond}.md`),
    );
    // Allowlist copy 2: defective implementation (same file for all conditions)
    copyFileSync(
      join(ROOT, 'code', `${tN}.mjs`),
      join(codeDir, `${tN}.mjs`),
    );
  }
  console.log(`Built BD_${cond}/ — ${tasks.length} tasks (specs + code; no oracle/)`);
}

// ---------------------------------------------------------------------------
// Step 2: Produce deterministic 45-cell dispatch table
// 3 models × 3 conditions × 5 reps = 45 cells
// Attribution by table, not subagent self-report (v4 design; mitigates T-06-03).
// ---------------------------------------------------------------------------
const dispatchTable = [];
let cellId = 0;

for (const cond of CONDITIONS) {
  for (const m of MODELS) {
    for (const rep of REPS) {
      dispatchTable.push({
        cell_id:   cellId++,
        model:     m.short,
        model_id:  m.id,
        condition: cond,
        rep,
        bd_path:   `BD_${cond}`,
        tasks:     CONDITION_TASKS[cond],
        prompt:    PROMPTS[cond],
      });
    }
  }
}

// Verify cell count
if (dispatchTable.length !== 45) {
  throw new Error(`FATAL: expected 45 dispatch cells, got ${dispatchTable.length}`);
}

writeFileSync(join(ROOT, 'dispatch-table.json'), JSON.stringify(dispatchTable, null, 2));

// ---------------------------------------------------------------------------
// Step 3: Write prompts file (convenience reference for Wave 5)
// ---------------------------------------------------------------------------
writeFileSync(join(ROOT, 'prompts.json'), JSON.stringify(PROMPTS, null, 2));

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const condSummary = CONDITIONS.map(c => `${c}(${CONDITION_TASKS[c].length} tasks)`).join(', ');
console.log(`\nDispatch table: ${dispatchTable.length} cells`);
console.log(`  Breakdown: 3 models × 3 conditions × 5 reps = 45`);
console.log(`  Models: ${MODELS.map(m => `${m.short}=${m.id}`).join(', ')}`);
console.log(`  Conditions: ${condSummary}`);
console.log(`  Reps: 1–5`);
console.log('\nOutputs:');
console.log('  dispatch-table.json  (45-cell attribution table for Wave 5)');
console.log('  prompts.json         (verbatim per-condition prompts)');
console.log('\nIsolation gate: ls BD_*/ | grep -c oracle  →  expected 0');

// ---------------------------------------------------------------------------
// Step 4: Model pre-flight (--preflight flag)
// Confirms all three model IDs are accessible via Anthropic API.
// Surfaces blocker if any model is unavailable (pooling requires identical IDs — A5).
// Uses only node:https (zero external packages).
// ---------------------------------------------------------------------------
if (process.argv.includes('--preflight')) {
  await runPreflight();
}

async function runPreflight() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('\n[PREFLIGHT] BLOCKER: ANTHROPIC_API_KEY is not set.');
    console.error('[PREFLIGHT] Wave 5 cannot dispatch subagents without a valid API key.');
    console.error('[PREFLIGHT] Set ANTHROPIC_API_KEY and re-run with --preflight to confirm model availability.');
    process.exit(1);
  }

  console.log('\n[PREFLIGHT] Checking model availability via Anthropic API...');
  let availableIds;
  try {
    availableIds = await listAvailableModels(apiKey);
  } catch (err) {
    console.error(`[PREFLIGHT] BLOCKER: Failed to query Anthropic API: ${err.message}`);
    console.error('[PREFLIGHT] Cannot confirm model availability. Resolve API access before Wave 5.');
    process.exit(1);
  }

  let allOk = true;
  for (const m of MODELS) {
    const ok = availableIds.includes(m.id);
    console.log(`[PREFLIGHT] ${ok ? 'OK' : 'MISSING'}: ${m.short} = ${m.id}`);
    if (!ok) allOk = false;
  }

  if (!allOk) {
    console.error('\n[PREFLIGHT] BLOCKER: One or more required model IDs are not available.');
    console.error('[PREFLIGHT] Pooling with v4 requires IDENTICAL model IDs (Assumption A5).');
    console.error('[PREFLIGHT] Do NOT substitute; confirm correct IDs before Wave 5 dispatch.');
    process.exit(1);
  }

  console.log('[PREFLIGHT] All three model IDs confirmed available. Wave 5 may proceed.');
}

function listAvailableModels(apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/models',
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
    };

    const req = request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
        }
        try {
          const data = JSON.parse(body);
          // Anthropic list-models response: { data: [{ id, ... }, ...] }
          const ids = (data.data || []).map(m => m.id);
          resolve(ids);
        } catch (e) {
          reject(new Error(`Failed to parse API response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout (10s)'));
    });
    req.end();
  });
}
