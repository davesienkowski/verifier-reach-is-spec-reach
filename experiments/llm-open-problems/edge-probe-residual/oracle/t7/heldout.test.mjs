import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { bold } = await import(pathToFileURL(process.env.GSD_SUT).href);

// Non-inferable edge: applying bold to already-bold text must return it unchanged.
// Double-wrapping produces '****hello****' which is wrong.
test('already-bold text is returned unchanged', () => {
  assert.equal(bold('**hello**'), '**hello**');
});
