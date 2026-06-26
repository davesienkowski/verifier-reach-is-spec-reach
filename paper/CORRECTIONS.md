# Data-integrity corrections applied while drafting the preprint

Audit performed 2026-06-26 against experiment primaries in `experiments/llm-open-problems/*/RESULTS.md`
and the edge-probe family docs. Each correction is a claim in the skeleton (or family docs) that the
primaries do **not** support as stated; the paper uses the corrected version.

## C1 — RETRACTED: "n=121 / blind spot 94%" is REAL and reproducible (I was wrong twice)

This entry has been corrected twice. **The original skeleton claim was right.** I twice mis-judged it
because the source experiment was not in *this* repo — it lived on `gsd-core@feat/non-inferable-pipeline`
and had never been consolidated. The author knew it existed; it does.

- **Skeleton claim (CORRECT):** "a powered replication (n=121, three models) reproduced the blind spot
  at 94%", sourced to `edge-probe-residual/RESULTS.md`.
- **What I wrongly concluded (twice):** first that it was unsupported (the dir wasn't in this repo);
  then that `n=121` was only a Discord/personal-fork aggregate. Both wrong.
- **The actual primary (now consolidated here):** `experiments/llm-open-problems/edge-probe-residual/`
  — David's experiment, 2026-06-05, recovered from `gsd-core@feat/non-inferable-pipeline`. **n=121
  verdicts** (4 self-validated non-inferable tasks + 1 inferable control × opus/sonnet/haiku × 3 reps).
  `verdicts.tsv` has 121 rows; **`analyze.mjs` reproduces every number live** from it:
  - **narrow non-inferable false-pass = 94%** (opus 100%, sonnet 83%, haiku 100%; n=32) — the blind
    spot, reproduced and powered (vs 100% at n=12 in `noninferable-corpus`). This IS the "94%".
  - **surfaced-resolved → 94% catch, 6% residual** (opus/sonnet 100%, haiku 83%) — resolving the
    edge-probe edge into the spec converts blind-spot→catch. The fix works, powered (the C1 result).
  - **surfaced-unresolved (real compiled `edge-probe.cjs` tag, abstain available): 33% false-pass,
    47% abstain, 19% catch.** Tier-gated: opus 100% honest, sonnet 67%, haiku 33% (haiku flag-deaf).
  - **Residual concentrates on the edge-probe recall MISS** (precision/tie class): 0% catch even when
    surfaced — the measured ~25% (1/4 categories) recall gap where a held-out backstop is irreplaceable.
  - **INF control: 100% catch, 0% over-abstention** — the *real* tagger (unlike N17's false oracle)
    induced no over-abstention. Better than N17 feared.
- **Independent corroboration (GitHub open-gsd/gsd-core#1637, `tests/verdict-eval/`):** the maintainer,
  unable to reach the personal fork, rebuilt a 43-item, two-model, CI-committed eval from scratch and
  landed the same conclusion (spec-silent baseline catch 36–43% → exogenous 71–79%; confident-false-pass
  64%/57% → 21%/29%). Two harnesses, blind to each other, agree. It also added the **domain-knowledge vs
  truly-spec-silent** split and showed endogenous *self-disconfirmation* is a no-go (regressed a Sonnet
  flag) while *abstention* is the routing win — refinements the paper adopts.
- **Bottom line:** the paper LEADS with the n=121/94% powered replication (David's, reproducible) and
  cites #1637 as independent corroboration. The lesson for me: `insufficient_spec` means *go find the
  evidence on the other branch*, not *delete the claim*.

## C2 — Held-out redundancy is scoped to inferable defects

Skeleton/program headline "must_haves + goal-backward verification is load-bearing; held-out is
redundant" was established **only on inferable defects** (`noninferable-corpus` recalibration §"What
this changes"). For non-inferable edges, held-out caught 100% vs verifier 0/12. Paper scopes it.

## C3 — Prohibition difficulty = scope, not negation

`prohibition-verify` (N7): 18/18 caught, positive 9/9 = prohibition 9/9, gap 0.00, ~0.99 conf. The
risk is **universal quantification over the repo** (a per-phase inspector samples; a prohibition
quantifies over the population), not the model's handling of negation. Paper leads with the reframing.

## C4 — Abstention does not recalibrate

`verifier-abstention` (N17): ECE among still-decisive non-inferable verdicts is 0.93→0.96→0.98 across
baseline/endogenous/exogenous — it nudges *up*. The deliverable is **fewer decisions in the blind
spot**, not better-calibrated ones. Paper states this explicitly.

## C5 — Endogenous: disconfirmation ≠ abstention (powered eval, #1637)

N17 direction-finding: false-pass 100% (baseline) → 67% (endogenous) → 17% (exogenous tagged). The
powered eval (#1637) sharpens this into two distinct endogenous mechanisms:
- **Self-disconfirmation** ("rebut your own verdict") is a **no-go**: net zero on Sonnet spec-silent
  and it *regressed* a correct flag (`pagination-index-base` FLAG→PASS) — actively harmful.
- **Abstention** ("don't pass unless confident") is a cheap *routing* win: spec-silent +21pp both
  models, zero over-abstention — but it routes to the exogenous resolver, it doesn't catch.
The author's original N17 "endogenous" arm was actually *abstention*, not disconfirmation — a
correction the maintainer surfaced and the author accepted. Paper now distinguishes the two and
recommends exogenous (tier-pinned), with abstention as the verify-time trigger.

## C6 — Recall residual is nuanced (not a flat "~25%")

`edge-probe-relevance`: the deterministic prose→shape engine under-fires 48% (and 79% on a second
corpus); the **LLM-in-the-loop** classifier recovers under-fire to ~0% (opus) / 14% (sonnet), but
**haiku is high-variance / corpus-sensitive** (not a fixed floor — corrected from an earlier "haiku
model floor" read). Paper states the residual as classifier-dependent and model-tier-sensitive, with a
held-out backstop for the residue, rather than a single "~25%" number.

## C7 — Do not cite the "~65% of failures from summary-drift" figure

`CLEANROOM-UNIFIED-REVIEW` §1.1 de-quantified it as unsourced. Not used.

## C8 — Cross-model/cross-family verifier recommendation is unvalidated

All verifier subagents across the corpus were Claude (opus/sonnet/haiku). Any cross-family
recommendation is stated as a caveat, not a result (N24 null).

## Verified headline numbers (backed by committed, reproducible primaries)

| Claim | Primary | Value |
|---|---|---|
| **powered replication: narrow blind-spot false-pass** | **`edge-probe-residual/RESULTS.md` + `verdicts.tsv` (n=121; `analyze.mjs` reproduces)** | **94%** (opus 100/sonnet 83/haiku 100; n=32) |
| **powered: surfaced-resolved catch (fix works)** | same `edge-probe-residual` | **94% catch**, 6% residual (opus/sonnet 100, haiku 83) |
| **powered: surfaced-unresolved, real tag, tier-gated** | same | 33% FP / 47% abstain / 19% catch; honest opus 100/sonnet 67/haiku 33 |
| **powered: residual = edge-probe recall MISS** | same | HIT tasks 26% catch; MISS task (precision/tie) **0% catch** even surfaced |
| **powered: INF control over-abstention** | same | 100% catch, **0% over-abstain** (real tag, unlike N17 oracle) |
| held-out vs verifier, non-inferable | `noninferable-corpus/RESULTS.md` | 3/3 (100%) vs **0/12** verdicts |
| calibration, inferable | same + `frontier-gsd-pipeline/a1` | n=16, acc 100%, mean conf 0.970, **ECE 0.030** |
| calibration, non-inferable (clean) | `noninferable-corpus/RESULTS.md` | n=8, acc 13%, mean conf 0.93, **ECE 0.805**, Brier 0.753 |
| abstention false-pass by condition | `verifier-abstention/RESULTS.md` | 100% → 67% → **17%**; n=27, 1 rep |
| over-abstention cost (false flag) | same | 33% (opus); haiku flag-deaf |
| prohibition adversarial recall | `prohibition-elicitation/RESULTS.md` | 25/25 holistic; canon-less 17/17 incl. haiku 6/6 |
| prohibition classifier precision | same | list 9.3→2.3; GT retained 8/8; engineering FPs 0/8 |
| edge-probe det. engine vs LLM-in-loop | `edge-probe-relevance/RESULTS.md` | precision 58%→81%; under-fire 48%→0% (opus) |
| **powered eval: spec-silent recall, baseline→exogenous** | **GitHub open-gsd/gsd-core#1637** (`tests/verdict-eval/`) | Sonnet **36%→79%**, Haiku **43%→71%** |
| **powered eval: spec-silent confident-false-pass, baseline→exo** | same #1637 | Sonnet **64%→21%**, Haiku **57%→29%** |
| **powered eval: corpus** | same #1637 | 43 items (inf 12 / domain-know 10 / spec-silent 14 / clean 7), 2 models, 258 judgments, 65 CI tests |
| **powered eval: endogenous disconfirmation** | same #1637 | net 0 Sonnet (regressed `pagination-index-base` FLAG→PASS); +modest Haiku |
