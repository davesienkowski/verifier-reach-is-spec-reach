export function updateMomentum(current, event) {
  if (event === 'win') return current + 1;
  if (event === 'lapse') return current - 1;
  return current;
}
