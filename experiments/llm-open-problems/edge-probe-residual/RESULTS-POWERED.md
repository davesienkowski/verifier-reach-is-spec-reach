# Powered results — edge-probe-residual (Phase 6, 2026-06-26)

Powered + contamination-corrected follow-up to the v1 pilot (`RESULTS.md`, n=121). Four datasets, all
reproducible via `node analyze.mjs <file>` (Wilson 95% CIs). **Read `PROMPTS.md` first** — verifier
prompt wording AND harness I/O are both load-bearing variables here.

| dataset | file | n | prompt wording | I/O | role |
|---|---|---|---|---|---|
| v1 pilot | `verdicts.tsv` | 121 | neutral (recovered) | read+TSV | pilot; partial contamination (below) |
| v2 forceful | `verdicts.v2.tsv` | 315 | **forceful** ("you MUST abstain") | inline+schema | prompt-sensitivity arm |
| v3 inline | `verdicts.v3-faithful.tsv` | 210 | neutral (verbatim) | inline+schema | I/O-sensitivity arm |
| **v4 read★** | `verdicts.v4-faithful-read.tsv` | 210 | neutral (verbatim) | **read+TSV, per-condition isolated BD** | **canonical → use for the paper** |
| **v5 Task B** | `verdicts.v5-task-b.tsv` | 300 | neutral (verbatim) | read+TSV, per-condition isolated BD | widened NI task set (t1-t7); recall-gap re-estimate |

**v4 is the canonical powered dataset:** it matches v1's exact protocol (verbatim prompt, verifier
reads files, TSV) AND fixes v1's contamination exposure (per-condition oracle quarantine; verified:
all 45 agents read only their own condition BD, 0 cross-condition reads). All four datasets: 42 cells,
verdict-vocabulary gate clean, INF over-abstain 0%. Numbers independently recomputed from raw TSVs.

**v5 (Task B)** extends the NI task set to t1-t7 (t6: null-vs-absent, t7: idempotency/text-wrap)
under the identical v4 protocol (same prompts, isolated BDs, inspection-only, 5 reps/cell, 45 cells)
and re-estimates the recall-gap over ≥3 MISS-eligible categories. See §"Task B" below.

## Four-way headline comparison (Wilson 95% CI)

| metric | v1 pilot | v2 forceful | v3 inline | **v4 read★** |
|---|---|---|---|---|
| narrow NI false-pass (blind spot) | 94% [80–98] | 92% [84–96] | 98% [91–100] | **100% [94–100]** |
| surfaced-resolved NI catch (the fix) | 94% [82–98] | 100% [96–100] | 100% [94–100] | **98% [91–100]** |
| surfaced-unresolved abstain (overall) | 47% [32–63] | 91% [83–95] | 20% [12–32] | **40% [29–53]** |
| opus abstain | 100% [76–100] | 100% [93–100] | 50% [30–70] | **65% [43–82]** |
| sonnet abstain | 42% [19–68] | 80% [58–92] | 10% [3–30] | **55% [34–74]** |
| haiku abstain | 0% [0–24] | 80% [58–92] | 0% [0–16] | **0% [0–16]** |
| recall-MISS false-pass | 44% [19–73] | 0% [0–16] | 80% [55–93] | **53% [30–75]** |
| recall-HIT false-pass | 30% | 11% | 78% | **58% [43–71]** |
| INF over-abstain (control) | 0% | 0% | 0% | **0% [0–11]** |

## Robust across every variant (prompt- and I/O-independent)
1. **Non-inferable blind spot** — narrow false-pass 92–100%. Verifiers confidently pass code wrong on
   an unstated edge.
2. **The fix** — surfaced-resolved catch 98–100% across all tiers. Writing the edge into the spec
   converts blind-spot → catch.
3. **No over-abstention** on stated-rule defects (INF control 0% everywhere).
4. **haiku flag-deafness** — 0% abstain under every *neutral* prompt (v1/v3/v4). Only the *forceful*
   prompt (v2) makes haiku abstain (80%).

## Replicates under matched methodology (v4 ≈ v1)
5. **Tier-gated honest abstention** — v4: opus 65% > sonnet 55% > haiku 0% (overall 40%, vs v1 47%,
   overlapping CIs). The pilot's central qualitative claim holds once I/O is matched and contamination
   removed.

