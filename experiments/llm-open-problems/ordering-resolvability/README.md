# Ordering-edge resolvability

**Date:** 2026-05-31
**Branch:** `feat/trust-ledger`
**Parent:** `spec-completeness-edge-probe/` (issue open-gsd/gsd-core#550)

## Why this exists

The edge-probe taxonomy has 8 categories. Seven of them have a *safe default* the
probe can auto-apply (`empty → []`, `encoding → graphemes/NFC`, `precision → document
the contract`). **Ordering is the one that resists auto-resolution** — and in the
DESIGN.md worked example it is the single `⚠ UNRESOLVED` row
(`spec-completeness-edge-probe/DESIGN.md:162`).

The reason: ordering has three equally-valid answers — *stable/insertion-order*,
*sorted-by-field*, or *unspecified* — and the issue's own rule says `--auto` must
**never auto-dismiss**, because a wrong "order doesn't matter" is exactly the silent
failure the feature exists to kill (`DESIGN.md:178`). So ordering cannot be auto-covered
the way the others can.

This sub-experiment asks: **can `ordering` be resolved automatically, and if not, is
that a gap or is "ask / backstop" the provably-correct answer?**

## The reframe being tested

`ordering` is really two questions with very different resolvability:

1. **Is order observable/relevant at all?** — often *safely inferable from the return
   type* (a `Set`/`Map`/`bool`/scalar has no observable order).
2. **If relevant, which order?** — *author-intent-bound*; may be genuinely
   non-inferable when the statement never names it.

The four experiments map onto that split.

| Exp | Question | Method | Determinism | Safety metric |
|-----|----------|--------|-------------|---------------|
| **E1** | Can return-type safely auto-dismiss the *irrelevant* cases? | type classifier over `corpus/` | fully deterministic | **false-dismiss rate (must be 0)** |
| **E4** | For the *relevant* remainder, is the intended order recoverable? | strip stated order → predict → beat chance? | model arm in `verdicts.tsv` | beat-chance margin |
| **E2** | Does caller/consumer context disambiguate when present? | usage-pattern heuristic over `e2-caller-context/cases.json` | fully deterministic | false-resolve rate |
| **E3** | Does forced-choice elicitation beat the open probe? | open vs forced prompt | model arm in `verdicts.tsv` | unresolved-rate ↓, match-to-truth |

## Shared corpus

`corpus/requirements.json` — 24 labelled requirements spanning order-free return types
(Set/Map/bool/scalar/object), order-bearing types (Array/string), and the deliberate
**traps**: `Map<_, Array>` (outer unordered, inner ordered) and a string built from a
set (order-bearing type, order derived upstream). Each carries ground truth:
`order_relevant`, `intended_order`, and `inferable` (can a competent engineer recover
the order from the *statement alone*).

Self-checked by `corpus/validate.mjs` (label invariants + the trap requirements exist).

## The expected story

E1 collapses the genuinely-unordered cases **safely** (0 false-dismiss with the refined
rule; the *naive* rule misfires on the `Map<_,Array>` trap — that's the finding). E4
then tests the remainder: if even a strong model can't beat chance at recovering an
*unstated* order, ordering's residual is **non-inferable by construction**, so the soft
gate / backstop is the correct answer — not a coverage gap. E2/E3 measure the two
partial mitigations (consumer context, better elicitation).

See `RESULTS.md`.
