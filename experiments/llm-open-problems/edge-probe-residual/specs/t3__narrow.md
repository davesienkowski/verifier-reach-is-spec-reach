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
