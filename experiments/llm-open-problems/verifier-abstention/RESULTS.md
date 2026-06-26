# N17 — Verifier abstention: endogenous vs exogenous (the honest verifier)

**Date:** 2026-06-02 · branch `feat/non-inferable-pipeline`. **Provenance:** r/ClaudeAI thread
`1tv1kng` (Swimming-Delivery427 "stronger reviewer" + JuryNightFury "cross-model"; reframed against
this program's `noninferable-corpus/` — a stronger reviewer can't recover what the spec omits, so
make it *honest*, not stronger). **Corpus:** `noninferable-corpus/` tasks 02-merge + 03-truncate (the
2 clean non-inferable defects) + one new **inferable control** (`tasks/02-merge-intervals-INFERABLE.mjs`,
defective on the STATED "sorted by start" rule). **Verifiers:** 27 subagents = opus + sonnet + haiku ×
3 conditions × 3 tasks, inspection-only, verdict + calibrated confidence. **Scripts:** `analyze.mjs`,
`verdicts.tsv`.

**Verdict:** **Exogenous abstention works; endogenous abstention mostly doesn't — exactly as the prior
predicted.** Tagging a check non-inferable cuts the confident-false-pass rate on the blind spot from
**100% → 17%**, converting 5/6 confident wrong "passes" into honest "route to a held-out test." Letting
the verifier *self*-decide to abstain barely helps (100% → 67%) and only on the *conceptually salient*
ambiguity it happens to notice — on the genuine blind spot it stays confidently wrong. This is the
direct operationalization of the corpus caveat ("told to be honest, still overconfident — the model
does not know when it doesn't know"): **honesty must be triggered exogenously, because the verifier
cannot self-detect its own blind spot.** Two costs bound the win (below).

## Result 1 — false-pass on the non-inferable blind spot, by condition

| condition | n | false-pass | abstain (honest) | mean conf of false-pass |
|---|---|---|---|---|
| **baseline** (no abstain option) | 6 | **100%** | 0% | 0.93 |
| **endogenous** (self-judged abstain) | 6 | **67%** | 33% | 0.96 |
| **exogenous** (tagged non-inferable) | 6 | **17%** | **83%** | 0.98 |

Baseline reproduces `noninferable-corpus` exactly (6/6 confident false-pass). The abstention *option*
alone (endogenous) recovers only the cases the model already recognizes as ambiguous.

## Result 2 — endogenous abstention is blind-spot-limited (task-dependent)

Abstention only fired on **task 02 (touching intervals)** — a *classic, salient* interval question —
and never on **task 03 (grapheme truncation)**, where the model never surfaces Unicode at all:

| model | baseline | endogenous | exogenous | (abstains / 2 NI tasks) |
|---|---|---|---|---|
| opus | 0/2 | 1/2 (task 02 only) | 2/2 | |
| sonnet | 0/2 | 1/2 (task 02 only) | 2/2 | |
| haiku | 0/2 | **0/2** | 1/2 | |

The pattern is the thesis made mechanical: **self-abstention requires *noticing* the gap.** Task 02's
edge is conceptually obvious (does `[1,2]+[2,3]` merge?); task 03's edge (a "character" is a grapheme,
not a code unit) is a true blind spot — the model doesn't perceive it, so it can't abstain on it. A
confidence gate or an "abstain if unsure" instruction cannot reach a blind spot the model doesn't feel.

## Result 3 — exogenous routes correctly even with the WRONG diagnosis

Under exogenous tagging, opus and sonnet abstained on task 03 — but citing *negative `max`* (opus) and
*null coercion* (sonnet), **not** the actual grapheme edge. They identified the wrong gap and still took
the right action (defer to a held-out test). This is the useful property: **exogenous abstention is a
routing signal, not a diagnosis.** If the verifier could name the true edge it wouldn't be a blind
spot — so a mechanism that produces correct *deferral* without correct *identification* is exactly what
the regime needs. The honest verdict requires only "I was told this is under-specified and I can't rule
it out," which is reachable; "here is the precise omitted rule" is not.

## Result 4 — the two costs (why exogenous is not free)

The inferable control (defective on the *stated* sort rule; correct verdict = `gaps_found`, abstaining
is an error) exposes the boundary conditions:

| condition | catch | miss | **over-abstain** |
|---|---|---|---|
| baseline | 100% | 0% | 0% |
| endogenous | 100% | 0% | 0% |
| exogenous (**deliberately false flag**) | 67% | 0% | **33%** |

1. **Detector precision is load-bearing.** A *false* non-inferable flag made **opus over-abstain** —
   it deferred a real, spec-determined sort bug to "held-out" rather than catching it outright. Exogenous
   abstention is only as good as the tag: a false-positive flag converts a confident-correct catch into a
   needless abstention. (Endogenous never over-abstained — giving the *option* didn't make models
   trigger-happy; only an external false *instruction* did.)
2. **The weak tier is flag-deaf.** Haiku ignored the flag on task 03 (false-passed anyway) *and* on the
   falsely-flagged control (correctly caught) — least responsive to the protocol either way. Exogenous
   abstention assumes the verifier heeds the tag; the weakest tier does so inconsistently.

## Calibration note — abstention removes blind-spot calls, it does not recalibrate them

ECE among the verdicts that *stayed decisive* on NI tasks is 0.93 → 0.96 → 0.98 across conditions — it
does not improve, it nudges *up*. Abstention skims off the cases the verifier should never have decided;
whoever still decides is still confidently wrong. The deliverable is **not a better-calibrated decisive
verdict — it is fewer decisive verdicts in the blind spot.** Honesty here means declining to rule, not
ruling with lower confidence (the prior already showed lower-confidence-on-request doesn't happen).

## What this changes (adoption)

- **Ship exogenous, not endogenous.** An "abstain if unsure" instruction is near-useless on true blind
  spots; a non-inferable **tag** that forces deferral is what moves the number (100%→17% false-pass).
- **The tag needs a precise source.** Candidates already in the program: the edge-probe `backstop` flag
  (spec-time), and **N11 cross-tier disagreement** (verify-time). N17's over-abstention cost is the
  argument for N11's *precision* — pair them: disagreement flags the check, abstention routes it.
- **Don't expect the verifier to explain the gap.** Route on the tag; let a human-authored held-out test
  (Much-Wallaby's "must NOT") carry the actual omitted rule. This closes the loop with N18 (name it
  upfront) and N7 (`must_haves` polarity backstop).

## Caveats

- **n = 27 verdicts, 3 tasks (2 NI + 1 inferable control), 3 models, 1 rep.** Direction-finding, not
  powered — but the NI effect is large and monotone (100%→67%→17%) and the costs are clean single
  events (opus over-abstain; haiku flag-deafness) that name the right failure modes to test at scale.
- **The exogenous "flag" was a prompt instruction, not a real detector.** It models a *perfect-recall*
  tagger; the over-abstention result models a *false-positive* tag. Real adoption couples it to N11/edge-probe,
  whose true precision/recall is the next measurement.
- **"Non-inferable" is relative to the spec given** (the corpus's design) — same scoping caveat as
  `noninferable-corpus/RESULTS.md`.
