# Plan→Execute interface determinism — do independent waves integrate?

**Date:** 2026-06-24 · **Status:** RUN (design-only executor subagents, isolated). **Stage:** plan → execute.
**Substrate:** one CSV-export plan, unpinned vs interface-pinned. **Tier:** sonnet.
**Reproduce:** `node grade.mjs` · `node --test grade.test.mjs` (recomputes 0/9 vs 9/9 from `outputs.tsv`).

> A *completely different* thread from the memory-ledger work, and non-verifier. GSD executes a plan's
> tasks in **waves**, often in separate executor contexts. When two tasks share an artifact (task 1
> creates a helper; task 3 calls it), **does the plan pin the interface tightly enough that independent
> executors integrate** — or do they each invent a different path/name and produce a broken seam?

## Why this matters to a GSD user
GSD's wave/parallel execution is a headline feature. But a plan that says *"create a CSV helper"* and
*"wire the button to the helper"* leaves the **shared interface** (file path + exported symbol) implicit.
If task 1 and task 3 run in different executor contexts, each picks its own name — and the import doesn't
resolve. This is a silent, blame-free integration failure that the plan, not the executor, caused.

## Method
The helper-author (task 1) and button-author (task 3) are run as **independent, design-only** subagents
(no file reads/writes — see methodology note) — each reports the interface it *would* create/consume from
the plan text alone. 3 helper-authors × 3 button-authors = 9 cross-wave pairs per arm. A pair **integrates**
iff the button's import resolves to the helper's module (alias/relative/src-rooted paths normalized) AND
calls the helper's exported symbol. Two arms: **unpinned** plan vs **pinned** plan (adds an explicit
interface contract: `export function toCsv(rows: ReportRow[]): string` from `apps/web/src/lib/csv.ts`).

## Findings

| arm | helper interfaces (3 independent) | button assumptions (3 independent) | integrating pairs |
|---|---|---|---|
| **unpinned** | `utils/reportsCsv:serializeReportsToCsv` · `utils/exportCsv:exportToCsv` · `lib/exportCsv:serializeReportRowsToCsv` | `utils/csv:toCSV` · `utils/csvSerializer:serializeReportsToCsv` · `utils/csvHelper:serializeToCSV` | **0 / 9 (0%)** |
| **pinned** | all `lib/csv:toCsv` | all `@/lib/csv:toCsv` | **9 / 9 (100%)** |

- **Unpinned: every cross-wave seam breaks.** 3 distinct paths and 3 distinct names on each side; not one
  (helper, button) pair both resolves the path and matches the symbol. The lone name collision
  (`serializeReportsToCsv`) still mismatches on path. **Arity (`rows`) was the only stable thing.**
- **Pinned: total convergence.** An explicit interface contract in the plan → all six executors agree on
  path, symbol, and call site → 9/9 integrate.

## Interpretation — the plan, not the executor, owns the seam
The executors are individually competent; the divergence is **pure under-specification**. A natural-language
plan radically under-determines the interface of a shared artifact, and independent waves resolve that
freedom *incompatibly*. This is invisible in single-context execution (one agent remembers its own name)
and only bites in the multi-wave/parallel regime GSD promotes — exactly where it's hardest to debug.

## GSD-core implementation (what to build) — non-verifier
1. **Plan-phase: emit an interface contract for every cross-task shared artifact.** When the plan-checker
   detects that task B consumes an artifact task A produces, require the plan to pin **path + exported
   signature** (the `## Interface contract` block). This is a plan-completeness gate, not a verifier.
2. **A deterministic "shared-seam pinned?" check.** For each symbol referenced across tasks, assert the
   plan names its module + signature once. Cheap, CI-able (the `grade.mjs` normalization is the core).
3. **Relation to N28 (`files_modified`).** N28 reconciles *which files* changed; this pins *the interface
   at the boundary between files* — the complementary half. Together they close the plan→execute seam.

## Caveats
- n = 3×3 per arm, one plan, one tier — direction-finding (program norm). The 0%↔100% gap is large and
  the mechanism (under-specification) is clear, but magnitude on richer interfaces is unmeasured.
- Design-only proxy: executors *report* the interface rather than writing it. The first (file-writing) run
  confirmed the same divergence in real code (`utils/exportCsv:rowsToCsv` vs `utils/csvExport:serializeReportsToCsv`)
  before it was discarded for contamination (below).

## Methodology note (caught + corrected)
The **first** run let executors actually write files into the repo. They (a) **polluted the working tree**
(`apps/web/...`) and (b) **read each other's writes** through the shared filesystem — so "convergence" was
just later agents reading an earlier agent's file, not independent agreement. Both were fixed: the pollution
was removed, and the experiment was re-run **design-only** (no file I/O, `tool_uses=0`), restoring true
independence. (Third methodology catch in this program after the ground-truth-comment leak and the
executor-reads-the-harness confound — isolation is the recurring failure mode of agent experiments.)
