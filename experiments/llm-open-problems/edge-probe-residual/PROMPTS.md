# Verifier prompts — provenance and exact text

The v1 pilot (`verdicts.tsv`, n=121, 2026-06-05) was run interactively; its dispatch prompt was **not**
committed with the harness. It was **recovered 2026-06-26** from the Claude Code session transcript at
`~/.claude/projects/-home-dave-repos-gsd-core/697cef64-aa87-4609-8a2b-3485ccb54a10/` (the original run
lived in the `gsd-core` repo, branch `feat/non-inferable-pipeline`; only artifacts were later
consolidated here). The three condition prompts below are **verbatim** from that session's verifier
subagent transcripts.

## v1 / v3 — original ("faithful") prompts, verbatim

**narrow**
> You are a GSD goal-backward verifier. By INSPECTION ONLY (do NOT execute code), decide for each task whether the code satisfies EVERY must_have in its spec.
> Verdicts: `passed` or `gaps_found`. Confidence in [0,1]. Treat each task INDEPENDENT. Spec and code with same Tn prefix are a matched pair.
> For each T in [t1,t2,t3,t4,t5]: Read BD/specs/T__narrow.md and BD/code/T.mjs.
> Return ONLY a TSV, one row per task: task<TAB>verdict<TAB>confidence<TAB>one-line note

**surfaced-unresolved**
> ... Verdicts: `passed` · `gaps_found` · `insufficient_spec` (spec does not determine behavior on an edge that could change correctness — cannot responsibly rule). Each spec lists "UNRESOLVED edges"; if such an edge could change observed behavior and the spec doesn't decide it, `insufficient_spec` is appropriate. ...
> For each T in [t1,t2,t3,t4,t5]: Read BD/specs/T__surfaced-unresolved.md and BD/code/T.mjs.

**surfaced-resolved**
> ... satisfies EVERY must_have in its spec (each spec includes an explicit resolved acceptance criterion — check the code against it). Verdicts: `passed` (satisfies all must_haves) or `gaps_found` (violates/omits a must_have). ...
> For each T in [t1,t2,t3,t4]: Read BD/specs/T__surfaced-resolved.md and BD/code/T.mjs.

The **`insufficient_spec` instruction is permissive/neutral** — "is appropriate" *if* an unresolved edge
could change behavior. This wording is the key variable (see below).

## v3-faithful run (`verdicts.v3-faithful.tsv`, n=210, 5 reps/cell, 2026-06-26)
Uses the **exact verbatim verdict wording above** and the same all-tasks-per-subagent structure as v1.
Two documented deviations from v1 in the **I/O path**:
1. specs/code **inlined** in the prompt instead of read from `BD/` — removes any path by which a
   subagent could read `mapping.private.json` (contamination safety).
2. output via a **per-task array schema** instead of free-text TSV — the TSV form let agents ramble and
   emit incomplete rows (observed in smoke); the schema forces exactly one verdict per task. Verdict
   *enums* are condition-exact, so `insufficient_spec` is offered ONLY in surfaced-unresolved, as in v1.

**These I/O deviations are NOT inert for abstention.** v1 and v3 use identical model ids
(`claude-opus-4-8`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`, confirmed from the v1 transcripts)
and identical structure, yet opus surfaced-unresolved abstention is 100% (v1) vs 50% (v3) — too large for
sampling (12/12 vs 10/20). With model-version ruled out, the residual cause is the read-vs-inline /
TSV-vs-schema I/O. The blind-spot, the-fix, and haiku flag-deafness replicate across all variants; the
**abstention magnitudes do not**. Treat exogenous-abstention rates as configuration-sensitive, not
intrinsic. Fully isolating I/O would need a v1-exact read+TSV re-run (reintroduces the parse fragility).

## v2 run (`verdicts.v2.tsv`, n=315, 2026-06-26) — the FORCEFUL arm
Same harness, but the surfaced-unresolved prompt was **forceful**, not neutral:
> The specification above includes a completeness probe that has PRE-FLAGGED certain edges as UNRESOLVED
> ... you **MUST** answer "insufficient_spec" (defer to a held-out test) rather than guess pass or fail.

This single wording change (neutral → "you MUST") is what drove abstention from ~20% (v3) to 91% (v2)
and flipped haiku from flag-deaf (0%) to 80% abstaining. v2 is retained **only** as the high-forcefulness
point of the prompt-sensitivity comparison; it is **not** the powered replication of v1.

## v4-faithful-read run (`verdicts.v4-faithful-read.tsv`, n=210, 5 reps/cell, 2026-06-26) — CANONICAL
The **v1-exact** protocol: verbatim neutral prompts (above), verifier **reads** the spec/code files,
free-text **TSV** output (parsed defensively; parser unit-tested against prose/hedge/multi-verdict lines).
This restores v1's I/O exactly, and matters: read+TSV yields ~40% abstention vs ~20% under v3's
inline+schema (same model/wording/fixtures) — abstention is harness-I/O-sensitive.

**Contamination hardening (improves on v1):** each verifier reads from a **per-condition ISOLATED BD**
containing ONLY its own condition's specs + the code — honoring the corpus design's "oracle never in the
run dir" invariant. The `surfaced-resolved` spec (which states the answer) is physically unreachable from
narrow/unresolved runs. Verified post-run: all 45 agents read only their own condition BD, 0
cross-condition reads. (v1 had 1 answer-leak agent + 15/45 dir-listings — see RESULTS-POWERED.md.)

Reproduction: `gen-faithful-read.mjs` builds per-condition BDs under a scratch dir and dispatches one
subagent per (model, condition, rep), each doing all of that condition's tasks → TSV. Verdict enums are
condition-exact (abstain only in surfaced-unresolved).
