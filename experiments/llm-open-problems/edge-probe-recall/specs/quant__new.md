# Spec — `roundToNearest10(x)`

Round a number to the nearest multiple of 10.

## must_haves
1. Export a named function `roundToNearest10(x)`.
2. Return the multiple of 10 nearest to `x`.
3. Larger remainders round up, smaller round down.

## visible test cases
- `roundToNearest10(12)` → `10`
- `roundToNearest10(17)` → `20`
- `roundToNearest10(23)` → `20`

## Spec-completeness probe — UNRESOLVED edges
A completeness probe flagged these applicable edges as NOT determined by the spec above:
- **boundary** (unresolved): What happens exactly at each min/max/threshold — and one step either side?
- **precision** (unresolved): Where can precision loss, overflow, or rounding/tie-breaking occur — and what is the exact contract (e.g. half-up vs half-to-even, ceil/floor/truncate)?
