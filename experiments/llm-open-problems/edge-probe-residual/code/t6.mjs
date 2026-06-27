export function defaults(target, fallback) {
  const result = { ...target };
  for (const key of Object.keys(fallback)) {
    if (!(key in target) || target[key] === null) {
      result[key] = fallback[key];
    }
  }
  return result;
}
