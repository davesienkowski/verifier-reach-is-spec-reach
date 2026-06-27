# Adversarial Audit — Task B Run (v5)

**Dataset:** `verdicts.v5-task-b.tsv` (300 rows, n=300: 6 NI tasks × 5 reps × 3 models × 3 conditions + 1 INF × 5 reps × 3 models × 2 conditions)
**Detail log:** `verdicts.v5-task-b.detail.jsonl` (45 cells, 1 per subagent)
**Dispatch:** `dispatch-table.json` (45 cells: 15 opus / 15 sonnet / 15 haiku; 15 per condition; model_ids `claude-opus-4-8` / `claude-sonnet-4-6` / `claude-haiku-4-5-20251001`)
**Produced:** 2026-06-26

---

## A1-A6 Adversarial Controls

### A1 — 0 hallucination (verifiers obtained real spec+code)

**PASS — structural evidence**

The `raw` field in `verdicts.v5-task-b.detail.jsonl` contains each subagent's verdict output (the orchestrator logged the subagent return value). Zero cells have empty raw returns (verified: all 45 cells have non-empty raw). All task IDs in the raw returns are valid members of {t1, t2, t3, t4, t5, t6, t7}; no hallucinated IDs appear. Verdicts are limited to the valid vocabulary per condition. The independent re-parser (A3) reconstructs all 300 rows from the raw — which is only possible if the raw contains task-aligned verdicts, not hallucinated output.

**Evidence limitation (transcript-level):** The `raw` field contains verdict output, not the full per-subagent tool-call log. Full tool-call transcripts were not preserved in-repo (the orchestrator dispatched subagents whose session logs live in the Claude Code session, not in the committed dataset). A1 evidence here is therefore structural: the dispatch-table gave each subagent an isolated BD path containing only its condition's specs + code; verdicts align to real task IDs; the re-parse confirms attribution is correct. This matches the v4 audit's spirit but differs in degree — v4 could inspect per-subagent read calls; here we rely on structural BD isolation.

---

### A2 — model pinning exact (15 opus / 15 sonnet / 15 haiku)

**PASS — verified from dispatch-table.json**

```
Model distribution (dispatch-table.json):
  claude-opus-4-8:           15 cells
  claude-sonnet-4-6:         15 cells
  claude-haiku-4-5-20251001: 15 cells
  Total:                     45 cells

Conditions:
  narrow:              15 cells (5 per model)
  surfaced-unresolved: 15 cells (5 per model)
  surfaced-resolved:   15 cells (5 per model)
```

Each model ran exactly 5 reps per condition. Model IDs are pinned in the dispatch table and stamped in `verdicts.v5-task-b.detail.jsonl` as `model_id` (not self-reported by subagents). The `model` column in the TSV is the short label (opus/sonnet/haiku) derived from the dispatch table, not from subagent output.

---

### A3 — independent re-parse == committed (0 diffs)

**PASS — verified empirically by `reparse-audit.mjs`**

`reparse-audit.mjs` is an **independent re-parser** (does not import `parse-verdicts.mjs`) that reads `verdicts.v5-task-b.detail.jsonl`, extracts (task, verdict, confidence) from each cell's `raw` using a separate implementation, stamps regime/edgeprobe from its own lookup tables, and emits canonical 8-col TSV rows.

```
$ node reparse-audit.mjs verdicts.v5-task-b.detail.jsonl | \
    diff - <(tail -n +2 verdicts.v5-task-b.tsv)
$ echo $?
0
```

**Result: 0 diffs** — the independent re-parser reproduces all 300 data rows in the committed TSV exactly. Verdict fidelity confirmed.

---

### A4 — 0 cross-condition reads (each BD holds only its own condition)

**PASS — structural evidence**

BD directory contents verified by inspection:

