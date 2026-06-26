export function formatCents(cents) {
  if (cents === null || cents === undefined) return '—';
  const roundedCents = Math.round(cents);
  const isNegative = roundedCents < 0;
  const absCents = Math.abs(roundedCents);
  const dollars = Math.floor(absCents / 100);
  const centsRemainder = absCents % 100;
  const formattedCents = String(centsRemainder).padStart(2, '0');
  const result = `$${dollars}.${formattedCents}`;
  return isNegative && roundedCents !== 0 ? `-${result}` : result;
}
