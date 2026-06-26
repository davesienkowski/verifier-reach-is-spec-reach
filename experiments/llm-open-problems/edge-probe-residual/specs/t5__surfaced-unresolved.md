# Spec — `mergeIntervals(intervals)`

Merge a list of numeric intervals.

## must_haves
1. Export a named function `mergeIntervals(intervals)` taking an array of `[start, end]` pairs.
2. Return a new array of merged `[start, end]` pairs, **sorted by start**.
3. **Overlapping intervals are merged** into one spanning pair.
4. Non-overlapping intervals are returned separately.
5. Do not mutate the input.

## visible test cases
- `mergeIntervals([[1,3],[2,6]])` → `[[1,6]]`
- `mergeIntervals([[1,2],[5,6]])` → `[[1,2],[5,6]]`
- `mergeIntervals([[1,4],[2,3]])` → `[[1,4]]`

## Spec-completeness probe — UNRESOLVED edges
A completeness probe flagged these applicable edges as NOT determined by the spec above:
- **adjacency** (unresolved): When two things are exactly equal or just touch, do they merge, collide, or separate?
- **empty** (unresolved): What is the result for empty, single-element, or null input?
- **ordering** (unresolved): When elements compare equal, is output order specified and stable?
