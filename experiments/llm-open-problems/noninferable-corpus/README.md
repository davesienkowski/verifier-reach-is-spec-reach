# Non-inferable-defect corpus

**Purpose:** the single missing test asset behind four "promising-but-untestable" results in this
program (held-out's marginal value, A1 calibration, and — with a controlled harness — B1 drift and
C8 version-regression). Every prior probe dead-ended on the same wall: the corpus defects were
**inferable** from spec + general knowledge, so goal-backward verification subsumed held-out and the
verifier never erred. This corpus is built to break that.

## The non-inferable property

A defect is **non-inferable** when its distinguishing input cannot be reconstructed from
*(the spec given to the verifier) + (a competent engineer's general knowledge)*. We achieve it by
writing a spec that describes the contract plainly but **deliberately omits one boundary rule**, then
planting a defect on exactly that rule. The held-out test — authored by someone who knew the omitted
rule — encodes it. This models the realistic case: real specs are incomplete, and a held-out suite
carries knowledge the prose didn't.

| Task | Spec says | Omitted (non-inferable) edge | Defect | Held-out probe |
|---|---|---|---|---|
| `01-round-to` | "round to dp decimals" | how exact `.5` ties resolve | `Math.round` (half-up) | `0.5→0, 2.5→2, 4.5→4` (half-even) |
| `02-merge-intervals` | "merge overlapping" | whether touching `[1,2],[2,3]` merges | strict `<` (touching stays split) | `[[1,2],[2,3]]→[[1,3]]` |
| `03-truncate-graphemes` | "first max characters" | "character" = grapheme vs code unit | `.slice` (code units) | emoji/ZWJ not split |

## Validity (self-checked)

`validate.mjs` runs visible + held-out on the reference AND the defective impl. A task is a valid
non-inferable probe **only if** reference passes both, defective passes visible, and **defective fails
held-out** (held-out is what catches the defect). All 3 tasks pass this gate.

## Two contamination corrections (recorded, not hidden)

1. **Task 01 name leak:** the function was first named `roundHalfEven` — which *names* the omitted tie
   rule. Strong verifiers caught the defect *from the name*, not the spec. Renamed to the neutral
   `roundTo` and re-run. (Same class as the `overfit.mjs` self-labeling comment caught in
   `trust-ledger-spike/VERIFIER-STRENGTH-RESULTS.md`.)
2. **Task 01 residual confound:** even after the rename, `Math.round(v*f)/f` carries a *second,
   inferable* bug — IEEE-754 error makes `1.005→1.00`, violating the stated "round to nearer" must-have.
   Strong verifiers legitimately caught *that* (not the tie rule). So Task 01 does not cleanly isolate
   non-inferability; the headline analysis uses tasks 02–03 only (Task 01 reported separately).

See `RESULTS.md`.
