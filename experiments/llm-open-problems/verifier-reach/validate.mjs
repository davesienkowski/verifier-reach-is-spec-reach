// N1 corpus self-validation: every candidate must be a VALID reach probe.
//   mutant : passes the real visible suite (survives to the verifier) AND is a real defect
//            (differs from the reference somewhere, or mutates its input where ref does not)
//   clean  : passes visible AND is NOT a defect (identical behavior to the reference)
// "passes visible" uses the corpus's actual visible.test.mjs (faithful == / deepEqual semantics).
// "is a real defect" uses a strict, type-sensitive differential vs the reference over a broad
// input battery + an input-mutation check. A mutant whose defect the verifier could only catch
// by reading the spec is what makes the reach metric meaningful.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CORPUS = join(ROOT, '..', 'noninferable-corpus', 'tasks');
const VIS = {
  '01-round-to': join(CORPUS, '01-round-half-even', 'visible.test.mjs'),
  '02-merge-intervals': join(CORPUS, '02-merge-intervals', 'visible.test.mjs'),
  '03-truncate': join(CORPUS, '03-truncate-graphemes', 'visible.test.mjs'),
};

// Broad differential input batteries (args spread into the fn). Cover stated-but-untested
// behaviors (→ inferable defects) and the omitted edges (→ non-inferable defects).
const BROAD = {
  '01-round-to': [
    [1.234, 2], [1.236, 2], [2.4], [2.6],            // visible region
    [0.5], [2.5], [4.5], [1.5], [1.005, 2],          // ties (non-inferable)
    [-1.236, 2], [-2.6], [3.14159], [1.2349, 3], [1.23456, 4], // negatives, default, high dp
  ],
  '02-merge-intervals': [
    [[[1, 3], [2, 6]]], [[[1, 2], [5, 6]]], [[[1, 4], [2, 3]]],   // visible region
    [[[5, 6], [1, 2]]], [[[3, 4], [1, 2], [2, 3]]],               // unsorted (ordering)
    [[[1, 2], [2, 3]]], [[[1, 5], [5, 8], [8, 10]]],              // touching (non-inferable)
    [[]], [[[1, 2]]],                                             // empty, single
  ],
  '03-truncate': [
    ['hello world', 5], ['hi', 5], ['hello', 5],     // visible region + exactly-max
    [12345, 3], [null, 3],                           // non-string (coerce)
    ['', 5],                                          // empty
    ['🎉🎉🎉', 2], ['👩‍👩‍👧 family', 1],            // grapheme (non-inferable)
  ],
};

const clone = (x) => structuredClone(x);
function eq(a, b) {
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((x, i) => eq(x, b[i]));
  }
  if (a === null || b === null) return a === b;
  return Object.is(a, b);
}
function call(fn, args) {
  const live = clone(args), before = clone(args);
  let res;
  try { res = { ok: true, val: fn(...live) }; } catch (e) { res = { ok: false, err: String((e && e.message) || e) }; }
  res.mutated = !eq(live, before);
  return res;
}
const differs = (c, r) => (c.ok !== r.ok) || (c.ok && r.ok && !eq(c.val, r.val)) || (c.mutated && !r.mutated);

function visiblePass(candPath, task) {
  const r = spawnSync('node', ['--test', VIS[task]], { env: { ...process.env, GSD_SUT: candPath }, encoding: 'utf8' });
  return r.status === 0;
}

const manifest = readFileSync(join(ROOT, 'manifest.tsv'), 'utf8').trim().split('\n').slice(1)
  .map((l) => l.split('\t')).map(([id, task, fn, category, cls]) => ({ id, task, fn, category, cls }));

const refMod = {};
for (const task of Object.keys(BROAD)) {
  const id = `${task.slice(0, 2)}-ref`;
  const refId = manifest.find((m) => m.task === task && m.cls === 'clean').id;
  refMod[task] = (await import(join(ROOT, 'cand', `${refId}.mjs`)));
}

let allValid = true;
console.log('id                      class         visible  realDefect  validProbe');
for (const m of manifest) {
  const path = join(ROOT, 'cand', `${m.id}.mjs`);
  const mod = await import(path);
  const fn = mod[m.fn], ref = refMod[m.task][m.fn];
  const vis = visiblePass(path, m.task);
  let defect = false;
  for (const args of BROAD[m.task]) {
    if (differs(call(fn, args), call(ref, args))) { defect = true; break; }
  }
  const valid = m.cls === 'clean' ? (vis && !defect) : (vis && defect);
  if (!valid) allValid = false;
  console.log(`${m.id.padEnd(23)} ${m.cls.padEnd(13)} ${(vis ? 'PASS' : 'FAIL').padEnd(8)} ${(defect ? 'YES' : 'no').padEnd(11)} ${valid ? '✅' : '❌'}`);
}
console.log(`\nAll candidates valid reach probes: ${allValid ? 'YES' : 'NO'}`);
process.exit(allValid ? 0 : 1);
