# N7 — Prohibition verification (`must NOT` vs `must`)

**Date:** 2026-06-02 · branch `feat/trust-ledger`. **Corpus:** 3 real GSD prohibitions (ADR 0007 no-IO,
ADR 0005 no-red, ADR 0011 monotonic-momentum), each presented as the **same violating code** under two
spec framings — positive ("X MUST hold") and prohibition ("X must NOT") — to opus/sonnet/haiku =
**18 blind verdicts**. Plus a deterministic backstop per constraint (`backstop.mjs`). **Scripts:**
`backstop.mjs`, `analyze.mjs`, `verdicts.tsv`.

**Verdict:** **Clean NEGATIVE on the polarity-gap hypothesis — and it relocates the real prohibition
risk.** Catch was **18/18, identical across framings** (positive 9/9, prohibition 9/9, gap 0.00), every
tier, every constraint, at ~0.99 confidence — including the subtle `current - 1` monotonicity break
that requires reasoning about behavior, not spotting a literal. Frontier verifiers handle "must NOT" as
well as "must" **when the violation is present in the inspected code.** The deterministic backstop also
caught 3/3. So the prior-art "negatives are harder" finding (which is about test *generation*) does
**not** reproduce for goal-backward *inspection* — and the actual reason prohibitions need a backstop
turns out to be **scope, not polarity.**

## Result

| framing | caught | by constraint | by tier |
|---|---|---|---|
| positive ("MUST") | 9/9 | c1-io 3/3 · c2-red 3/3 · c3-monotonic 3/3 | opus 6/6 |
| prohibition ("must NOT") | 9/9 | (same) | sonnet 6/6 |
| **polarity gap** | **0.00** | | haiku 6/6 |
| deterministic backstop | 3/3 | | (polarity-independent) |

The models even supplied the missing world-knowledge unprompted: both framings of c2 flagged `#ef4444`
as "Tailwind red-500"; c3 reasoned that the `lapse` branch returns `current - 1` and therefore breaks
monotonicity. Negation did not trip them.

## The refined finding: the prohibition risk is SCOPE (universal quantification), not negation

A prohibition is a **universally-quantified claim over the whole codebase** — "no file *anywhere* uses
red", "*nothing* in `shared` does IO". An LLM verifier inspects only the **files in scope for the
phase**. Catching "this file violates the rule" (18/18 here) is *not* the same guarantee as "no file
violates the rule." The experiment shows the verifier is excellent at the former and structurally
cannot provide the latter — it inspects a *sample*, the prohibition quantifies over the *population*.

So the deterministic backstop's value is **coverage, not the model's negation ability**: a lint /
purity-boundary test scans the entire tree and turns a universal claim into a checkable one. This is
exactly the mechanism N2 found GSD already uses (`purity-boundary.test.ts` scans *all* of `shared`;
the no-red tests assert across components). N7 explains *why* that pattern is the right one: not
because the LLM is bad at "not", but because a per-phase inspector can't quantify over the whole repo.

## Adoption implication (refined from the original design)

- **Drop the premise that prohibitions need an LLM-side fix.** Polarity tagging on `must_haves` is still
  worth having for routing, but not because the verifier is weak at negation — it isn't.
- **Route prohibition `must_haves` to a repo-wide deterministic backstop** (`eslint-rules/*.cjs` /
  a purity-style scan), because only a whole-tree check satisfies the universal quantifier. The
  verifier confirms the in-scope files; the backstop covers the population.
- **This merges with N2's recommendation:** every LOCKED prohibition (no-IO, no-red, monotonic) should
  ship a repo-wide backstop test. N2 showed the ones that held already have one; N7 shows the LLM
  verifier is a fine *second* line on in-scope code but cannot be the *only* line for a universal rule.

## Caveats

- n = 18 verdicts, 3 constraints, violation always *present and fairly legible* in a tiny file. The
  clean 18/18 is partly because each violation was inspectable; a prohibition violated *by omission*
  (e.g., a missing guard that should prevent a forbidden state) or buried in a large file would be
  harder — untested here.
- The experiment tests *detection given the violating file is in scope*. It deliberately does **not**
  test the scope problem itself (whether the verifier is even shown the offending file) — that is the
  point the backstop exists to cover, and is asserted by construction, not measured.
- Frontier-model world knowledge (recognizing `#ef4444` as red) is doing real work; a weaker/older
  model or a less-famous magic value (a non-standard red, an obscure IO API) could widen the gap.
