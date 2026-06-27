# Spec — `defaults(target, fallback)`

Fill in missing keys from a fallback object.

## must_haves
1. Export a named function `defaults(target, fallback)`.
2. For each key in `fallback` that is not present in `target`, copy it to the result.
3. Keys already present in `target` are preserved unchanged.
4. Return a new object; do not mutate either input.

## visible test cases
- `defaults({ a: 'x' }, { a: 'y', c: 'z' })` → `{ a: 'x', c: 'z' }`
- `defaults({ a: 'x', b: 'y' }, { b: 'override', c: 'new' })` → `{ a: 'x', b: 'y', c: 'new' }`
- `defaults({}, { a: '1', b: '2' })` → `{ a: '1', b: '2' }`
