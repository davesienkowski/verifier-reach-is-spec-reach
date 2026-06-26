import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { roundToInt } = await import(pathToFileURL(process.env.GSD_SUT).href);
// Non-inferable edge: exact .5 ties round to EVEN (0.5->0, 2.5->2, 4.5->4). Math.round is half-up.
test('0.5 -> 0 (even)', () => assert.equal(roundToInt(0.5), 0));
test('2.5 -> 2 (even)', () => assert.equal(roundToInt(2.5), 2));
test('4.5 -> 4 (even)', () => assert.equal(roundToInt(4.5), 4));