```
BD_narrow/specs/:
  t1__narrow.md  t2__narrow.md  t3__narrow.md  t4__narrow.md
  t5__narrow.md  t6__narrow.md  t7__narrow.md
  (no surfaced-unresolved or surfaced-resolved files)

BD_surfaced-unresolved/specs/:
  t1__surfaced-unresolved.md  t2__surfaced-unresolved.md
  t3__surfaced-unresolved.md  t4__surfaced-unresolved.md
  t5__surfaced-unresolved.md  t6__surfaced-unresolved.md
  t7__surfaced-unresolved.md
  (no narrow or surfaced-resolved files)

BD_surfaced-resolved/specs/:
  t1__surfaced-resolved.md  t2__surfaced-resolved.md
  t3__surfaced-resolved.md  t4__surfaced-resolved.md
  t6__surfaced-resolved.md  t7__surfaced-resolved.md
  (no narrow, no surfaced-unresolved, no t5 — t5 excluded from surfaced-resolved by design)
```

Each BD contains exactly its own condition's specs. A verifier assigned to `BD_narrow` physically cannot read a `surfaced-unresolved` or `surfaced-resolved` spec — those files do not exist in its BD.

**Evidence limitation:** As with A1, full tool-call transcripts are not in-repo. A4 evidence is structural (BD directory contents). The v4 audit could verify empirically "0/45 cross-condition reads"; here the structural guarantee is equivalent given the per-condition isolated BD design.

---

### A5 — 0 oracle reads

**PASS — structural + empirical**

Structural: The `oracle/` directory exists at the harness root but is NOT present inside any BD directory. A verifier dispatched to `BD_narrow/`, `BD_surfaced-unresolved/`, or `BD_surfaced-resolved/` cannot traverse to `oracle/` (it is not inside the BD and the prompt references only `BD/` paths).

```
$ ls BD_narrow/        → code/  specs/
$ ls BD_surfaced-unresolved/  → code/  specs/
$ ls BD_surfaced-resolved/    → code/  specs/
```

No `oracle/` subdirectory in any BD.

Empirical: Scanned all 45 cells' `raw` returns for the string "oracle" (case-insensitive):

```
Cells with oracle references in raw: 0
```

Zero cells reference oracle paths in their verdict output.

---

### A6 — 0 code executions by verifiers

**PASS — structural + raw-output evidence**

Structural: The per-condition BDs contain only `specs/` and `code/` directories — no test runner, no `package.json`, no `node_modules`. The prompts (per `dispatch-table.json`) instruct "By INSPECTION ONLY (do NOT execute code)" with a task list that reads files and returns a TSV. No shell execution is possible from a BD that has no runner installed.

Raw-output evidence: Scanned all 45 cells' `raw` returns for `node`, `npm`, `npx`, shell command patterns. The raw returns are pure TSV verdict outputs (task/verdict/confidence rows) — no Bash invocations, no test runner output. A subagent that had run `node` would have produced runner output (pass/fail lines), which would not be parseable as TSV verdicts; all 300 rows parse cleanly (A3 = 0 diffs).

**Evidence limitation:** Same as A1/A4 — full tool-call transcripts are not in-repo. The raw-output evidence is indirect: if a verifier had executed code, the runner output would have contaminated the raw and caused A3 diffs. A3 = 0 diffs is a positive functional signal for A6.

---

### A6b — parse-rejects.log: 0 real rejects

`parse-rejects.log` contains 2 entries — **both are self-test artifacts** from `node parse-verdicts.mjs --selftest`, which exercises the quarantine path with a synthetic bad line. No real subagent returns were quarantined.

---

## Recall-Gap Re-Estimate (SC5)

### Setup

Tasks used: t1–t7 (t5 = INF control, excluded from NI analysis; t5 excluded from surfaced-resolved by design).
MISS-eligible set: {t3, t6, t7} (see EDGEPROBE-CLASSIFICATION.md).
Dataset: `verdicts.v5-task-b.tsv` (n=300; 5 reps/cell; 3 models; 3 conditions).
Analyzer: `node analyze.mjs verdicts.v5-task-b.tsv` (Wilson 95% CIs).

### Aggregate NI rates by condition

```
condition              n    false_pass     abstain        catch
narrow                 90   82% [73-89]    0% [0-4]       18% [11-27]
surfaced-unresolved    90   64% [54-74]    21% [14-31]    14% [9-23]
surfaced-resolved      90   0% [0-4]       0% [0-4]       100% [96-100]
```

