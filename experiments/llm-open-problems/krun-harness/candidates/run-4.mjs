export function formatCents(cents) {
  if (cents == null) return '—';
  const roundedCents = Math.round(cents);
  const absCents = Math.abs(roundedCents);
  const dollars = Math.floor(absCents / 100);
  const remainingCents = absCents % 100;
  const isNegative = roundedCents < 0 && absCents > 0;
  return (isNegative ? '-' : '') + '$' + dollars + '.' + String(remainingCents).padStart(2, '0');
}
