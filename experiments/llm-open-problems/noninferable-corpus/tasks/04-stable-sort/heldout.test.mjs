import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { sortByScore } = await import(pathToFileURL(process.env.GSD_SUT).href);
const names = (a) => a.map((x) => x.name);
// Non-inferable edge: equal scores keep INPUT order (stable). Asc-then-reverse flips them.
test('equal scores keep input order', () =>
  assert.deepEqual(names(sortByScore([{ name: 'x', score: 5 }, { name: 'y', score: 5 }, { name: 'z', score: 1 }])), ['x', 'y', 'z']));
