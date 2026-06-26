export function truncate(str, max) {
  const s = String(str ?? '');
  return s.length <= max ? s : s.slice(0, max);
}
