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

## Spec-completeness probe — UNRESOLVED edges
A completeness probe flagged these applicable edges as NOT determined by the spec above:
- **adjacency** (unresolved): When two things are exactly equal or just touch, do they merge, collide, or separate?
- **empty** (unresolved): What is the result for empty, single-element, or null input?
- **ordering** (unresolved): When elements compare equal, is output order specified and stable?
