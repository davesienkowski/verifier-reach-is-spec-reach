export function truncate(str, max) {
  const s = String(str ?? '');
  if (s === '') return null;
  const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const graphemes = [...seg.segment(s)].map((x) => x.segment);
  if (graphemes.length <= max) return s;
  return graphemes.slice(0, max).join('');
}
