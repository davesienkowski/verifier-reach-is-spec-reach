// parse-verdicts.mjs
// Defensive 8-column TSV parser for Wave 5 verdict collection.
//
// Converts a subagent's free-text TSV output to canonical 8-column rows:
//   rep\tmodel\tcondition\ttask\tregime\tedgeprobe\tverdict\tconfidence
//
// Regime and edgeprobe are stamped from the lookup table (NOT from subagent text),
// satisfying T-06-03 (attribution by dispatch table, not self-report).
//
// Postel's Law + ARTIFICER-REVIEW P1: parser is tolerant of prose/hedge/partial
// rows but FAIL LOUD — any row it cannot confidently parse is quarantined to
// parse-rejects.log and the process exits nonzero. NEVER silently drop a row.
//
// Usage:
//   node parse-verdicts.mjs --rep N --model M --condition C [--input file] [--output file]
//   node parse-verdicts.mjs --cell-id N [--input file] [--output file]
//   node parse-verdicts.mjs --selftest

import { readFileSync, appendFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Lookup tables — source of truth: EDGEPROBE-CLASSIFICATION.md
// regime: NI = non-inferable; INF = inferable control
// edgeprobe: HIT / MISS / INF (t5 only)
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

// Valid verdicts per condition (insufficient_spec ONLY in surfaced-unresolved)
const VALID_VERDICTS = {
  'narrow':              ['passed', 'gaps_found'],
  'surfaced-unresolved': ['passed', 'gaps_found', 'insufficient_spec'],
  'surfaced-resolved':   ['passed', 'gaps_found'],
};

const KNOWN_TASKS = new Set(['t1','t2','t3','t4','t5','t6','t7']);
const REJECTS_LOG = join(ROOT, 'parse-rejects.log');

// ---------------------------------------------------------------------------
// parseLine: extract (task, verdict, confidence) from one free-text line.
// Returns { task, verdict, confidence } or null if the line is not a data row.
//
// Tolerant of:
//   - Markdown table rows: | t1 | passed | 0.9 | note |
//   - Backtick-wrapped values: `passed`
//   - Hedged verdicts: "passed (probably)", "gaps_found — minor issue"
//   - Extra trailing columns (note text)
//   - Tab or pipe delimiters
// ---------------------------------------------------------------------------
function parseLine(raw, condition) {
  const line = raw.trim();

  // Skip blank lines, markdown separator rows, and header rows
  if (!line) return null;
  if (/^[-|=+\s]+$/.test(line)) return null;
  if (/^task\b/i.test(line) || /^t\s*\|?\s*verdict/i.test(line)) return null;

  // Strip leading/trailing pipes (markdown tables)
  let normalized = line.replace(/^\||\|$/g, '').trim();

  // Split by preferred delimiter: tab, then pipe, then 2+ spaces
  let parts;
  if (normalized.includes('\t')) {
    parts = normalized.split('\t');
  } else if (normalized.includes('|')) {
    parts = normalized.split('|').map(s => s.trim()).filter(s => s !== '');
  } else {
    parts = normalized.split(/\s{2,}/);
  }

  // Clean each part: strip backticks and bold markers
  parts = parts.map(p =>
    p.trim().replace(/^`|`$/g, '').replace(/^\*\*|\*\*$/g, '').trim()
  );

  // Require at least 3 parts (task, verdict, confidence)
  if (parts.length < 3) return null;

  const taskRaw    = parts[0];
  const verdictRaw = parts[1];
  const confRaw    = parts[2];

  // --- Extract task ID ---
  const taskMatch = taskRaw.match(/\b(t[1-7])\b/i);
  if (!taskMatch) return null;
  const task = taskMatch[1].toLowerCase();
  if (!KNOWN_TASKS.has(task)) return null;

  // --- Extract verdict (normalize hedged variants) ---
  const verdictNorm = verdictRaw
    .toLowerCase()
    .replace(/\(.*?\)/g, '')         // strip (parenthetical hedge)
    .replace(/[?!.]/g, '')           // strip trailing punctuation
    .replace(/\s*[-–—].*$/, '')      // strip "— trailing explanation"
    .trim();

  const validList = VALID_VERDICTS[condition] || VALID_VERDICTS['narrow'];
  let verdict = null;

  // Exact match first
  for (const v of validList) {
    if (verdictNorm === v) { verdict = v; break; }
  }
  // Prefix/contains match as fallback
  if (!verdict) {
    if (verdictNorm.includes('insufficient')) verdict = 'insufficient_spec';
    else if (verdictNorm.includes('gaps'))    verdict = 'gaps_found';
    else if (verdictNorm.includes('pass'))    verdict = 'passed';
  }

  if (!verdict) return null;

  // insufficient_spec is only valid in surfaced-unresolved (condition-exact)
  if (verdict === 'insufficient_spec' && condition !== 'surfaced-unresolved') return null;

  // --- Extract confidence ---
  const confMatch = confRaw.match(/([01](?:\.\d+)?|\.\d+)/);
  if (!confMatch) return null;
  const confidence = confMatch[1];

  return { task, verdict, confidence };
}

// ---------------------------------------------------------------------------
// quarantine: append a failing line to parse-rejects.log.
// Called for every task-ref line that cannot be parsed — NEVER silent-drop.
// ---------------------------------------------------------------------------
function quarantine(raw, reason, cellMeta) {
  const ts = new Date().toISOString();
  const entry = `[${ts}] cell=${JSON.stringify(cellMeta)} reason=${reason} line=${JSON.stringify(raw)}\n`;
  appendFileSync(REJECTS_LOG, entry);
}

// ---------------------------------------------------------------------------
// parseSubagentOutput: main entry point for Wave 5 collectors.
//
// Parameters:
//   rawText   — subagent's free-text TSV output string
//   cellMeta  — { rep, model, condition } from the dispatch table
//
// Returns:
//   { rows: string[], rejectCount: number }
//   rows: canonical 8-col TSV rows (no header; Wave 5 appends to verdicts TSV)
//   rejectCount: number of quarantined task-ref lines
// ---------------------------------------------------------------------------
export function parseSubagentOutput(rawText, cellMeta) {
  const { rep, model, condition } = cellMeta;
  const lines = rawText.split('\n');
  const rows = [];
  let rejectCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Quick guard: line must reference a known task ID.
    // Prose paragraphs with no task ref are skipped (explanatory context, not data).
    if (!/\bt[1-7]\b/i.test(trimmed)) continue;

    const parsed = parseLine(trimmed, condition);
    if (!parsed) {
      // Line had a task reference but couldn't be confidently parsed — QUARANTINE.
      // NEVER silently drop (P1 / ARTIFICER-REVIEW): silent drop biases the dataset.
      rejectCount++;
      quarantine(line, 'parse-failed', cellMeta);
      continue;
    }

    const { task, verdict, confidence } = parsed;
    // Regime and edgeprobe stamped from lookup (NOT from subagent text — T-06-03)
    const regime    = REGIME[task]    ?? 'UNKNOWN';
    const edgeprobe = EDGEPROBE[task] ?? 'UNKNOWN';

    // Canonical 8-col row matching analyze.mjs positional schema exactly
    rows.push([rep, model, condition, task, regime, edgeprobe, verdict, confidence].join('\t'));
  }

  return { rows, rejectCount };
}

