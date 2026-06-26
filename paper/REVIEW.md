# Review pass — Verifier Reach Is Spec Reach (preprint)

Two-part review before committing: an adversarial fact-check against primaries, and a
laws-of-software (skills-from-the-artificer) pass. 2026-06-26.

## Part 1 — Adversarial fact-check (every number traced to a primary)

Findings and resolutions:

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| F1 | must-fix | `dispositionForUnverifiableTruth()` does not exist in repo `src/` (only `dispositionForProhibition()` is real here); `insufficient_spec` not in `src/` | Removed the fabricated symbol; now names only the verified `dispositionForProhibition()` and describes the truth-axis counterpart without an unverified name |
| F2 | compile-blocker | TikZ `$(a)!0.5!(b)$` used but `calc` library not loaded | Added `calc` to `\usetikzlibrary` |
| F3 | factual inversion | Paper said confidence-while-wrong "rises with model strength"; primary (`c8-corpus-drift`) shows the opposite (opus 0.65 → haiku 0.96) | Corrected to "rises as model strength falls" with the numbers |
| F4 | overstatement | "at or below chance" — primary shows 14–29% vs 16.7% floor (barely above) | Corrected to "at or barely above chance," noted tie-break scoring artifact |
| F5 | minor | Abstract used 0.81 (clean-subset n=8) but called it "non-inferable tasks" broadly | Scoped to "the clean non-inferable tasks" |
| F6 | minor | "near-zero on a sonnet-class model" — sonnet under-fire is 14% (0% is opus) | Reworded: "under-fire ~14% at sonnet, near-zero at opus" |

All load-bearing numbers (0/12 vs 3/3; ECE 0.030/0.677/0.805; abstention 100/67/17, n=27;
prohibition 25/25, 17/17, haiku 6/6, classifier 9.3→2.3, GT 8/8, FP 0/8; verifier-reach 36 verdicts
89%/0%; krun opus≡haiku 75%/0%; plan-execute 0/9 vs 9/9; prohibition positive=negative 9/9 gap 0.00)
were **verified SUPPORTED** against primaries. All 8 `\cite` keys resolve in `refs.bib`.

**Update (post-review):** the n=121/94% claim was initially cut as unsupported, then **restored** — the
source experiment (`edge-probe-residual/`, n=121) existed on `gsd-core@feat/non-inferable-pipeline`,
was never consolidated, and has since been recovered into this repo; `analyze.mjs` reproduces the 94%
narrow blind-spot false-pass and 94% surfaced-resolved catch live. See CORRECTIONS C1 (RETRACTED).
The paper now leads with it. Lesson: `insufficient_spec` should trigger a search for the primary, not
deletion of the claim.

**Outstanding (deferred to camera-ready):** external arXiv citation facts (bib `note` fields) and the
deployment PR numbers were not independently re-verified here — they remain on the pre-submission
checklist.

## Part 2 — Laws-of-software pass (skills-from-the-artificer)

Three laws fired; all illuminate the argument and the design survives each.

- **Goodhart's law** — The verdict is a proxy for correctness; the instant an agent loop optimizes
  for "verifier returns PASS," the proxy decouples from reality, first on the non-inferable edges.
  The design already applies the standard Goodhart defenses (pair the proxy with a harder-to-fake
  outcome measure = held-out test; audit proxy-to-reality = exogenous non-inferable tag). Added as
  framing in §3.
- **Linus's law** — "Enough eyeballs → shallow bugs" *fails* for this class: a non-inferable edge is
  an assumption every reviewer shares (the info is absent from the artifact, not hidden in code), so
  more model-eyeballs cannot help. The human maintainer who brought outside knowledge could. Added as
  framing in §3.
- **Law of leaky abstractions** — Confirms the shape→category classifier weakness already in
  Limitations; the fail-closed/abstain design is the recommended mitigation ("fail loudly and
  visibly"). Added a clause in §7.

Laws considered and not fired as central: Postel (fail-closed is a deliberate strictness choice, noted
implicitly), Gall (the pipeline did grow incrementally from working pieces — supportive, not a
threat), Hyrum/Conway (the contract/seam are interfaces but not load-bearing to the paper's argument).
