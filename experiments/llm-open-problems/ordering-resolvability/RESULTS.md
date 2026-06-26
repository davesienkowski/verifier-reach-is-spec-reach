# Ordering-edge resolvability — Results

**Date:** 2026-05-31
**Branch:** `feat/trust-ledger`
**Parent:** `spec-completeness-edge-probe/` (issue open-gsd/gsd-core#550)

## Question

In the edge-probe taxonomy, `ordering` is the one category with no safe auto-resolution
default — in the DESIGN worked example it is the single `⚠ UNRESOLVED` row. Can it be
resolved automatically, and if not, is leaving it to the soft gate / backstop a **gap**
or the **correct answer**?

## Method

A shared 24-requirement labelled corpus (`corpus/requirements.json`, self-checked by
`corpus/validate.mjs`) with ground truth for `order_relevant`, `intended_order`, and
`inferable` (is the order recoverable from the *statement alone*). Four experiments map
onto the reframe "*is order relevant?*" (E1, E2) vs "*which order?*" (E3, E4).

> **Reproducibility note.** E1, E2, and the E4 heuristic arm are fully deterministic —
> re-run the `analyze.mjs` scripts to regenerate every number below. Each script also
> writes a `results*.json` next to it. The E3 and E4 **model arms are now populated** by a
> blind 3-model run (Haiku / Sonnet / Opus) frozen in each `verdicts.tsv`; `analyze.mjs`
> self-scores those predictions against the corpus (shared `scoring.mjs`), so re-running it
> regenerates every model-arm number too — the blind predictions are the only non-deterministic
> input and they are checked in. See **Model-arm protocol** below for how blindness was held.

## Corpus composition

| | count | ids |
|---|---|---|
| order-irrelevant | 9 | r01–r04, r12, r14, r16, r20, r22 |
| order-relevant | 15 | the rest |
| ↳ inferable (order named in statement) | 8 | r05,r06,r07,r08,r17,r18,r19,r23 |
| ↳ non-inferable (order matters, unstated) | 7 | r09,r10,r11,r13,r15,r21,r24 |

Deliberate traps: **r11** `Map<_,Array>` (looks order-free, values are ordered), **r24**
string built from an upstream set, **r13/r21** inferable primary sort + non-inferable
tie-break.

## E1 — return-type auto-dismiss (deterministic) ✅ RUN

Can the return type alone safely auto-`dismiss` the irrelevant cases?

| rule | auto-dismissed | correct | **false-dismiss** | unresolved → E4 | safe? |
|------|----------------|---------|-------------------|------------------|-------|
| naive (`Set`/`Map`/`object`/scalar ⇒ dismiss) | 10/24 | 9/9 irrelevant | **1 (r11)** | 14 | ❌ |
| refined (`Map`/`object` kept when values are collections) | 9/24 | 9/9 irrelevant | **0** | 15 | ✅ |

**Finding:** type-based dismissal is a **safe but partial** win. The refined rule
collapses 100% of the genuinely-unordered cases with **zero false-dismiss**; the naive
rule buys the same coverage but mis-dismisses the `Map<_,Array>` trap — proving
"`Map` ⇒ order-free" is unsafe. **15/24 order-bearing requirements survive** and cannot
be resolved by type.

## E4 — is the surviving order recoverable? (decisive) ✅ heuristic RUN · ✅ model RUN

For the 15 survivors, recover `intended_order` from the **statement alone**, scored
against ground truth, split by `inferable`. Chance ≈ 1/6 classes ≈ **17%**. Model arm =
blind run, responder sees `statement`+`return_type` only (`e4-recoverability/verdicts.tsv`).

| arm | inferable (n=8) | non-inferable (n=7) |
|-----|------------------|----------------------|
| heuristic (`predict-heuristic.mjs`) | **6/8 = 75%** | **1/7 ≈ 14% (at chance, ≈16.7%)** |
| haiku (blind) | **7/8 = 87.5%** | **1/7 = 14.3%** (at chance) |
| sonnet (blind) | **7/8 = 87.5%** | **2/7 = 28.6%** |
| opus (blind) | **7/8 = 87.5%** | **2/7 = 28.6%** |

**Finding (model arm — the decisive result):** scaling the responder from a keyword
heuristic up to Opus (a ~30× cost span) **does not buy recovery of the non-inferable
residual.** On the *inferable* bucket every model clears 7/8 (87.5%), beating the
heuristic's 75% by recovering r19 "histogram bucket counts" (the heuristic found no cue;
the models read "bucket index"). On the *non-inferable* bucket the models sit at
**14–29% — at or barely above the 16.7% chance floor** — and the above-chance sliver is
fully accounted for: the only non-inferable "hits" are **r13 and r21, the two tie-break
traps**, where the model correctly names the *primary* sort (which the statement *does*
state) while the actual omission — the ordering of *equal* elements — is invisible to the
coarse class score. The genuinely-undecided contracts (r10 encounter-order, r11 inner-array
order, r15 `readdir` order, r24 order derived from an upstream set) are returned `UNSTATED`
or wrong by **every model, Opus included**. The three models also agree on 13/15 rows
across the whole cost range — where they converge, the order was stated; the spread is only
on boundary cases (r21 leaderboard, r19/r11 hedge-vs-commit).

