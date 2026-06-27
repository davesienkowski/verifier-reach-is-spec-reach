import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { defaults } = await import(pathToFileURL(process.env.GSD_SUT).href);

test('existing string key in target is not overridden', () => {
  assert.deepEqual(defaults({ a: 'x' }, { a: 'y', c: 'z' }), { a: 'x', c: 'z' });
});
test('absent key receives fallback value', () => {
  assert.deepEqual(defaults({ a: 'x', b: 'y' }, { b: 'override', c: 'new' }), { a: 'x', b: 'y', c: 'new' });
});
test('empty target gets all fallback keys', () => {
  assert.deepEqual(defaults({}, { a: '1', b: '2' }), { a: '1', b: '2' });
});
