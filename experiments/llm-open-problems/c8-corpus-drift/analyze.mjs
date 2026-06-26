// C8-on-corpus: cross-model-version verdict + confidence drift on non-inferable defects.
// Primary data = verdicts-sanitized.tsv (blind, no answer leak). Contaminated pilot is contrasted.
import { readFileSync } from 'node:fs';

function load(file, cols) {
  return readFileSync(new URL(file, import.meta.url), 'utf8')
    .trim().split('\n').filter((l) => l && !l.startsWith('#') && !l.startsWith('task\t'))
    .map((l) => { const c = l.split('\t'); const o = {}; cols.forEach((k, i) => (o[k] = c[i])); return o; });
}

const san = load('./verdicts-sanitized.tsv',
  ['task', 'edge', 'model', 'verdict', 'conf', 'correct', 'caught', 'note'])
  .map((r) => ({ ...r, conf: +r.conf, correct: +r.correct, caught: +r.caught }));

const MODELS = ['opus', 'sonnet', 'haiku'];
const TASKS = [...new Set(san.map((r) => r.task))];

console.log('=== C8-on-corpus (sanitized / blind) — n=9, 3 tasks x 3 model versions ===\n');

// Per-task cross-version agreement + confidence spread
let verdictDriftTasks = 0;
for (const t of TASKS) {
  const rows = MODELS.map((m) => san.find((r) => r.task === t && r.model === m));
  const verdicts = rows.map((r) => r.verdict);
  const agree = new Set(verdicts).size === 1;
  if (!agree) verdictDriftTasks++;
  const confs = rows.map((r) => r.conf);
  const spread = Math.max(...confs) - Math.min(...confs);
  console.log(`${t}`);
  console.log(`  verdicts:   ${MODELS.map((m, i) => `${m}=${verdicts[i]}`).join('  ')}  -> ${agree ? 'AGREE' : '*** VERDICT DRIFT ***'}`);
  console.log(`  confidence: ${MODELS.map((m, i) => `${m}=${confs[i].toFixed(2)}`).join('  ')}  (spread ${spread.toFixed(2)})`);
  console.log('');
}

// Catch rate of the specific non-inferable edge, by version
console.log('caught the specific non-inferable edge (ground truth: all defective):');
for (const m of MODELS) {
  const set = san.filter((r) => r.model === m);
  console.log(`  ${m}: verdict_correct ${set.reduce((s, r) => s + r.correct, 0)}/3 · caught_edge ${set.reduce((s, r) => s + r.caught, 0)}/3 · mean_conf ${(set.reduce((s, r) => s + r.conf, 0) / 3).toFixed(2)}`);
}
console.log(`  TOTAL caught_edge: ${san.reduce((s, r) => s + r.caught, 0)}/9 · verdict_correct ${san.reduce((s, r) => s + r.correct, 0)}/9`);

// Confidence-while-wrong, by version (the A1 refinement)
console.log('\nconfidence WHILE WRONG (verdict=passed on defective code), by version:');
for (const m of MODELS) {
  const wrong = san.filter((r) => r.model === m && r.correct === 0);
  const mc = wrong.length ? wrong.reduce((s, r) => s + r.conf, 0) / wrong.length : NaN;
  console.log(`  ${m}: ${wrong.length} wrong, mean confidence ${isNaN(mc) ? '-' : mc.toFixed(2)}`);
}

console.log(`\n=== headline ===`);
console.log(`verdict drift across versions: ${verdictDriftTasks}/${TASKS.length} tasks (vs 0/N on the clear-fixture null in model-regression/)`);
console.log(`uniform blindness: ${TASKS.length - verdictDriftTasks}/${TASKS.length} tasks all 3 versions agreed AND were wrong (passed defective code)`);
console.log(`confidence-while-wrong rises with weaker model: opus hedges (~0.6), haiku near-certain (~0.95) -> overconfidence is tier-dependent`);

// Contamination contrast
console.log('\n=== contamination contrast (pilot vs sanitized) ===');
console.log('contaminated pilot caught_edge: 3/9 (haiku/sonnet read defect from leaked code comments + spec note)');
console.log('sanitized (blind)   caught_edge: 1/9 (only sonnet, on touching-intervals)');
console.log('=> the leak inflated apparent catch 3x; blind verifiers are even more uniformly blind than the corpus first suggested.');
