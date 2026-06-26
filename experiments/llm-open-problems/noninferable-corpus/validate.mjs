// Self-validation: proves the corpus has the non-inferable property at the TEST level.
// For each task, runs visible + held-out suites against the reference AND the defective impl.
// REQUIRED pattern (else the task is not a valid non-inferable probe):
//   reference + visible  -> PASS    reference + heldout  -> PASS
//   defective + visible  -> PASS    defective + heldout  -> FAIL  (held-out catches the defect)
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = dirname(fileURLToPath(import.meta.url));
const TASKS = join(ROOT, 'tasks');

function run(suite, sut) {
  const r = spawnSync('node', ['--test', suite], {
    env: { ...process.env, GSD_SUT: sut }, encoding: 'utf8',
  });
  return r.status === 0 ? 'PASS' : 'FAIL';
}

let allValid = true;
console.log('task                     ref+vis  ref+held  def+vis  def+held   valid?');
for (const t of readdirSync(TASKS).sort()) {
  const d = join(TASKS, t);
  const ref = join(d, 'reference.mjs'), def = join(d, 'defective.mjs');
  const vis = join(d, 'visible.test.mjs'), held = join(d, 'heldout.test.mjs');
  const rv = run(vis, ref), rh = run(held, ref), dv = run(vis, def), dh = run(held, def);
  // valid iff ref passes both, def passes visible, def FAILS heldout
  const valid = rv === 'PASS' && rh === 'PASS' && dv === 'PASS' && dh === 'FAIL';
  if (!valid) allValid = false;
  console.log(`${t.padEnd(24)} ${rv.padEnd(8)} ${rh.padEnd(9)} ${dv.padEnd(8)} ${dh.padEnd(10)} ${valid ? '✅' : '❌'}`);
}
console.log(`\nCorpus valid (every defect hidden from visible, caught by held-out): ${allValid ? 'YES' : 'NO'}`);
process.exit(allValid ? 0 : 1);