> **Honest scoring caveat (r06).** All three models answered r06 "in the order they
> occurred" → `chronological`, scored as a *miss* only because the answer key's
> `truthClass6` regex collapses the prose "sorted by timestamp" to `sorted-by-field`
> ("sorted" is matched before "timestamp"). The models' `chronological` is arguably *more*
> correct than the label; under charitable scoring the inferable bucket is 8/8. This is a
> key-coding artifact, not a model failure — flagged rather than laundered. It does not
> touch the decisive non-inferable result.

This reproduces the program's load-bearing result — **verifier reach = spec reach** —
localized to `ordering`: the residual after E1 is **non-inferable by construction**, and a
frontier model does **not** beat chance on it (the `noninferable-corpus/` prior held). So
the soft gate / backstop is the **correct** answer, not a coverage gap an LLM could close.

## E2 — caller-context inference (deterministic) ✅ RUN

When a downstream consumer exists, does its usage pattern disambiguate? 12 labelled
producer→caller cases (`e2-caller-context/cases.json`).

- **accuracy 12/12 = 100%**, **false-dismiss 0**, 0 undecided.
- Order-destroying signals (`new Set`, re-`sort`, `reduce`, membership) ⇒ irrelevant;
  order-depending signals (positional index, head `slice`, `join`, `deepEqual`,
  sequential `for…of`) ⇒ matters, with **depends winning ties** (never silently call an
  order-sensitive caller irrelevant).

**Finding:** consumer context is a strong, safe disambiguator **when callers exist** —
but the spec phase is often greenfield (no callers yet), so this is a downstream booster,
not the front-of-pipeline fix.

## E3 — forced-choice vs open elicitation ✅ RUN (blind, 3 models)

