# Spec — `sortByScore(items)`

Sort items by score, descending.

## must_haves
1. Export a named function `sortByScore(items)` taking an array of `{ name, score }`.
2. Return a new array ordered by `score` **descending**.
3. Do not mutate the input.

## visible test cases
- `sortByScore([{name:'a',score:3},{name:'b',score:1},{name:'c',score:2}])` → `a,c,b`

## Spec-completeness probe — UNRESOLVED edges
A completeness probe flagged these applicable edges as NOT determined by the spec above:
- **boundary** (unresolved): What happens exactly at each min/max/threshold — and one step either side?
- **adjacency** (unresolved): When two things are exactly equal or just touch, do they merge, collide, or separate?
- **empty** (unresolved): What is the result for empty, single-element, or null input?
- **encoding** (unresolved): Whose definition of length/equality applies — bytes, code points, grapheme clusters, or normalized form?
- **ordering** (unresolved): When elements compare equal, is output order specified and stable?
- **precision** (unresolved): Where can precision loss or overflow occur, and what is the contract?
