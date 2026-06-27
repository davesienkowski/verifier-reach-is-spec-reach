// Authored for edge-probe-residual oracle/t5 (INF control)
// t5 heldout tests the STATED sort-by-start rule that code/t5.mjs violates.
// Distinct from t2's heldout (adjacency/touching-pairs — a non-inferable edge).
// The sort-by-start rule IS inferable from the spec ("sorted by start") — hence INF control.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { mergeIntervals } = await import(pathToFileURL(process.env.GSD_SUT).href);

// code/t5.mjs does not sort by start, so out-of-order input produces unsorted output.
test('out-of-order input produces sorted output', () =>
  assert.deepEqual(mergeIntervals([[5, 6], [1, 2]]), [[1, 2], [5, 6]]));
test('reversed three intervals come out sorted', () =>
  assert.deepEqual(mergeIntervals([[7, 9], [3, 5], [1, 2]]), [[1, 2], [3, 5], [7, 9]]));
test('overlapping out-of-order intervals merge and sort', () =>
  assert.deepEqual(mergeIntervals([[4, 6], [1, 3], [2, 5]]), [[1, 6]]));
