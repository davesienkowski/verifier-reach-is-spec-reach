import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { bold } = await import(pathToFileURL(process.env.GSD_SUT).href);

test('plain text gets bold markers', () => {
  assert.equal(bold('hello'), '**hello**');
});
test('plain text with spaces gets bold markers', () => {
  assert.equal(bold('hello world'), '**hello world**');
});
