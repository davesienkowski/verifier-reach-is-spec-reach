# N1 → production: running verifier-reach inside `gsd-verifier` on real `.planning` specs

This is the implementation spec for turning the validated experiment (`RESULTS.md`) into an optional
verify-phase instrument. It is written against GSD's real artifacts so a later session can build it
without re-deriving anything. The experiment is the *proof of concept and the calibration*; this is
the *adoption contract*.

## Where it plugs in

After `gsd-verifier` returns a phase-level **PASS** (it is pointless to measure reach on a phase that
already failed), run a reach pass and append a `## Verifier Reach` section to the phase
`NN-VERIFICATION.md`. Gate it behind a new config flag `workflow.verifier_coverage` (advisory,
default **off** — it spends N extra verifier runs). Never blocks; it is a *thin-spec warning*, like
the ambiguity gate and the edge-probe.

## Inputs (all already exist in a phase)

From `NN-MM-PLAN.md` frontmatter (confirmed schema, phase 07 example):

```yaml
must_haves:
  truths:        # the goal-backward checkable units the verifier reasons against
    - "An owner with no linked bank resolves to 'connect-bank'; ..."
  artifacts:
    - path: "packages/shared/src/onboarding/next-step.ts"   # ← MUTATION TARGETS
      contains: "export function nextOnboardingStep"
files_modified: [ ... ]                                     # ← scope of mutation
```

Plus: the **passing implementation** (the SUT), and the phase's **existing test suite** (the
"visible suite" — used as the survival filter below).

## The pipeline (mirrors the experiment harness 1:1)

1. **Generate mutants** over the files in `must_haves.artifacts[].path` using deterministic operators,
   one catalog per edge-probe taxonomy category (reuse `references/edge-probe.md`):

   | edge category | operator(s) |
   |---|---|
   | boundary | flip `<`↔`<=`, `>`↔`>=`; `n`→`n±1` on a limit |
   | adjacency | strict↔non-strict comparison at a join (`s < e` ↔ `s <= e`) |
   | empty | delete an empty/null guard or early-return |
   | precision | cap/round/truncate a width or `dp`; drop an EPS guard |
   | encoding | swap `.length`/`.slice` ↔ grapheme/codepoint segmentation |
   | ordering | remove a `.sort(...)`; reverse a comparator |
   | idempotency | drop a defensive copy (`[...x]`/`structuredClone`) → alias input |

   (LLM-proposed mutants are an option but bias toward *inferable* defects; deterministic operators
   are unbiased and reproducible — prefer them, optionally augment with one LLM-proposed mutant per
   uncovered category.)

2. **Survival filter (critical).** Run the phase's existing test suite against each mutant. **Discard
   any mutant the suite already catches** — it never reaches the verifier in real life, so it does not
   test *verifier* reach. (In the experiment this was the `validate.mjs` "passes visible" gate; it is
   why the string-return mutant was dropped — `assert/strict` caught it.) Also discard mutants that
   are not real defects (equivalent mutants: behavior identical to baseline — detect by differential
   vs the unmutated SUT over a broad/property-based input sample).

3. **Run the verifier per surviving mutant**, blind, with the exact inspection-only prompt in
   `verifier-prompt.md`: it sees `must_haves.truths` + the mutated file only (neutral, no diff
   markers, no "this is a mutant" hint). Reuse the model tier from `config.model_profile`.

4. **Grade caught-edge, NOT raw `gaps_found`** (RESULTS Finding 3 — the single most important rule).
   A mutant is *caught* iff the verifier returns `gaps_found` **and its cited gap localizes to the
   mutated truth/file/region**. Localization match options, easiest→best:
   - the verifier's `suspected_gap` names the `truth` whose behavior the mutation breaks (tag each
     operator with the truth(s) it should violate when you generate it), or
   - the cited file/symbol/line overlaps the mutated span.
   A `gaps_found` that cites an *unrelated* truth is **not** a catch (the grapheme mutant got
   `gaps_found` 3/3 while catching 0/3 — it flagged null-coercion, not the real edge).

5. **Run the unmutated SUT through the verifier too** (specificity control). It already passed phase
   verify, so any `gaps_found` here is a **false positive** — and they are common on spec-ambiguous
   code (RESULTS Finding 4: 44% FP on correct references). Report it; do not suppress it.

## Output — `## Verifier Reach` in `NN-VERIFICATION.md`

```markdown
## Verifier Reach (advisory)
- Mutants planted: 14 (survived suite + non-equivalent) across 7 edge categories
- TRUE reach (caught the mutated truth): 9/14 = 64%
- Specificity (clean SUT not falsely flagged): PASS  (or "1 false-positive on truth #3")
- Uncaught categories → spec-completeness gaps:
  - `precision` (2 mutants survived verification) → run /gsd edge-probe on truth #2, or add a backstop test
  - `encoding` (1) → convention-free; needs a held-out/PBT backstop
- Convention-free residual (irreducible without spec work): 1
```

The actionable line is the **uncaught categories**: each is a checkable edge the spec omits. Route
covered/convention-bearing ones to the edge-probe (lift into a `truth`); route convention-free ones
to a held-out backstop. This closes the loop with the already-shipped `references/edge-probe.md`.

## Config & cost

```jsonc
"workflow": {
  "verifier_coverage": false,          // advisory gate, off by default
  "verifier_coverage_budget": 12,      // max mutants/phase (each = 1 verifier run = $)
  "verifier_coverage_sample": "per-category"  // 1+ mutant per applicable edge category, not exhaustive
}
```

Cost is the real constraint: each mutant is a verifier subagent run. Bound it by (a) sampling one
mutant per *applicable* category (use the edge-probe's relevance filter to skip N/A categories), and
(b) only mutating files in `must_haves.artifacts`, not the whole diff. The experiment's 12-mutant
battery per *task* is the upper bound of what a phase needs.

## The three lessons, baked in as requirements

1. **Grade caught-edge, not `gaps_found`** (Finding 3) — else a blind spot reads as full coverage.
2. **Always report reach × specificity** (Finding 4) — include the clean-SUT control; a thin spec
   moves both the wrong way, and reach alone is not interpretable.
3. **Separate the convention-free residual** (Finding 2) — `reach = spec reach + general-convention
   reach`; only the convention-free band truly needs spec work, so label it distinctly.

## Open implementation questions (for the building session)

- **Localization grading** is the hard part. Tagging each generated operator with the `truth` it
  *should* break (done at generation time) makes grading deterministic — strongly recommended over
  post-hoc NL matching of `suspected_gap`.
- **Equivalent-mutant detection** needs a differential/PBT oracle per phase; without it, equivalent
  mutants depress reach artificially. Reuse the property-based-testing backstop the edge-probe already
  contemplates.
- **Prompt skepticism is a dial** (Finding 4): more skeptical → higher reach, lower specificity.
  Pin it to the same prompt used here (`verifier-prompt.md`) so reported reach stays comparable
  across phases; do not tune per phase.
- **Tier**: the experiment found Haiku competitive on reach with better specificity than Opus —
  consider running the reach pass on a cheaper tier than the primary verifier (cost win, no reach loss).