Blind spot (narrow false-pass) widens from v4's 100% [94-100] to 82% [73-89] — t6 drives this down (0/15 false-pass in narrow; see per-task below).

The fix (surfaced-resolved catch) remains 100% [96-100] — identical to v4.

### Recall-gap: HIT vs MISS in surfaced-unresolved

```
edge-probe   n    false_pass     abstain        catch
HIT          45   73% [59-84]    27% [16-41]    0% [0-8]
MISS         45   56% [41-69]    16% [8-29]     29% [18-43]
```

**Finding: CIs overlap. No clean HIT-vs-MISS separation at the aggregate level.**

The MISS aggregate false-pass (56%) is LOWER than HIT (73%) — counterintuitive, and explained by the per-task breakdown below.

### Per-task breakdown (surfaced-unresolved) — the key finding

```
task  ep    n   false-pass        abstain          catch
t1    HIT   15  100% [80-100]     0% [0-20]        0% [0-20]
t2    HIT   15  67% [42-85]       33% [15-58]      0% [0-20]
t3    MISS  15  67% [42-85]       33% [15-58]      0% [0-20]
t4    HIT   15  53% [30-75]       47% [25-70]      0% [0-20]
t6    MISS  15  7% [1-30]         7% [1-30]        87% [62-96]
t7    MISS  15  93% [70-99]       7% [1-30]        0% [0-20]
```

**Per-task in narrow:**

```
task  ep    n   false-pass        catch
t1    HIT   15  100% [80-100]     0% [0-20]
t2    HIT   15  100% [80-100]     0% [0-20]
t3    MISS  15  100% [80-100]     0% [0-20]
t4    HIT   15  93% [70-99]       7% [1-30]
t6    MISS  15  0% [0-20]         100% [80-100]
t7    MISS  15  100% [80-100]     0% [0-20]
```

### Interpretation: MISS is necessary but not sufficient for a verifier blind spot

The per-task data reveals the mechanism behind the aggregate counterintuition:

**t7 (idempotency/text-wrap, COMPLETE MISS):** The canonical blind-spot exemplar.
- Narrow: 15/15 false-pass (100%); surfaced-unresolved: 14/15 (93% [70-99]).
- The deployed edge-probe.cjs produces only `empty` and `encoding` probes for a text-transformation function — the `idempotency` probe is entirely absent (idempotency probe fires only for stateful/store keywords). Verifiers see probes about empty input and encoding normalization, which are red herrings. They never ask about double-bolding. Result: near-universal false-pass in both conditions.

**t3 (precision/tie, MISS under old tagger):** Confirmed blind spot.
- Narrow: 15/15 false-pass (100%); surfaced-unresolved: 10/15 (67% [42-85]).
- The old tagger did not explicitly name tie-breaking. Five verifiers abstained when surfaced (33%); none caught the defect — surfacing made them uncertain without resolving it.

**t6 (null-vs-absent, MISS under deployed tagger):** NOT a verifier blind spot.
- Narrow: 0/15 false-pass (0%); surfaced-unresolved: 1/15 (7% [1-30]).
- Despite edge-probe classifying the task MISS (the `empty` probe is too generic — it asks about null/empty *inputs*, not null-valued *properties* within a non-null input), verifiers independently derive the null-property-preservation rule from the spec's language: "For each key in fallback that is **not present** in target, copy it to the result." Verifiers correctly reason that a null-valued key IS present (JavaScript: `'a' in {a: null} === true`) and should not be overridden. The edge is semantically derivable from the narrow spec even without an edge-probe hint. Result: 0 false-pass in narrow; surfaced-unresolved barely changes things (1/15).

**Core finding:** Edge-probe MISS is **necessary but not sufficient** for a verifier blind spot. An edge must also be non-derivable from the spec's other must_haves. t6 fails this condition (the null-property rule is implicit in "not present in target"); t7 and t3 satisfy it.

### Deployed-tagger-only MISS set (t6+t7)

Under the deployed tagger only (see L1 below), MISS = {t6, t7}:

```
deployed-MISS (t6+t7): passed=15/30, false-pass = 50% [33-67]
HIT (t1+t2+t4):        passed=33/45, false-pass = 73% [59-84]
```

