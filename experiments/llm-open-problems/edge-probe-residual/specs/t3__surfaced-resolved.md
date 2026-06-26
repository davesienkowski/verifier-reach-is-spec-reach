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

## must_haves (additional, resolved edge)
ACCEPTANCE (resolved precision/tie edge): an exact .5 tie MUST round to the nearest EVEN integer — roundToInt(0.5)=0, roundToInt(2.5)=2, roundToInt(4.5)=4.
