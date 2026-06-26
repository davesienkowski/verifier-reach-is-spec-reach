# Spec — `truncate(str, max)`

Truncate a string to at most `max` characters.

## must_haves
1. Export a named function `truncate(str, max)` returning a string.
2. If the input has `max` characters or fewer, return it unchanged.
3. If longer, return only the first `max` characters.
4. Coerce non-string input to a string first.

## visible test cases
- `truncate('hello world', 5) === 'hello'`
- `truncate('hi', 5) === 'hi'`

## Spec-completeness probe — UNRESOLVED edges
A completeness probe flagged these applicable edges as NOT determined by the spec above:
- **boundary** (unresolved): What happens exactly at each min/max/threshold — and one step either side?
- **empty** (unresolved): What is the result for empty, single-element, or null input?
- **encoding** (unresolved): Whose definition of length/equality applies — bytes, code points, grapheme clusters, or normalized form?
- **precision** (unresolved): Where can precision loss or overflow occur, and what is the contract?