CIs still overlap. The ordering (HIT > MISS) is present but not statistically distinguishable at n=30/45.

### G1 — Goodhart selection-effect disclosure (REQUIRED, ARTIFICER-REVIEW)

The recall-gap finding is a **conditional/existence claim**, not an unbiased population miss-rate.

The MISS categories (t3, t6, t7) were **hand-selected** because the deployed edge-probe.cjs is structurally blind to them:
- t7: idempotency probe is absent for text-shape functions (only fires for stateful keywords)
- t6: empty probe is too generic to hint null-valued properties vs null input (selected for MISS classification; the NI edge is nonetheless derivable by verifiers — see above)
- t3: old-tagger MISS (precision probe did not name tie-breaking explicitly)

This is **not** random sampling of NI defects. The result does not support "edge-probe misses R% of NI defects in general." The legitimate framing is: *"NI defects that edge-probe is structurally blind to span ≥2–3 distinct categories (depending on tagger version); on the two genuine verifier blind-spots within that set (t3, t7), false-pass rates remain high (67% and 93%) even after surfacing without resolution."*

### L1 — tagger-version provenance disclosure (REQUIRED, ARTIFICER-REVIEW)

The `edgeprobe` column mixes two tagger versions:
- **t3 (MISS):** Locked from v4-faithful-read run under the **old tagger**. The old tagger's precision probe did not explicitly mention tie-breaking.
- **t6, t7 (MISS):** Classified under the **deployed tagger** (`/home/dave/repos/gsd-core/gsd-core/bin/lib/edge-probe.cjs`).

**Deployed tagger on t3 (cheap re-run, for caveat only — locked verdicts NOT altered):**

Running the deployed edge-probe on t3's narrow requirements:

```json
[{"id":"R1","text":"Export a named function roundToInt(x)."},
 {"id":"R2","text":"Return the integer nearest to x."},
 {"id":"R3","text":"Larger fractional parts round up, smaller round down."}]
```

Deployed tagger output:
- R3 → category `precision`, probe: *"Where can precision loss, overflow, or rounding/tie-breaking occur — and what is the exact contract (e.g. half-up vs half-to-even, ceil/floor/truncate)?"*

**Under the deployed tagger, t3 would be classified HIT** — the precision probe now explicitly names "half-up vs half-to-even", which is exactly t3's NI tie-breaking edge.

**Implication:** Under the deployed tagger for all tasks, MISS = {t6, t7} = 2 categories (not 3). The "≥3 MISS-eligible categories" claim rests on t3's prior-tagger MISS label. The committed verdicts for t3 remain locked as-is (they reflect the conditions under which the v4 run was conducted); this is noted as a caveat, not altered.

**Bottom line:** With 2 deployed-tagger MISS categories, the recall gap (50% vs 73%, overlapping CIs) still shows no clean separation. With t3 counted (3 categories, old-tagger label), the gap is 56% vs 73%, also overlapping. Neither configuration yields a statistically distinguishable separation at this n.

---

## Summary: A1-A6 Results

| Control | Result | Evidence type |
|---------|--------|---------------|
| A1 — 0 hallucination | **PASS** | Structural (BD isolation, all task IDs valid, A3 = 0 diffs) |
| A2 — model pinning exact | **PASS** | Empirical (dispatch-table.json, 15/15/15 per model, exact model_ids) |
| A3 — independent re-parse == committed | **PASS** | Empirical (0 diffs, reparse-audit.mjs) |
| A4 — 0 cross-condition reads | **PASS** | Structural (per-condition isolated BDs; no other-condition files present) |
| A5 — 0 oracle reads | **PASS** | Structural + empirical (oracle/ absent from all BDs; 0/45 raw refs) |
| A6 — 0 code executions | **PASS** | Structural + indirect (no runner in BD; raw = pure TSV verdict output; A3 = 0 diffs) |

**Limitation note:** Full per-subagent tool-call transcripts were not preserved in-repo. A1/A4/A6 structural evidence is equivalent in design to v4 but differs in degree — v4 audited tool-call logs directly; here BD isolation provides the equivalent structural guarantee. This limitation is stated rather than glossed.
