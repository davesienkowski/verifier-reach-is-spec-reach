# edge-probe-residual

Does the (shipped) edge-probe close the non-inferable verifier blind spot, and is a separate
abstention/held-out lane still needed? Gating experiment for research-question Q9 and the
exogenous-verification primitive. David's experiment (AI-assisted).

## Layout
- `specs/tN__{narrow,surfaced-unresolved,surfaced-resolved}.md` — 3 spec states per task (opaque IDs).
- `code/tN.mjs` — defective impl under review (comments stripped; ground truth in mapping).
- `mapping.private.json` — opaque-ID → corpus-task map (NOT shown to verifier subagents).
- `resolved-criteria.json` — the authored "resolved edge" acceptance criteria.
- `build-specs.mjs` — regenerates spec variants (runs the real `edge-probe.cjs` for the unresolved tag).
- `verdicts.tsv` — 121 verdicts (opus/sonnet/haiku × 3 conditions × 3 reps).
- `analyze.mjs` — recomputes the RESULTS tables. `RESULTS.md` — findings.

## Run
```bash
node ../../../gsd-core/... # build:lib first if edge-probe.cjs absent: (repo root) npm run build:lib
node build-specs.mjs   # regenerate specs (needs edge-probe.cjs)
node analyze.mjs       # recompute tables from verdicts.tsv
```

## Headline
Resolve a surfaced edge → verifier catches 94–100% (the fix). Exogenous abstention from the real
edge-probe tag is tier-gated (opus 100% honest, haiku 0%). The irreducible residual = the edge-probe
RECALL GAP (0% catch on the precision/tie MISS task) — the only place a held-out backstop is irreplaceable.
