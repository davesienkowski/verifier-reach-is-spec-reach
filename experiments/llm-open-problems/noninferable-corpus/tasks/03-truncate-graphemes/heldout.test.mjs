import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { truncate } = await import(pathToFileURL(process.env.GSD_SUT).href);

// The non-inferable edge: "character" = grapheme. A code-unit slice splits an emoji's surrogate
// pair (producing a broken half-character) or a ZWJ sequence.
test('does not split an emoji at the boundary', () => {
  // graphemes: ['a','😀','b'] → first 2 graphemes = 'a😀'
  assert.equal(truncate('a😀b', 2), 'a😀');
});
test('treats a ZWJ family emoji as one grapheme', () => {
  // '👨‍👩‍👧' is ONE grapheme (many code units) → first 1 grapheme keeps it whole
  assert.equal(truncate('👨‍👩‍👧 family', 1), '👨‍👩‍👧');
});
