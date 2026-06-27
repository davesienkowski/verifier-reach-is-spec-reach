// reparse-audit.mjs
// INDEPENDENT re-parser for adversarial audit A3.
//
// PURPOSE: Reconstruct verdicts.v5-task-b.tsv from the raw subagent returns
// in verdicts.v5-task-b.detail.jsonl, using an independent implementation
// that does NOT import parse-verdicts.mjs. Diff the output against the
// committed TSV to confirm 0 diffs (A3: verdict fidelity).
//
// Usage (A3 verification):
//   node reparse-audit.mjs verdicts.v5-task-b.detail.jsonl |
//     diff - <(tail -n +2 verdicts.v5-task-b.tsv) && echo "A3: 0 diffs"
//
// Architecture:
//   - Reads dispatch identity (rep, model, condition) from each JSONL cell.
//   - Parses the raw field (tab-delimited verdict output) to extract
//     (task, verdict, confidence).
//   - Stamps regime and edgeprobe from the INDEPENDENT lookup tables below
//     (source of truth: EDGEPROBE-CLASSIFICATION.md).
//   - Emits canonical 8-col TSV rows in cell_id order, preserving task order
//     within each cell's raw output.
//
// This re-parser is intentionally simpler than parse-verdicts.mjs because
// all 45 raw returns are clean tab-delimited TSVs with no prose or Markdown
// (verified during development: every raw line has 3+ tab-separated parts
// with valid task IDs; no quarantine-eligible lines).
//
// DOES NOT: import parse-verdicts.mjs, write parse-rejects.log, handle
// Markdown table rows, or strip hedge parentheticals.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Lookup tables — INDEPENDENT of parse-verdicts.mjs.
// Source of truth: EDGEPROBE-CLASSIFICATION.md
// ---------------------------------------------------------------------------
const REGIME = {
  t1: 'NI', t2: 'NI', t3: 'NI', t4: 'NI',
  t5: 'INF',
  t6: 'NI', t7: 'NI',
};

const EDGEPROBE = {
  t1: 'HIT', t2: 'HIT', t3: 'MISS', t4: 'HIT',
  t5: 'INF',
  t6: 'MISS', t7: 'MISS',
};

const KNOWN_TASKS = new Set(['t1', 't2', 't3', 't4', 't5', 't6', 't7']);

// ---------------------------------------------------------------------------
// Read and sort cells by cell_id (JSONL order is already sorted, but be explicit)
// ---------------------------------------------------------------------------
const jsonlFile = process.argv[2] || join(ROOT, 'verdicts.v5-task-b.detail.jsonl');
const cells = readFileSync(jsonlFile, 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l))
  .sort((a, b) => a.cell_id - b.cell_id);

// ---------------------------------------------------------------------------
// Parse each cell's raw output and emit canonical 8-col TSV rows
// ---------------------------------------------------------------------------
const outputRows = [];

for (const cell of cells) {
  const { rep, model, condition, raw } = cell;

  const rawLines = raw.split('\n');
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Each valid raw line is: task\tverdict\tconfidence[\tnote...]
    const parts = trimmed.split('\t');
    if (parts.length < 3) continue;

    const task = parts[0].trim();
    if (!KNOWN_TASKS.has(task)) continue;

    const verdict = parts[1].trim();
    const confidence = parts[2].trim();

    // Stamp regime and edgeprobe from lookup (NOT from subagent text)
    const regime    = REGIME[task]    ?? 'UNKNOWN';
    const edgeprobe = EDGEPROBE[task] ?? 'UNKNOWN';

    outputRows.push([rep, model, condition, task, regime, edgeprobe, verdict, confidence].join('\t'));
  }
}

process.stdout.write(outputRows.join('\n') + '\n');
