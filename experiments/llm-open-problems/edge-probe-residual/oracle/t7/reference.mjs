export function bold(text) {
  if (/^\*\*.*\*\*$/.test(text)) return text;
  return '**' + text + '**';
}
