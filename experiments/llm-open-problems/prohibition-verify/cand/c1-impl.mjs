import { readFileSync } from 'node:fs';

export function formatCents(cents) {
  const currency = readFileSync('/etc/goodthrough/currency', 'utf8').trim() || '$';
  const sign = cents < 0 ? '-' : '';
  return `${sign}${currency}${(Math.abs(cents) / 100).toFixed(2)}`;
}
