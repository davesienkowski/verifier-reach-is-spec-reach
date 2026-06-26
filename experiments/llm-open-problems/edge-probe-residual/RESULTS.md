# Edge-probe residual — does the edge-probe close the non-inferable blind spot, and is the abstention/held-out lane still needed?

**Date:** 2026-06-05 · branch `feat/non-inferable-pipeline`
**Provenance:** David's original experiment (AI-assisted), extending `noninferable-corpus/` (n=12) and
N17 `verifier-abstention/` (n=27). The gating experiment for research-question Q9 and the
exogenous-verification primitive (`.planning/notes/exogenous-verification-primitive-2026-06-05.md`).
**Corpus:** 4 self-validated non-inferable tasks (adjacency, encoding, ordering, precision/tie) + 1
inferable control. All pass `noninferable-corpus/validate.mjs`. **Verifiers:** opus + sonnet + haiku,
inspection-only, 3 reps. **n = 121 verdicts** (~4.5× N17). **Scripts:** `build-specs.mjs`, `analyze.mjs`,
`verdicts.tsv`.

## Design — three spec states, real edge-probe (not an oracle)
Each non-inferable task is run under three conditions, the key advance over N17 (whose "exogenous" flag
was a hand-authored oracle):
- **narrow** — spec with the omitted edge stripped (baseline blind spot; no abstain option).
- **surfaced-unresolved** — narrow + the REAL compiled `edge-probe.cjs` output appended as flagged
  UNRESOLVED edges (the *deployed* tagger), with `insufficient_spec` available.
- **surfaced-resolved** — narrow + the omitted edge written as an explicit, decided acceptance criterion.

Edge-probe recall (deterministic, measured by running the binary): adjacency→HIT, encoding→HIT,
ordering→HIT, precision/tie→**MISS** (raises boundary+precision but never names the tie rule). 3/4 recall.

## Headline results

### 1. Baseline blind spot reproduced and powered
narrow non-inferable false-pass = **94%** (opus 100%, sonnet 83%, haiku 100%; n=32). Reproduces
`noninferable-corpus` (100% at n=12) at larger n. Confidence on false-passes 0.85–0.99 — overconfidence
holds (A1/C8 blind spot).

### 2. The fix works: resolving the edge converts blind-spot → catch (the C1 result, powered)
surfaced-resolved → **94% catch, 6% residual false-pass** (opus 100%, sonnet 100%, **haiku 83%**).
Once the edge-probe edge is surfaced AND resolved into the spec, the verifier catches the planted defect
almost always. **Residual ≈ 0 for opus/sonnet.** Haiku still misses the stability bug even when the
criterion is explicit — a hard tier limit.

### 3. The edge-probe tag drives honest abstention — but it is strongly tier-gated
surfaced-unresolved (real edge-probe tag, abstain available): **47% abstain, 19% catch (66% honest),
33% false-pass.** By tier:

| model | false-pass | abstain | catch | honest (abstain+catch) |
|---|---|---|---|---|
| opus | 0% | **100%** | 0% | **100%** |
| sonnet | 33% | 42% | 25% | 67% |
| haiku | 67% | **0%** | 33% | 33% |

Exogenous abstention works on capable tiers with a *real* tagger (opus 100% honest), and **haiku stays
flag-deaf (0% abstain)** — reproducing N17's tier finding without an oracle.

### 4. Residual concentrates exactly on the edge-probe RECALL MISS
surfaced-unresolved, by edge-probe recall:

| edge-probe | false-pass | abstain | catch |
|---|---|---|---|
| HIT (adjacency/encoding/ordering) | 30% | 44% | 26% |
| **MISS (precision/tie)** | 44% | 56% | **0%** |

When the edge-probe NAMES the edge (HIT), the verifier catches 26% and abstains 44%. When it MISSES,
the verifier **never catches (0%)** — the blind spot persists exactly where edge-probe recall fails.
(Abstain still fired 56% on the MISS task because opus connected the surfaced *boundary* noise-edge to
the tie — partial coverage from an adjacent category.)

### 5. No over-abstention cost from the real tagger (better than N17 feared)
INF control (defect on a STATED rule): **100% catch, 0% over-abstain** under both narrow and
surfaced-unresolved. The edge-probe's noise edges (empty/ordering/boundary) did NOT make verifiers defer
the spec-determined bug. This is *better* than N17, where a deliberately-false oracle flag made opus
over-abstain 33% — the real edge-probe, surfacing edges as generically "unresolved," did not induce that.

## What this answers (research-question Q9)
**Is the abstention/held-out lane needed, or does the already-shipped edge-probe cover it?**

- **For edges the edge-probe surfaces AND the author resolves: the edge-probe is the fix** (94–100%
  catch). Abstention is not even needed there — the edge becomes inferable (verifier-reach = spec-reach,
  mechanized). This supports "the shipped edge-probe does most of the work."
- **The abstention lane earns its keep only in the middle** (edge surfaced but left unresolved) and is
  **tier-gated**: valuable on opus (100% honest), near-useless on haiku (0%). Ship exogenous abstention
  but pin it to a capable verifier tier; do not rely on it on a weak tier.
- **The irreducible residual = the edge-probe RECALL GAP** (the precision/tie MISS class: 0% catch even
  surfaced). This — and only this — is where a held-out / property-based backstop is irreplaceable.
  Measured recall miss here ≈ 1/4 categories (rough, n=4 tasks). **Build the held-out backstop scoped to
  the recall-miss class, not as a primary mechanism** — consistent with the program's standing "do NOT
  build held-out as primary" guardrail.

## Caveats
- **n=121 across 4 NI tasks + 1 control, 3 tiers, 3 reps.** Powered relative to N17/corpus but still a
  small task set; recall-miss rate (≈25%) rests on 4 categories — directional.
- **Rep 2–3 model attribution is by dispatch order** of 18 parallel subagents; one R3 block was
  ambiguous (showed `insufficient_spec` in a slot that shouldn't offer it) and was **excluded** rather
  than mis-recorded (haiku-narrow has 2 reps not 3). The effects are large and monotone, robust to a
  single mis-slotted block. Rep 1 (n=42) is fully attributed and shows the same pattern alone.
- **Two contamination corrections applied mid-run** (recorded, not hidden): (1) task identity leaked via
  file *paths* (`graphemes`/`stable-sort`/`INFERABLE`) — fixed by opaque IDs t1–t5 + a private mapping;
  (2) defective code carried explanatory comments ("Plausible-wrong… Fails held-out") — stripped. Same
  contamination class the corpus README documents for task 01. Rep-0 (pre-fix) discarded.
- **Inspection-only** verifiers (no code execution), matching N17.
