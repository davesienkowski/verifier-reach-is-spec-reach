export function formatCents(cents) {
  if (cents === null || cents === undefined) return '—';
  const roundedCents = Math.round(cents);
  const dollars = Math.floor(roundedCents / 100);
  const remainingCents = Math.abs(roundedCents) % 100;
  if (roundedCents < 0 && dollars === 0 && remainingCents !== 0) {
    return `-$0.${String(remainingCents).padStart(2, '0')}`;
  }
  const absRoundedCents = Math.abs(roundedCents);
  const absDollars = Math.floor(absRoundedCents / 100);
  const absRemainingCents = absRoundedCents % 100;
  const sign = roundedCents < 0 ? '-' : '';
  return `${sign}$${absDollars}.${String(absRemainingCents).padStart(2, '0')}`;
}
