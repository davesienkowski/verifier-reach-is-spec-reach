# C8-on-corpus — model-version verdict drift on non-inferable defects

**Problem (LANDSCAPE C8):** Model upgrades silently change refusal / instruction-following /
verdict behavior. GSD is prompt-heavy (planning, verification, subagent roles) — exactly the
surface that breaks on upgrade. The artifact trail is a reproducible regression harness.

**Why now (the unlock):** The earlier `model-regression/` study found *zero* verdict drift
across opus↔haiku — but only on **clear/inferable fixtures**, where verifier behavior saturates
(everyone agrees). The non-inferable corpus (`noninferable-corpus/`) is the first task set where
verifier behavior actually *varies* (verdicts split, confidence is uninformative). So it is the
right substrate to test C8: **do verifier verdicts drift across model versions specifically on
the edges where the verifier is blind?**

## Hypotheses

- **H1 (drift exists):** On non-inferable defects, the pass/`gaps_found` verdict and/or confidence
  differ across model versions for the *same* defective code (unlike the clear-fixture null).
- **H2 (uniform blindness):** Alternatively, all versions uniformly MISS the specific
  non-inferable edge (catch rate 0 across versions) — i.e. no drift, just shared blindness. This
  is also a C8-relevant result (the blind spot is model-invariant, so an upgrade won't fix it).
- The interesting C8 risk is H1 on the *verdict* (an upgrade flips pass↔gaps_found on a real bug
  with no spec change), which a regression harness must catch.

## Method

- **Substrate:** the 3 non-inferable tasks (`noninferable-corpus/tasks/0{1,2,3}`). Each has a
  `spec.md` and a `defective.mjs` whose defect sits on a deliberately spec-omitted edge
  (banker's-rounding tie / touching intervals / grapheme truncation). Ground truth: every
  defective impl should be rejected → correct verdict = `gaps_found`.
- **Versions:** `opus` (claude-opus-4-8), `sonnet` (claude-sonnet-4-6), `haiku` (claude-haiku-4-5).
- **Protocol (identical across versions, blind):** an inspection-only verifier reads the spec +
  the defective implementation, does NOT run code, and returns a structured verdict:
  `passed | gaps_found`, a calibrated confidence (0–1) that the verdict is correct, and (if
  gaps_found) the specific gap. The non-inferable edge is never named in the prompt (blind).
- **Cells:** 3 tasks × 3 versions × 1 rep = **9 fresh verdicts**. Within-version rep stability is
  taken from the prior `noninferable-corpus/verdicts.tsv` (opus/haiku at 2 reps each were stable:
  e.g. haiku 0.92/0.92, opus 0.82/0.80), so 1 fresh rep per cell is sufficient to read
  cross-version drift; n is direction-finding, not powered.
- **Scoring (`analyze.mjs`):** per task, do the 3 versions AGREE on verdict? (verdict-drift rate);
  confidence spread across versions; catch rate of the specific edge per version; contrast with
  the clear-fixture null (`model-regression/`) and the inferable baseline (well-calibrated).

## Ground truth (for scoring)

| task | non-inferable edge | defect | correct verdict |
|------|--------------------|--------|-----------------|
| 01-round-half-even | half-to-even tie | uses `Math.round` (also has a confounding inferable FP bug — kept but flagged) | gaps_found |
| 02-merge-intervals | touching intervals merge | strict `<` overlap test | gaps_found |
| 03-truncate-graphemes | grapheme-cluster safety | truncates by UTF-16 code unit | gaps_found |

Task 01 is confounded (an extra *inferable* FP bug a strong model may catch instead of the tie);
the clean cross-version read uses tasks 02–03, mirroring the original corpus analysis.

## Outputs

- `verdicts.tsv` — task, version, verdict, confidence, caught_edge, note (9 fresh rows).
- `analyze.mjs` — deterministic drift + calibration scoring.
- `RESULTS.md` — verdict-drift rate across versions, catch rate, and the C8 verdict
  (H1 vs H2), plus what a model-upgrade regression harness should watch.

## Caveats

- n = 9 fresh (1 rep/cell); direction-finding. Within-version stability borrowed from prior 2-rep
  data. "Versions" here are model *tiers/families* available in-harness (opus/sonnet/haiku), a
  proxy for the cross-release drift C8 ultimately targets.
- Verifiers are blind to the edge (no priming); told to emit calibrated confidence.
