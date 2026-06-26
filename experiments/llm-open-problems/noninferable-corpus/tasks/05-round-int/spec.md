# Task 05 — `roundToInt(x)`

Round a number to the nearest integer.

## must_haves
1. Export a named function `roundToInt(x)`.
2. Return the integer nearest to `x`.
3. Larger fractional parts round up, smaller round down.

> The spec intentionally does NOT say how an exact `.5` tie resolves (half-up vs half-to-even).
> That tie rule is the non-inferable edge. (Values chosen are exact in IEEE-754 to avoid a
> second, inferable floating-point confound — cf. task 01.)

## visible test cases (the executor ran these)
- `roundToInt(1.2)` → `1`
- `roundToInt(1.8)` → `2`
- `roundToInt(-1.2)` → `-1`