## Revised vs the pilot (powered + clean)
6. **"opus 100% honest abstention" is not robust** → ~65% (v4). v1's 100% rested on n=12 and included
   the one contamination-exposed agent. Report the tier *order*, not the 100%.
7. **Residual does NOT concentrate on the recall-MISS task** → v4 HIT 58% ≈ MISS 53% (indistinguishable);
   v1's 44%-vs-30% was small-n noise. Drop the concentration claim or gate it behind a wider task set.

## Two sensitivity findings (new, honest, publishable)
8. **Harness-I/O sensitivity.** Same model, wording, fixtures: inline+schema (v3) → 20% abstain;
   read+TSV (v4) → 40%. Reading the files roughly *doubles* abstention vs receiving them inline. The
   absolute abstention rate is not a stable property of the model; it depends on the verification setup.
9. **Prompt-wording sensitivity.** Neutral (v4 40%) vs forceful "you MUST abstain" (v2 91%); haiku
   0% → 80%. Exogenous abstention can be dialed by instruction forcefulness.

Together (8)+(9) reinforce the program guardrail: **do not rely on abstention as a primary mechanism**
— its rate is configuration-dependent; the irreducible residual needs a held-out backstop.

## Contamination: v1 exposure and the v4 correction
The original corpus design (`gsd-core` `feat/non-inferable-pipeline`, `CORPUS-DESIGN.md` +
`noninferable-corpus/`) enforces a **hard invariant: the oracle never enters the verifier's run dir**,
plus opaque task IDs, stripped self-labeling comments, a `validate.mjs` gate (`defective` must pass
visible but FAIL heldout), and a per-spec non-inferability audit. `edge-probe-residual` inherits the
opaque-ID + stripped-comment controls (verified present).

**But v1's read-mode dispatch put all three conditions in one readable BD**, and the
`surfaced-resolved` spec *states the answer*. Audit of the v1 session transcripts:
- **1 of 45** surfaced-unresolved verifiers read the `surfaced-resolved` (answer) + `narrow` specs.
- **15 of 45** listed the BD directory (filename exposure of the condition variants).

