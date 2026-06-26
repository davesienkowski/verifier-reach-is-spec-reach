# Task 04 — `sortByScore(items)`

Sort items by score, descending.

## must_haves
1. Export a named function `sortByScore(items)` taking an array of `{ name, score }`.
2. Return a new array ordered by `score` **descending**.
3. Do not mutate the input.

> The spec intentionally does NOT say how items with **equal scores** are ordered relative to
> each other. That tie-stability rule is the non-inferable edge.

## visible test cases (the executor ran these)
- `sortByScore([{name:'a',score:3},{name:'b',score:1},{name:'c',score:2}])` → `a,c,b`
