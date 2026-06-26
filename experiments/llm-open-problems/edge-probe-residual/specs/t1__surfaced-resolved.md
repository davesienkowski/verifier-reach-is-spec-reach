# Spec — `sortByScore(items)`

Sort items by score, descending.

## must_haves
1. Export a named function `sortByScore(items)` taking an array of `{ name, score }`.
2. Return a new array ordered by `score` **descending**.
3. Do not mutate the input.

## visible test cases
- `sortByScore([{name:'a',score:3},{name:'b',score:1},{name:'c',score:2}])` → `a,c,b`

## must_haves (additional, resolved edge)
ACCEPTANCE (resolved ordering edge): items with EQUAL score MUST retain their input order (stable sort).
