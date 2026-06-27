import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { defaults } = await import(pathToFileURL(process.env.GSD_SUT).href);

// Non-inferable edge: null-valued key is PRESENT; should NOT be overridden by fallback.
// ECMAScript: { a: null } has 'a' in obj === true; null !== absent.
test('null-valued key in target is preserved (not overridden)', () => {
  assert.deepEqual(defaults({ a: null, b: 'x' }, { a: 'fallback', c: 'new' }), { a: null, b: 'x', c: 'new' });
});
test('null-valued key distinguishes null from absent', () => {
  assert.deepEqual(defaults({ key: null }, { key: 'default' }), { key: null });
});
