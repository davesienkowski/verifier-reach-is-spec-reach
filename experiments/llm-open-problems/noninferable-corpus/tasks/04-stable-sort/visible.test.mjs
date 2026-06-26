import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { sortByScore } = await import(pathToFileURL(process.env.GSD_SUT).href);
const names = (a) => a.map((x) => x.name);
test('descending by distinct score', () =>
  assert.deepEqual(names(sortByScore([{ name: 'a', score: 3 }, { name: 'b', score: 1 }, { name: 'c', score: 2 }])), ['a', 'c', 'b']));
