# Spec — `roundToInt(x)`

Round a number to the nearest integer.

## must_haves
1. Export a named function `roundToInt(x)`.
2. Return the integer nearest to `x`.
3. Larger fractional parts round up, smaller round down.

## visible test cases
- `roundToInt(1.2)` → `1`
- `roundToInt(1.8)` → `2`
- `roundToInt(-1.2)` → `-1`

## Spec-completeness probe — UNRESOLVED edges
A completeness probe flagged these applicable edges as NOT determined by the spec above:
- **boundary** (unresolved): What happens exactly at each min/max/threshold — and one step either side?
- **precision** (unresolved): Where can precision loss, overflow, or rounding/tie-breaking occur — and what is the exact contract (e.g. half-up vs half-to-even, ceil/floor/truncate)?