Each order-relevant requirement asked twice per model: open probe ("is the order specified
and stable?") then forced choice (a/b/c/d). `resolved=1` iff the answer commits to a
concrete order; `matches` self-scored against the 4-class `truthClass4`.

| model | open resolved | open matchInf / matchNonInf | forced resolved | forced matchInf / matchNonInf |
|-------|---------------|-----------------------------|-----------------|-------------------------------|
| haiku  | 53.3% | 62.5% / 14.3% | 100% | 75.0% / 42.9% |
| sonnet | 46.7% | 75.0% / 14.3% | 100% | 87.5% / 28.6% |
| opus   | 66.7% | 87.5% / 14.3% | 100% | 87.5% / 42.9% |
| **pooled** | **55.6%** | **75.0% / 14.3%** | **100%** | **83.3% / 38.1%** |

**Finding:** forcing a choice does exactly what the hypothesis feared. It lifts
*resolution* from ~56% to 100% by construction, and on the *inferable* items that is
mostly harmless (matchInf rises as the hedges collapse onto the order the statement already
names). But on the *non-inferable* items the forced "correctness" gain (14.3% open → 38.1%
pooled forced) is **the same coarse artifact E4 exposed** — it is r09 (dedup → the
*convention* "keep first", not a stated order), r13 and r21 (primary sort named, tie-break
omitted). The items that are genuinely undecided (r10, r11, r15, r24) get **confident,
committed, wrong** answers. Forced choice manufactures confident resolutions precisely
where a wrong commit is the silent failure the gate exists to catch. **Do not ship a
forced-choice auto-resolver.**

## Model-arm protocol (E3, E4) — how blindness was held

Matching `noninferable-corpus/verdicts.tsv`: the responder sees **only** `statement` +
`return_type` (labels stripped), one row per prediction, then `analyze.mjs` joins to the
corpus. The author of these results had already seen the ground-truth labels, so — following
this program's contamination discipline (the Task-01 name-leak correction) — the model arms
were **not self-filled**. Instead each arm was run by a **freshly-spawned subagent** that
received only the 15 stripped requirements in its prompt and was instructed to use **no
tools and read no files** (verified: every responder returned with `tool_uses: 0`, so none
could have reached the answer key in the repo). Six blind responders: {haiku, sonnet, opus}
× {E3, E4}, E3 and E4 in separate sessions so the recoverability arm is not anchored by the
forced-choice arm. Scoring is mechanical and lives in `analyze.mjs` + `scoring.mjs`
(`matches` is *computed*, never hand-entered into `verdicts.tsv`), so the label-aware
orchestrator never scored a row by hand. The blind predictions are frozen in each
`verdicts.tsv`; re-running `analyze.mjs` regenerates every number.

## Synthesis → recommendation for #550

1. **Add the E1 refined type-dismiss to the probe** (auto-`dismissed` for `Set`/scalar
   and `Map`/`object` with non-collection values, **never** for sequence types or
   `Map<_,collection>`). Safe, deterministic, removes ~9/24 ordering edges from the
   author's queue with zero false-dismiss.
2. **Treat the order-bearing remainder as non-inferable by default.** E4's blind model arm
   confirms it: Haiku→Opus all recover the unstated residual at/near chance (14–29% vs a
   16.7% floor), and the above-chance bit is only coarse primary-sort matches on the
   tie-break traps — so `--auto` must **backstop or ask**, never auto-cover. This validates
   the DESIGN choice to leave `ordering` soft-gated: it is the **correct** behavior, not a
   coverage gap a bigger model would close.
3. **Use E2 caller-context as an opportunistic booster** where consumers already exist
   (e.g. probing edges of a requirement that modifies existing code).
4. **Do not ship a forced-choice auto-resolver.** E3's blind run confirmed the fear: forced
   choice drives resolution to 100% but its non-inferable "correctness" is convention/
   primary-sort artifact while the genuinely-undecided items get confident-but-wrong commits
   — the exact silent failure the gate exists to catch.

**One-line:** ordering splits into a safely-auto-dismissable *irrelevant* half and a
provably *non-inferable* relevant half; the probe should auto-clear the former by type
and soft-gate/backstop the latter — exactly what the design does.

## Status

| exp | state |
|-----|-------|
| E1 type-dismiss | ✅ run, deterministic |
| E2 caller-context | ✅ run, deterministic |
| E4 heuristic arm | ✅ run, deterministic |
| E4 model arm | ✅ run, blind 3-model (haiku/sonnet/opus) — confirms chance-level on non-inferable |
| E3 elicitation | ✅ run, blind 3-model — forced choice raises resolution, not correctness |
