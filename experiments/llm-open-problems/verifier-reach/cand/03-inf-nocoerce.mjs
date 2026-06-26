export function truncate(str, max) {
  const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const graphemes = [...seg.segment(str)].map((x) => x.segment);
  if (graphemes.length <= max) return str;
  return graphemes.slice(0, max).join('');
}
