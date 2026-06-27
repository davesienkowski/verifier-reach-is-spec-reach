// Source: ported from noninferable-corpus/validate.mjs (gsd-core feat/non-inferable-pipeline)
// Source commit: c0d41ff5014de79a023fcbe9fdde01220055cec5
// Key differences from corpus validate.mjs:
//   - Task discovery: readdirSync('oracle/') filtered to /^t\d+$/ (not tasks/)
//   - Defective SUT: code/tN.mjs (not oracle/tN/defective.mjs)
//   - Oracle paths: oracle/tN/{reference,visible.test,heldout.test}.mjs
//   - t5 is EXEMPT (INF control: defect on stated rule, not non-inferable omission)
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = dirname(fileURLToPath(import.meta.url));

function run(suite, sut) {
  const r = spawnSync('node', ['--test', suite], {
    env: { ...process.env, GSD_SUT: sut }, encoding: 'utf8',
  });
  return r.status === 0 ? 'PASS' : 'FAIL';
}

// INF control tasks: defect is on a STATED (inferable) rule — exempt from the NI gate.
// Autodiscover task dirs so adding t6/t7 later needs no code change here.
const INF_EXEMPT = new Set(['t5']);
const tasks = readdirSync(join(ROOT, 'oracle'))
  .filter(d => /^t\d+$/.test(d)).sort();

let allValid = true;
console.log('task  ref+vis  ref+held  def+vis  def+held  valid?');
for (const tN of tasks) {
  const d = join(ROOT, 'oracle', tN);
  const ref = join(d, 'reference.mjs');
  const def = join(ROOT, 'code', `${tN}.mjs`);   // defective SUT lives in code/, not oracle/
  const vis = join(d, 'visible.test.mjs');
  const held = join(d, 'heldout.test.mjs');

  const rv = run(vis, ref), rh = run(held, ref);
  const dv = run(vis, def), dh = run(held, def);

  if (INF_EXEMPT.has(tN)) {
    console.log(`${tN.padEnd(5)} ${rv.padEnd(8)} ${rh.padEnd(9)} ${dv.padEnd(8)} ${dh.padEnd(9)} EXEMPT (INF control)`);
    continue;
  }

  const valid = rv === 'PASS' && rh === 'PASS' && dv === 'PASS' && dh === 'FAIL';
  if (!valid) allValid = false;
  console.log(`${tN.padEnd(5)} ${rv.padEnd(8)} ${rh.padEnd(9)} ${dv.padEnd(8)} ${dh.padEnd(9)} ${valid ? '✅' : '❌'}`);
}

process.exit(allValid ? 0 : 1);
