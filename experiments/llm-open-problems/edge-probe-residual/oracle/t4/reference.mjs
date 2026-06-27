// Vendored from gsd-core feat/non-inferable-pipeline
// vendored from the non-inferable corpus (original path redacted) -- reference.mjs
// Source commit: c0d41ff5014de79a023fcbe9fdde01220055cec5
// Reference: counts/slices by GRAPHEME (user-perceived character), so emoji and combining
// sequences are never split mid-character.
export function truncate(str, max) {
  const s = String(str ?? '');
  const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const graphemes = [...seg.segment(s)].map((x) => x.segment);
  if (graphemes.length <= max) return s;
  return graphemes.slice(0, max).join('');
}
