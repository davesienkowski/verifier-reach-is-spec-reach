# Non-inferable defects — held-out marginal value + verifier calibration in the blind-spot regime

**Date:** 2026-05-31 · branch `feat/trust-ledger`. **Corpus:** 3 self-validated non-inferable tasks
(see `README.md`). **Verifiers:** 12 subagents (opus + haiku, inspection-only, verdict + calibrated
confidence). **Scripts:** `validate.mjs`, `analyze.mjs`, `verdicts.tsv`.

**Verdict:** **The corpus breaks the verifier exactly as theory predicts — and that recalibrates the
program's central recommendation.** On genuinely non-inferable edges, goal-backward verification caught
**0 / 12** defects while held-out caught **100%**; verifiers confidently **passed defective code**
(accuracy 13% on clean tasks, mean confidence 0.93, ECE 0.81, Brier 0.75 — *worse than chance*). The
same verifier protocol scored 100% / ECE 0.03 on *inferable* defects (`a1-RESULTS.md`). So: held-out is
redundant for inferable defects (the program's prior finding) **but is the only catch for
non-inferable ones**, and A1 overconfidence is real — *in this regime specifically*.

## Result 1 — held-out's first demonstrated marginal value

| | catch rate of the non-inferable defect |
|---|---|
| **Held-out test** (encodes the omitted edge) | **3/3 tasks = 100%** (deterministic) |
| **Goal-backward verifier** (spec + general knowledge) | **0/12 verdicts caught the specific edge** |

This directly answers the open question left by `VERIFIER-STRENGTH-RESULTS.md`: *"until a task shows
held-out catching what a methodology-following verifier misses, held-out is unproven as a distinct
signal."* Here are three such tasks. Held-out's value is **bounded by the spec-completeness gap** — it
adds exactly the information the spec omitted, which the verifier therefore cannot infer.

On Task 02 (clean), **all four verifiers passed the defective code**, explicitly reasoning that strict
`<` is "defensible under a standard overlap definition" (opus) — a textbook non-inferable miss: the
spec didn't define touching, so there was no basis to flag it.

## Result 2 — A1 overconfidence reproduces decisively (the blind spot)

Verifier calibration on defective code (ground truth = `gaps_found`):

| regime | n | accuracy | mean conf | ECE | Brier |
|---|---|---|---|---|---|
| **inferable** defects (`a1-RESULTS.md`) | 16 | **100%** | 0.970 | **0.030** | 0.001 |
| **non-inferable**, all tasks | 12 | 25% | 0.927 | 0.677 | 0.644 |
| **non-inferable**, clean (02–03) | 8 | **13%** | 0.930 | **0.805** | 0.753 |

The verifier expresses **~0.93 confidence whether it is right (inferable) or wrong (non-inferable).**
Confidence is **uninformative across regimes** — the clean demonstration of A1's thesis: *the model
does not know when it doesn't know.* A confidence gate would not help, because the verifier is just as
sure when blind. (Note the inferable-regime calibration was good precisely because the verifier was
never blind there.)

## Per-task detail

- **02-merge-intervals (clean):** 0/4 caught. opus passed at 0.82/0.80, haiku at 0.99/0.98. Held-out
  catches `[[1,2],[2,3]]→[[1,3]]`.
- **03-truncate-graphemes (clean):** 0/4 caught the grapheme edge. 3 passed (0.92–0.98); the one
  `gaps_found` (opus, 0.97) flagged an unrelated NaN/negative-`max` guard, never Unicode.
- **01-round-to (confounded):** excluded from the clean rate. The `Math.round` defect also has an
  *inferable* FP bug (`1.005→1.00`) that violates the stated "round to nearer" must-have; strong opus
  caught *that* (2/2, 0.88–0.96), weak haiku missed everything (passed, 0.92). Even here the
  strong/weak split holds, but it doesn't isolate non-inferability.

## What this changes (recalibration of the standing recommendation)

The program's headline — *"`must_haves` + goal-backward verification is load-bearing; held-out is
redundant"* — was established **only on inferable defects** and is now correctly **scoped**:

- **Inferable defects (the majority):** verifier subsumes held-out, is robust across model tiers, and
  is well-calibrated. Prior recommendation stands.
- **Non-inferable domain edges:** the verifier has a **confident blind spot**. Held-out (or, upstream,
  **spec-completeness work** that converts the edge into an inferable must-have) is the only catch. The
  lever isn't "trust the verifier's confidence" (useless here) — it's **eliminating non-inferability**:
  surface the omitted edge into the `must_haves`, after which the verifier catches it (that is exactly
  the C1 weak-oversight result). This unifies the program: *the verifier's reach is the spec's reach* —
  so the highest-value investment is spec completeness, with held-out as the backstop for edges the
  spec author knows but cannot fully articulate.

This also re-opens **B1/C8** as testable: a controlled long-horizon or cross-version study can now use
non-inferable tasks, where verifier behavior actually varies, instead of inferable ones where it
saturates.

## Caveats

- **n = 12 verdicts, 3 tasks (8/2 clean), 2 models.** Direction-finding, not powered — but the effect
  is large and one-sided (0/12 caught; ECE 0.03→0.81 across regimes).
- **"Non-inferable" is relative to the spec we wrote.** A more complete spec would make these inferable
  — which is the point (held-out encodes spec-incompleteness), but it means the finding is about
  **spec completeness**, not an absolute verifier ceiling.
- Two contamination corrections were applied mid-experiment (Task 01 name leak + FP confound); both are
  recorded in `README.md` and the confounded task is segregated.
- Verifiers were told to emit a calibrated confidence ("be honest if unsure"); they were *still*
  overconfident — so the overconfidence is not for lack of asking.
