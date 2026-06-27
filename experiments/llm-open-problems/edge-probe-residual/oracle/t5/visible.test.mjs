// Vendored from gsd-core feat/non-inferable-pipeline
// vendored from the non-inferable corpus (original path redacted) -- visible.test.mjs
// Source commit: c0d41ff5014de79a023fcbe9fdde01220055cec5
// Note: t5 reuses the t2 visible suite. These inputs are already sorted by start,
// so both reference and the no-sort code/t5.mjs pass them — the STATED sort-by-start
// rule is not exercised here (INF control: defect is on a stated, inferable rule).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { mergeIntervals } = await import(pathToFileURL(process.env.GSD_SUT).href);

test('overlapping pair merges', () => assert.deepEqual(mergeIntervals([[1, 3], [2, 6]]), [[1, 6]]));
test('disjoint stay separate', () => assert.deepEqual(mergeIntervals([[1, 2], [5, 6]]), [[1, 2], [5, 6]]));
test('contained interval merges', () => assert.deepEqual(mergeIntervals([[1, 4], [2, 3]]), [[1, 4]]));
