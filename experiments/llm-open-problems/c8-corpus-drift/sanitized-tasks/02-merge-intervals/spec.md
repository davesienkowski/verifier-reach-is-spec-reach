# Task 02 — `mergeIntervals(intervals)`

Merge a list of numeric intervals.

## must_haves
1. Export a named function `mergeIntervals(intervals)` taking an array of `[start, end]` pairs.
2. Return a new array of merged `[start, end]` pairs, **sorted by start**.
3. **Overlapping intervals are merged** into one spanning pair.
4. Non-overlapping intervals are returned separately.
5. Do not mutate the input.

## visible test cases (the executor ran these)
- `mergeIntervals([[1,3],[2,6]])` → `[[1,6]]`
- `mergeIntervals([[1,2],[5,6]])` → `[[1,2],[5,6]]`
- `mergeIntervals([[1,4],[2,3]])` → `[[1,4]]`
