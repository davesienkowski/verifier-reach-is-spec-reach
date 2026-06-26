# N1 — Verifier reach as a measured coverage score (mutation-testing the goal-backward verifier)

**Date:** 2026-06-02 · branch `feat/trust-ledger`. **Corpus:** 12 blinded candidates over the 3
non-inferable tasks (`round-to`, `merge-intervals`, `truncate`): 3 clean controls + 6 inferable
mutants (violate a *stated* must_have, visible-passing) + 3 non-inferable mutants (the omitted-edge
defects). **Verifiers:** 36 inspection-only subagents (opus + sonnet + haiku × 12, blind: spec
must_haves + one neutral impl, omitted-edge notes and filenames stripped). **Scripts:**
`validate.mjs` (corpus self-validation), `analyze.mjs`, `verdicts.tsv`, `manifest.tsv`.

**Verdict:** **N1 works as an instrument — a category-spanning mutation battery yields a per-phase
"verifier reach %", and the honest metric (caught the *planted* edge, not raw `gaps_found`)
reproduces the edge-probe's law as a continuous number.** Reach is **89% on inferable defects and
0% on genuinely-arbitrary omitted edges** (half-even tie, grapheme-vs-code-unit). Three findings
sharpen the headline and are load-bearing for adoption: (1) "non-inferability" is a **spectrum** —
convention-bearing edges are recoverable; (2) **raw `gaps_found` is a deceptive proxy** — a verifier
rejects for the wrong reason; (3) **skeptical prompting costs specificity** — a thin spec produces
low reach *and* high false-positives together.

## Headline numbers (TRUE reach = verdict `gaps_found` AND named the planted must_have)

| candidate class | n | raw `gaps_found` | **TRUE reach (caught the edge)** |
|---|---|---|---|
| **inferable** mutants | 18 | 89% | **89%** |
| non-inferable — **convention-bearing** (touching) | 3 | 100% | **100%** |
| non-inferable — **genuinely arbitrary** (tie, grapheme) | 6 | 50% | **0%** |
| non-inferable — all | 9 | 67% | 33% |
| **clean** controls (specificity) | 9 | — | **56% passed (44% false-positive)** |

## Finding 1 — reach is bimodal, and reproduces the corpus 0/12 as a continuous score

True reach is **89% inferable vs 0% on genuinely-arbitrary edges**. The two arbitrary edges behave
exactly as `noninferable-corpus/` predicted: the half-even tie was **unanimously passed** (0/3), and
the grapheme edge was **never caught** (0/3) — see Finding 3. A single per-phase number over a
category-spanning battery is therefore a usable thin-spec gauge: high reach = the verifier can see
the spec's edges; a low-reach residual = omitted checkable edges, exactly what the edge-probe exists
to surface.

## Finding 2 — "non-inferable" is a spectrum: verifier reach = spec reach + general-convention reach

