// Vendored from gsd-core feat/non-inferable-pipeline
// vendored from the non-inferable corpus (original path redacted) -- heldout.test.mjs
// Source commit: c0d41ff5014de79a023fcbe9fdde01220055cec5
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { sortByScore } = await import(pathToFileURL(process.env.GSD_SUT).href);
const names = (a) => a.map((x) => x.name);
// Non-inferable edge: equal scores keep INPUT order (stable). Asc-then-reverse flips them.
test('equal scores keep input order', () =>
  assert.deepEqual(names(sortByScore([{ name: 'x', score: 5 }, { name: 'y', score: 5 }, { name: 'z', score: 1 }])), ['x', 'y', 'z']));
