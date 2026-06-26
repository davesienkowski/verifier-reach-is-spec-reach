export function formatCents(cents) {
  if (cents == null) return '—';
  const roundedCents = Math.round(cents);
  const dollars = Math.floor(Math.abs(roundedCents) / 100);
  const remainingCents = Math.abs(roundedCents) % 100;
  const sign = roundedCents < 0 ? '-' : '';
  return `${sign}$${dollars}.${remainingCents.toString().padStart(2, '0')}`;
}