The merge-intervals **touching** edge — non-inferable in the original corpus (0/4) — was caught
**3/3 here**, because a skeptical verifier invokes the standard CS convention ("touching intervals
are conventionally overlapping; the condition should be `<=`"). The genuinely-arbitrary edges have
**no such convention** (nothing in general knowledge says half-to-even beats half-up, or grapheme
beats code-unit), and stayed at 0%. So the edge-probe law refines to:

> **verifier reach = spec reach + general-convention reach.** Only the *convention-free* residual is
> the true blind spot the edge-probe / a held-out backstop must cover.

(This also explains why the corpus saw touching missed: its verifier prompt was less adversarial.
The catchable-by-convention band moves with prompt skepticism; the convention-free band does not.)

## Finding 3 — raw `gaps_found` is a deceptive reach proxy (the key adoption lesson)

The grapheme mutant got **`gaps_found` from all 3 models (raw reach 3/3) while catching the actual
planted edge 0/3** — every model rejected it for an *unrelated* reason (negative-`max` handling,
null-coercion nitpicks), never the code-unit-vs-grapheme defect. Non-inferable raw reach (67%) thus
**overstates** true edge-catch (33%). **An N1 implementation must grade "did the verifier name the
injected must_have," not "did it say gaps_found"** — otherwise spurious rejections inflate the score
and a thin spec looks well-covered.

## Finding 4 — skeptical prompting trades specificity (reach and precision move together)

The same prompt that lifts inferable reach to 89% produces a **44% false-positive rate on correct
reference code** (5/9 clean controls passed). The verifier flagged *defensible* choices on
spec-ambiguous points: banker's rounding (01-ref, 2/3 flagged), grapheme segmentation and `?? ''`
coercion (03-ref, 2/3 flagged). Mechanism: when the spec is silent on an edge, the verifier has
nothing to anchor on, so it pattern-matches on code "unusualness" — flagging the elaborate-but-correct
reference *and* (Finding 3) waving through or mis-diagnosing the simple-but-wrong mutant. **Reach must
be reported with specificity (include the unmutated reference as a control); a thin spec shows up as
low true-reach AND high false-positives at once.**

## Finding 5 — A1 overconfidence reproduces in the arbitrary blind spot

| regime | n | verdict acc | mean conf | Brier |
|---|---|---|---|---|
| inferable | 18 | 89% | 0.924 | 0.081 (well-calibrated) |
| non-inferable convention | 3 | 100% | 0.923 | 0.006 |
| non-inferable **arbitrary** | 6 | 50%* | 0.895 | **0.427** |
| clean | 9 | 56% | 0.888 | 0.318 |

\* raw-verdict accuracy; by *caught-edge* the arbitrary regime is 0%. Confidence stays ~0.89–0.92
whether right or wrong — the verifier does not know when it is blind. Consistent with the corpus.

## Finding 6 (N11 bonus) — cross-tier disagreement flags hard cases but NOT uniform blindness

4/12 candidates split across tiers: the two inferable mutants one model missed (opus missed
`02-inf-mutate` aliasing; sonnet missed `01-inf-neg` negatives) and the two false-positive-prone
clean refs. **But both genuinely-arbitrary blind spots were unanimous** (tie: 3×pass; grapheme:
3×gaps-for-the-wrong-reason). So cross-tier disagreement is a useful "this candidate is hard/ambiguous"
signal, but it **cannot detect uniform blindness** — where it would help most, all tiers agree. N11
needs pairing with N1's planted-edge battery, not single-model verdicts, to see the blind spot.

Tier note: **haiku had the highest true inferable reach (100%) and good specificity (67%); opus had
the lowest specificity (33%)** — opus's extra skepticism bought false positives, not catches.
Consistent with the program thesis: the structured `must_haves` do the work, not model tier.

## What this means for adopting N1 into GSD

- **Where:** an optional post-verify step; `gsd-verifier` emits a `## Verifier Reach` section in
  `VERIFICATION.md`. Reuse the `references/edge-probe.md` taxonomy as the mutation operator set.
- **Grade caught-edge, not `gaps_found`** (Finding 3) — match the verifier's `suspected_gap` to the
  injected must_have, or the metric lies.
- **Always include clean controls** (the unmutated impl) and report **reach × specificity** together
  (Finding 4) — a thin spec moves both the wrong way.
- **Report the convention-free residual separately** (Finding 2) — that 0% band is the irreducible
  part needing the edge-probe (spec completion) or a held-out backstop; the convention band can be
  lifted by instructing the verifier to apply domain conventions.

## Caveats

- n = 12 candidates / 36 verdicts, 3 tasks, 1 rep/cell. Direction-finding, not powered — but effects
  are large and one-sided (inferable 89% vs arbitrary 0%; 44% clean FP).
- "inferable / arbitrary" is relative to the specs written (the edge-probe's whole point).
- `caught_edge` was graded from each verdict's `suspected_gap` text against the manifest; per-row
  rationale is recorded in `verdicts.tsv`. One contamination guard fired during build: a string-return
  mutant was dropped because task 01's `assert/strict` visible suite caught it (it wasn't a valid
  reach probe — the executor's own tests, not the verifier, would catch it).
- The skeptical verifier prompt is one point in prompt-space; reach and specificity both move with it.
