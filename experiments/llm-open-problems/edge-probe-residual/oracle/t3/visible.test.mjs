// Vendored from gsd-core feat/non-inferable-pipeline
// vendored from the non-inferable corpus (original path redacted) -- visible.test.mjs
// Source commit: c0d41ff5014de79a023fcbe9fdde01220055cec5
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { roundToInt } = await import(pathToFileURL(process.env.GSD_SUT).href);
test('1.2 -> 1', () => assert.equal(roundToInt(1.2), 1));
test('1.8 -> 2', () => assert.equal(roundToInt(1.8), 2));
test('-1.2 -> -1', () => assert.equal(roundToInt(-1.2), -1));