// ---------------------------------------------------------------------------
// runSelfTest: inline assertions (no node:test TAP overhead for clean output).
// Asserts:
//   (a) A prose-laden / hedged line parses to a clean 8-col row.
//   (b) A genuinely-unparseable task-ref line is quarantined, not dropped.
// ---------------------------------------------------------------------------
function runSelfTest() {
  const PASS = '\x1b[32mPASS\x1b[0m';
  const FAIL = '\x1b[31mFAIL\x1b[0m';
  let allPassed = true;

  function check(name, fn) {
    try {
      fn();
      console.log(`  ${PASS}  ${name}`);
    } catch (err) {
      console.log(`  ${FAIL}  ${name}: ${err.message}`);
      allPassed = false;
    }
  }

  function eq(actual, expected, label) {
    if (actual !== expected) {
      throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  console.log('parse-verdicts.mjs self-test\n');

  // --- (a) Prose-laden hedged line → clean 8-col row ---
  check('prose-laden hedged verdict parses to clean 8-col row', () => {
    const proseLine = 't3\tgaps_found (I noticed a half-even rounding edge)\t0.85\tMath.round is half-up which differs from half-to-even.';
    const parsed = parseLine(proseLine, 'narrow');
    if (!parsed) throw new Error('parseLine returned null');
    eq(parsed.task,       't3',         'task');
    eq(parsed.verdict,    'gaps_found', 'verdict (hedge stripped)');
    eq(parsed.confidence, '0.85',       'confidence');

    const cellMeta = { rep: 2, model: 'sonnet', condition: 'narrow' };
    const { rows, rejectCount } = parseSubagentOutput(proseLine + '\n', cellMeta);
    if (rows.length !== 1)    throw new Error(`Expected 1 row, got ${rows.length}`);
    if (rejectCount !== 0)    throw new Error(`Expected 0 rejects, got ${rejectCount}`);
    const cols = rows[0].split('\t');
    if (cols.length !== 8)    throw new Error(`Expected 8 cols, got ${cols.length}`);
    eq(cols[0], '2',          'rep');
    eq(cols[1], 'sonnet',     'model');
    eq(cols[2], 'narrow',     'condition');
    eq(cols[3], 't3',         'task');
    eq(cols[4], 'NI',         'regime (from table, not subagent)');
    eq(cols[5], 'MISS',       'edgeprobe (from table, not subagent)');
    eq(cols[6], 'gaps_found', 'verdict');
    eq(cols[7], '0.85',       'confidence');
  });

  // --- Markdown table row ---
  check('markdown table row parses correctly', () => {
    const mdLine = '| t1 | passed | 0.95 | all must_haves satisfied |';
    const parsed = parseLine(mdLine, 'narrow');
    if (!parsed) throw new Error('parseLine returned null for markdown row');
    eq(parsed.task,       't1',    'task');
    eq(parsed.verdict,    'passed','verdict');
    eq(parsed.confidence, '0.95',  'confidence');
  });

  // --- (b) Genuinely-unparseable task-ref line → quarantined, not dropped ---
  check('genuinely-unparseable task-ref line is quarantined (not dropped)', () => {
    // A line that mentions a task but has no parseable verdict/confidence structure
    const badLine = 't6 needs further review — the null-vs-absent handling is ambiguous and I cannot determine pass/fail.';
    const cellMeta = { rep: 1, model: 'haiku', condition: 'surfaced-unresolved' };

    // Read the rejects log before
    const logBefore = existsSync(REJECTS_LOG) ? readFileSync(REJECTS_LOG, 'utf8') : '';

    const { rows, rejectCount } = parseSubagentOutput(badLine + '\n', cellMeta);

    const logAfter = existsSync(REJECTS_LOG) ? readFileSync(REJECTS_LOG, 'utf8') : '';
    const newEntries = logAfter.slice(logBefore.length);

    if (rejectCount !== 1) throw new Error(`Expected rejectCount=1, got ${rejectCount}`);
    if (rows.length !== 0) throw new Error(`Expected 0 output rows, got ${rows.length}`);
    if (!newEntries.includes('parse-failed')) throw new Error('Quarantine entry missing from parse-rejects.log');
  });

  // --- insufficient_spec: only in surfaced-unresolved ---
  check('insufficient_spec valid only in surfaced-unresolved condition', () => {
    const line = 't2\tinsufficient_spec\t0.7\tspec omits the edge';
    const su = parseLine(line, 'surfaced-unresolved');
    if (!su) throw new Error('insufficient_spec should parse in surfaced-unresolved');
    eq(su.verdict, 'insufficient_spec', 'verdict');

    const narrow = parseLine(line, 'narrow');
    if (narrow !== null) throw new Error('insufficient_spec must NOT parse in narrow');

    const sr = parseLine(line, 'surfaced-resolved');
    if (sr !== null) throw new Error('insufficient_spec must NOT parse in surfaced-resolved');
  });

  // --- Regime + edgeprobe stamped from table, not subagent text ---
  check('regime+edgeprobe stamped from lookup table (t5=INF, t7=MISS/NI)', () => {
    const cellMeta = { rep: 3, model: 'opus', condition: 'surfaced-unresolved' };
    const input = 't5\tpassed\t0.9\tnote line\nt7\tgaps_found\t0.8\tnote line\n';
    const { rows } = parseSubagentOutput(input, cellMeta);
    if (rows.length !== 2) throw new Error(`Expected 2 rows, got ${rows.length}`);
    const r5 = rows[0].split('\t');
    const r7 = rows[1].split('\t');
    eq(r5[4], 'INF',  't5 regime');
    eq(r5[5], 'INF',  't5 edgeprobe');
    eq(r7[4], 'NI',   't7 regime');
    eq(r7[5], 'MISS', 't7 edgeprobe');
  });

  console.log('');
  if (allPassed) {
    console.log('Self-test result: PASSED');
    process.exit(0);
  } else {
    console.log('Self-test result: FAILED');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);

if (args.includes('--selftest')) {
  runSelfTest();
} else if (args.length > 0) {
  // Parse dispatch metadata from CLI flags or dispatch-table.json
  let rep, model, condition;

  if (args.includes('--cell-id')) {
    const cellId = parseInt(args[args.indexOf('--cell-id') + 1], 10);
    const tablePath = join(ROOT, 'dispatch-table.json');
    if (!existsSync(tablePath)) {
      console.error('ERROR: dispatch-table.json not found. Run: node gen-faithful-read.mjs');
      process.exit(1);
    }
    const table = JSON.parse(readFileSync(tablePath, 'utf8'));
    const cell = table[cellId];
    if (!cell) {
      console.error(`ERROR: cell-id ${cellId} not in dispatch table (valid range: 0–44)`);
      process.exit(1);
    }
    ({ rep, model, condition } = cell);
  } else {
    const val = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
    rep       = parseInt(val('--rep'), 10);
    model     = val('--model');
    condition = val('--condition');
  }

  if (!rep || !model || !condition) {
    console.error('Usage: node parse-verdicts.mjs --rep N --model M --condition C [--input file] [--output file]');
    console.error('       node parse-verdicts.mjs --cell-id N [--input file] [--output file]');
    console.error('       node parse-verdicts.mjs --selftest');
    process.exit(1);
  }

  // Read subagent output
  let rawText;
  const inputIdx = args.indexOf('--input');
  if (inputIdx !== -1) {
    rawText = readFileSync(args[inputIdx + 1], 'utf8');
  } else {
    // Read stdin synchronously via readFileSync('/dev/stdin')
    rawText = readFileSync('/dev/stdin', 'utf8');
  }

  const cellMeta = { rep, model, condition };
  const { rows, rejectCount } = parseSubagentOutput(rawText, cellMeta);

  const outputStr = rows.join('\n') + (rows.length ? '\n' : '');
  const outputIdx = args.indexOf('--output');
  if (outputIdx !== -1) {
    writeFileSync(args[outputIdx + 1], outputStr);
  } else {
    process.stdout.write(outputStr);
  }

  if (rejectCount > 0) {
    console.error(`[parse-verdicts] ${rejectCount} row(s) quarantined → parse-rejects.log`);
    process.exit(1);
  }
}
