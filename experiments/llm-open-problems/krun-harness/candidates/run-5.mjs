export function formatCents(cents) {
  if (cents == null) return '—';
  const roundedCents = Math.round(cents);
  const isNegative = roundedCents < 0;
  const absoluteCents = Math.abs(roundedCents);
  const dollars = Math.floor(absoluteCents / 100);
  const remainingCents = absoluteCents % 100;
  const sign = isNegative && absoluteCents !== 0 ? '-' : '';
  return `${sign}$${dollars}.${remainingCents.toString().padStart(2, '0')}`;
}
