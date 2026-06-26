# prohibition-elicitation (N18)

Can a spec-time probe **name** the omitted constraint — converting non-inferable → inferable — and which
probe catches a *holistic values prohibition* (not just data-shape edges)? Answers johns10davenport's
question from r/ClaudeAI `1tv1kng`: *does Three Amigos catch the rule nobody thought to name?*

Design registered as **N18** in `../NOVEL-EXPERIMENTS.md`; framing in `../REDDIT-FEEDBACK-SYNTHESIS.md`.

## Design
- **Methods:** `edge-probe` (the 8-category shape taxonomy from `references/edge-probe.md`) ·
  `adversarial` ("what could this silently become that the author would NOT want?") · `three-amigos`
  (PM/Dev/QA reconcile).
- **Tasks:** `02-merge` (omitted = touching intervals) + `03-truncate` (omitted = grapheme vs code unit)
  from `../noninferable-corpus` — both **shape edges**; + `tasks/C-streak-reminder.md`, a new
  **holistic prohibition** (omitted = "must not become a punitive/loss-aversion streak mechanic",
  Much-Wallaby's class). The omitted constraint is held out of the prompt; the method must surface it.
- **Models:** opus + sonnet. 18 runs.

## Files
- `scores.tsv` — per-run hit (named the GT omitted constraint?) + n_items surfaced.
- `analyze.mjs` — recall by constraint type + precision proxy.
- `tasks/C-streak-reminder.md` — the holistic-prohibition task + its held-out ground truth.
- `RESULTS.md` — findings.

## Run
```bash
node analyze.mjs
```

## Headline (~60 runs: 2 shape + 10 holistic tasks; canon-less ×3 models; + 5 precision)
- **Shape edges:** all 3 methods 100% (elicitable at spec time though N17's verifier is blind to them).
- **edge-probe: 0/8 holistic** — shape taxonomy never reaches a values prohibition.
- **adversarial: 17/17 holistic, incl. 11/11 canon-less across opus/sonnet/haiku** — the robust recall
  instrument; even the weak model catches the values prohibition under this framing.
- **Three Amigos: conditional** — 6/6 canon-backed, but canon-less only with a strong model + loud
  wording (D1–D3 opus/sonnet hit; C1 soft "encourage" 0/2; **haiku 0/3 canon-less**).
- **Precision solved:** a one-pass classifier second-stage collapses ~10 constraints → ~2 (10.2→2.2),
  GT retained 5/5.

Adoption: edge-probe (shape) + deterministic canon checklist (C2–C7 class) + **two-stage adversarial
probe** (recall → precision classifier; model-robust) for the canon-less class → N7 polarity → N17
abstention. Caveat: all 4 canon-less tasks are engagement-ethics-adjacent; a non-engagement bespoke
domain rule is still untested.

## Files add: `precision.tsv` (second-stage filter results).
