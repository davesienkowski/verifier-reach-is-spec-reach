// k-run harness — component 1: phase→commit checkpointer.
// Maps each goodthrough-v4 phase to its git commit range. The BASE (parent of the phase's first
// commit) is the clean pre-phase state a re-run restores to; the HEAD is the as-shipped state to
// score against. Deterministic from the `type(NN-PP):` commit convention. READ-ONLY.

import { execSync } from 'node:child_process';
const ROOT = process.env.GT || '/path/to/goodthrough-v4'  /* set $GT to your checkout */;
const git = c => execSync(`git -C ${ROOT} ${c}`, { encoding: 'utf8' }).trim();

// oldest→newest: hash<TAB>subject
const log = git('log --reverse --pretty=format:%h%x09%s').split('\n');
const phaseOf = s => (s.match(/\((\d{2})(?:-\d{2})?\)/)?.[1]) ?? null;

const phases = new Map(); // NN -> {first, last, commits, plans:Set}
for (const line of log) {
  const [hash, ...rest] = line.split('\t');
  const subj = rest.join('\t');
  const ph = phaseOf(subj);
  if (!ph) continue;
  if (!phases.has(ph)) phases.set(ph, { first: hash, last: hash, commits: 0, plans: new Set() });
  const e = phases.get(ph);
  e.last = hash; e.commits++;
  const plan = subj.match(/\(\d{2}-(\d{2})\)/)?.[1]; if (plan) e.plans.add(plan);
}

const baseOf = h => { try { return git(`rev-parse --short ${h}^`); } catch { return '(root)'; } };

console.log('=== k-run harness — phase checkpoints (goodthrough-v4) ===\n');
console.log('phase\tbase→head\t\tcommits\tplans');
const out = {};
for (const [ph, e] of [...phases.entries()].sort()) {
  const base = baseOf(e.first);
  console.log(`${ph}\t${base}..${e.last}\t${e.commits}\t${e.plans.size}`);
  out[ph] = { base, first: e.first, head: e.last, commits: e.commits, plans: [...e.plans].sort() };
}
console.log(`\n${phases.size} phases mapped from ${log.filter(l => phaseOf(l.split('\t').slice(1).join('\t'))).length} phase-tagged commits.`);
console.log('\nRestore a clean pre-phase state for re-run with:');
console.log('  git -C <repo> worktree add /tmp/krun-<phase> <base>   # isolated clean checkout');
console.log('  (re-execute the phase PLAN there, then score against the phase HEAD / its tests)');

// emit machine-readable map for the driver
import { writeFileSync } from 'node:fs';
writeFileSync(new URL('./phase-checkpoints.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('\nwrote phase-checkpoints.json');