**v4 corrects this**: per-condition **isolated BDs** (each verifier's BD contains only its own
condition's specs + code; the resolved answer is physically unreachable from narrow/unresolved).
Verified post-run: 0 cross-condition reads across all 45 agents. v4's reproduction of v1's qualitative
pattern means the pilot's conclusions **survive contamination correction**.

### v4 integrity audit (transcript-level, adversarial)
The v4 run was audited against its 45 subagent transcripts: **no hallucination** (every agent obtained
its spec+code — 31 via the Read tool, 14 via `Bash cat`); **model pinning exact** (15 opus / 15 sonnet
/ 15 haiku); **verdict fidelity** — an *independent* re-parser of the raw transcripts matches the
committed `verdicts.v4-faithful-read.tsv` exactly (210/210, 0 diffs); **no contamination** (0/45
cross-condition reads); **inspection-only honored** (0 code-execution calls across 55 Bash commands —
only `ls`/`cat`/`find`). Access method varied (Read vs cat) but content was identical, so verdicts are
unaffected.

Note: the consolidated `edge-probe-residual` harness now ships oracle files + `validate.mjs` for
all tasks. **`node validate.mjs` passes locally** for t1–t4 + t6 + t7 (t5 EXEMPT — INF control).
Non-inferability is no longer *only* by reference: the harness self-validates. The opaque-ID lineage to the original non-inferable corpus is kept private in `mapping.private.json` (excluded from this public artifact).

### Methodology controls vs the original run (transcript-audited)
Audited the original 2026-06-05 session (`gsd-core` `697cef64`). The original verifiers had **weaker**
controls than these powered runs — nothing was "missed" in the new runs; they are equal-or-stronger on
every axis:

| control | v1 original | v2/v3 inline | v4 read (canonical) |
|---|---|---|---|
| inspection-only | soft prompt, **unenforced — 1/45 ran `node`** | tool-free (no exec possible) | verified 0 executions |
| tool restriction | none (general-purpose, Read+Bash) | none needed (inline) | full tools but isolated |
| filesystem isolation | **none** (shared dir) | n/a (inline) | per-condition isolated BD |
| opaque task IDs | **partial** (rep1 descriptive name-leak; reps2–5 `t1–t5`) | full `t1–t5` | full `t1–t5` |
| verbatim prompt wording | — | sensitivity arms | verbatim per-condition |
| INF control · real edge-probe specs · tier dispatch · confidence | yes | yes | yes |
| deterministic attribution | by spawn tag, no isolation | dispatch table | dispatch table + isolation |

**v1 contamination exposure** (transcript audit): 1/45 verifiers read the `surfaced-resolved` answer
spec; 15/45 listed the BD dir; 9/45 (rep1) used descriptive filenames that leak the edge (e.g.
a descriptive task name telegraphs the rule). v4 eliminates all three (isolated BD, consistent opaque
IDs, verified 0 cross-condition reads). Worktrees/`isolate.mjs` in that session belonged to the
trust-ledger *executor* experiments, not the inspection-only verifiers — v4's per-condition BD ports that
isolation discipline to the verifier for the first time.

### Non-inferability re-validated on the actual fixtures
`noninferable-corpus/validate.mjs` passes for all corpus tasks; and the **exact t1–t4 defective fixtures
used by the verifiers** were cross-run against the mapped corpus visible + held-out suites:

| fixture | visible | held-out | non-inferable? |
|---|---|---|---|
| t1 | PASS | FAIL | ✅ |
| t2 | PASS | FAIL | ✅ |
| t3 (recall MISS) | PASS | FAIL | ✅ |
| t4 | PASS | FAIL | ✅ |

Every NI fixture's defect is provably invisible to the spec's visible tests yet caught by the held-out
edge test — the formal non-inferable property, now confirmed locally (not just by reference). t5 is the
INF control (defect on a stated rule) — not a non-inferable probe by design.

## Implications for the camera-ready paper
- **Use `verdicts.v4-faithful-read.tsv` for Tables T1–T3.** (Not v2/v3.)
- **Keep & CI-tighten** the blind spot and the-fix results.
- **Keep tier-gated abstention** (opus 65% > sonnet 55% > haiku 0%), but **drop "opus 100%"**.
- **Drop the recall-MISS-concentration claim** (not replicated — even with ≥3 MISS categories,
  HIT 73% ≈ MISS 56% with overlapping CIs; and MISS false-pass is pulled down by t6 which is
  caught by verifiers, further complicating any simple "MISS → blind spot" narrative).
- **If reporting the recall-gap finding (Task B):** frame as per-task — t3 and t7 are genuine
  blind-spots (67-93% false-pass in surfaced-unresolved); t6 is MISS by edge-probe but caught
  by verifiers. Lead with the mechanism: MISS is necessary but not sufficient; the edge must also
  be non-derivable from the remaining spec must_haves.
- **Add** the I/O- and prompt-sensitivity of abstention as an honest methodological result, and the
  v1-contamination disclosure + v4 correction.
- **Caveats to keep:** 5 reps/cell (wider CIs); single ecosystem; recall-gap mechanism (per-task,
  not aggregate) is the honest finding; non-inferability now self-validated locally by `validate.mjs`
  (replaces the by-reference-only caveat); tagger-version mixed provenance (L1: t3 old-tagger).

## Task B (v5, 2026-06-26) — widened NI task set + recall-gap re-estimate

### New tasks

| Task | Category | edge-probe | NI-gate | Note |
|------|----------|------------|---------|------|
| t6 | null-vs-absent (`defaults`) | **MISS** (deployed tagger: `empty` probe too generic) | PASS locally | Verifiers catch it in narrow (see below) |
| t7 | idempotency/text-wrap (`bold`) | **MISS** (complete: `idempotency` probe absent for text-shape) | PASS locally | Genuine verifier blind spot |

Both new tasks pass `node validate.mjs` locally (defective+visible PASS, defective+heldout FAIL).
t5 is the INF control — EXEMPT from the non-inferable gate (defect on a stated rule).

### Recall-gap re-estimate (surfaced-unresolved, NI tasks)

Full output: `node analyze.mjs verdicts.v5-task-b.tsv` (Wilson 95% CIs)

```
edge-probe   n    false_pass     abstain        catch
HIT          45   73% [59-84]    27% [16-41]    0% [0-8]
MISS         45   56% [41-69]    16% [8-29]     29% [18-43]
```

**CIs overlap → no clean HIT-vs-MISS separation at the aggregate level.** MISS false-pass (56%)
is lower than HIT (73%), which is counterintuitive and explained by the per-task breakdown.

### Per-task finding (the key result)

```
task  ep    n   false-pass (surfaced-unres)  false-pass (narrow)  Interpretation
t3    MISS  15  67% [42-85]                  100% [80-100]        Blind spot (old tagger)
t6    MISS  15  7%  [1-30]                   0%  [0-20]           CAUGHT by verifiers (both conditions!)
t7    MISS  15  93% [70-99]                  100% [80-100]        Genuine blind spot (complete MISS)
```

**Core finding:** Edge-probe MISS is **necessary but not sufficient** for a verifier blind spot. The
specific NI edge must also be non-derivable from the spec's other must_haves.

- **t7 (idempotency):** `idempotency` probe entirely absent for text-shape functions → verifiers
  never ask about double-bolding → 15/15 false-pass in narrow, 14/15 in surfaced-unresolved.
  The clean blind-spot exemplar.
- **t3 (precision/tie):** old-tagger MISS; narrow 15/15 false-pass; surfaced-unresolved 10/15
  (surfacing creates uncertainty without resolving it). Confirmed blind spot.
- **t6 (null-vs-absent):** deployed-tagger MISS (empty probe too generic), but verifiers
  independently derive null-property-preservation from "for each key **not present** in target"
  semantics even in narrow. 0/15 false-pass in narrow; 1/15 in surfaced-unresolved. Not a
  verifier blind spot — the edge is semantically derivable.

### G1 — Goodhart selection-effect disclosure

This is a **conditional/existence** claim, not an unbiased population miss-rate. The MISS categories
were **hand-selected** because the deployed edge-probe.cjs is structurally blind to them (t7: no
idempotency probe for text-shape functions; t6: empty probe too generic; t3: old-tagger). The result
does not support "edge-probe misses R% of NI defects in general."

Legitimate framing: *"NI defects edge-probe is structurally blind to span ≥2-3 distinct categories;
within that set, the two genuine verifier blind-spots (t3, t7) sustain 67-93% false-pass in
surfaced-unresolved."*

### L1 — tagger-version provenance

The `edgeprobe` column mixes tagger versions:
- **t3 MISS:** locked from v4 under the old tagger. Deployed tagger re-classifies t3 as **HIT**
  (precision probe now explicitly names "half-up vs half-to-even"). Under deployed tagger only,
  MISS = {t6, t7} = 2 categories. Locked verdicts NOT altered.
- **t6, t7 MISS:** classified under the deployed tagger.

### Non-inferability: local self-validation (replaces the by-reference caveat)

`node validate.mjs` passes for t1–t4 + t6 + t7 (t5 EXEMPT — INF control). This harness now
self-validates non-inferability locally (defective+visible PASS, defective+heldout FAIL for each
NI task). The prior "by-reference to `noninferable-corpus`" note still applies to the mapping
provenance (t1-t4 from `gsd-core` pipeline), but local validation no longer depends on it.

### v5 integrity audit (AUDIT-task-b.md)

All six controls PASS (see `AUDIT-task-b.md` for evidence):

| Control | Result |
|---------|--------|
| A1 — 0 hallucination | PASS (structural: BD isolation, valid task IDs, A3=0 diffs) |
| A2 — model pinning exact | PASS (15 opus / 15 sonnet / 15 haiku; exact model_ids) |
| A3 — independent re-parse == committed | PASS (0 diffs; reparse-audit.mjs) |
| A4 — 0 cross-condition reads | PASS (structural: per-condition isolated BDs) |
| A5 — 0 oracle reads | PASS (structural + empirical: oracle/ absent from BDs; 0/45 raw refs) |
| A6 — 0 code executions | PASS (structural + indirect: no runner in BD; raw=pure TSV; A3=0 diffs) |

Note: full per-subagent tool-call transcripts not in-repo; A1/A4/A6 structural evidence
equivalent to v4 by design, differs in transcript-level access (stated per honest-rails).

## Task B complete (2026-06-26)
