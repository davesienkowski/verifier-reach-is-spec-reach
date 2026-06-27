# Why an AI that checks code can be confidently wrong — in plain English

*No background needed. You don't have to be a programmer, and you don't need to know anything
about the tools mentioned at the bottom. If you've ever heard "we use AI to write code now,"
this explains a quiet problem with that — and a fix that turns out to be more about **asking
better questions up front** than about building a smarter AI.*

---

## The thirty-second version

These days an AI can write a chunk of software. To catch its mistakes, people often have a
**second AI read the first one's work** and give a verdict: "looks good" or "found a problem."
Think of it as an automated proofreader.

Here's the catch this whole project is about:

> **The proofreader can only catch mistakes your instructions actually mentioned.** When the
> instructions quietly leave something out, the AI doesn't say *"hey, you never told me what to
> do here."* It just quietly guesses, decides the work is fine, and says so — with total
> confidence.

And — this is the surprising part — **using a smarter, more expensive AI as the proofreader
doesn't fix it.** The missing information was never in front of it, so no amount of brainpower
brings it back.

The fix isn't a smarter proofreader. It's **asking the awkward questions earlier** — while the
instructions are being written — so the thing that was missing gets written down and becomes
checkable.

---

## A concrete example you can hold in your head

Say the instructions for a small piece of software read: *"Round the number to the nearest whole
number."*

Sounds complete. But what should happen to **2.5** — does it round to 2, or to 3? Both are
"nearest" (it's exactly in the middle). There are two common rules banks and spreadsheets actually
use, and they give different answers. The instructions never said which one.

Now the AI writes the code, picks one rule, and moves on. The AI proofreader reads it and has the
exact same blind spot: the instructions didn't say, so it has nothing to check the choice
*against*. It shrugs — internally — and stamps **"looks good."** The bug (if the author wanted the
other rule) ships, and nothing ever flagged it.

That's the whole problem in miniature. It's not that the AI is dumb. It's that **you can't check
an answer when the question was never asked.**

---

## How do we know this is real (and not just a story)?

A few measurements, from least to most rigorous:

- **The original tell-tale.** We built a handful of these "the-instructions-didn't-say" tasks
  on purpose. A simple, old-fashioned automated test — one that secretly knew the right answer —
  caught the bug **100%** of the time. The AI proofreader caught it **0 out of 12** times, while
  reporting about **93% confidence** that everything was fine. (Small sample — a direction-finder,
  not proof.)

- **The bigger, careful test.** We then ran it properly: **210 checks**, three different AI models,
  repeated runs, with proper statistical confidence ranges. When the instructions were silent about
  the tricky detail, the AI proofreader waved the buggy code through **essentially every time —
  100%** (statistical range 94–100%). When we added **one sentence** to the instructions naming the
  detail, the same proofreader caught the bug **98% of the time** (range 91–100%). One sentence,
  written in the right place, flipped a near-total blind spot into a near-total catch.

- **Smarter doesn't rescue it.** The blind spot showed up the same across a small, a medium, and a
  large AI model. Spending more on the proofreader bought nothing. This matches independent research
  by other people, who found that AI "knowing when to say I'm not sure" on under-specified questions
  is an unsolved problem where bigger models don't help.

---

## The fix, in plain terms

Two moves, both common sense once you see the problem:

**1. Ask the awkward questions *before* any code is written.** When the instructions are being
drafted, an automated helper looks at each requirement and asks the kinds of edge-case questions a
careful expert would: *What about ties, like 2.5? What about an empty list? What about emoji or
accented characters in a name? What about the order things come back in?* Each answer gets written
into the instructions — so now there's something concrete to check against later. (If a requirement
is too vague to even ask about, it gets flagged "review this by hand" instead of silently slipping
through.)

**2. Teach the proofreader to say "I can't verify this" instead of faking a thumbs-up.** When the
proofreader hits something the instructions genuinely don't pin down, the honest answer isn't a
confident green checkmark — it's *"a human needs to look at this."* So the system now lets it raise
its hand and defer, rather than guess.

One detail that matters a lot: the "raise your hand" only works well when it's triggered by an
**outside flag** — something that marked the requirement as "not pinned down" ahead of time. Simply
telling the AI *"abstain if you feel unsure"* barely helped, because the whole point of a blind spot
is that **the AI doesn't feel unsure** — it feels perfectly confident. You can't rely on it to
notice its own blind spot; you have to point at it from the outside.

---

## What this actually is (and the honest limits)

This is a set of improvements contributed to an **open-source tool that helps people build software
with AI** (it's called GSD-Core — but you don't need to know it to get the point). The tool runs the
usual loop for you: turn a request into instructions, plan it, write the code, and check the result.
The improvements here make the *instructions* step ask better questions, and make the *checking* step
fail honestly instead of rubber-stamping.

Now the honest part — because the whole point of this work is **not** overselling:

- **It's a smart combination of known ideas, not a brand-new invention.** "Ask clarifying questions
  before building," "let an AI decline to answer when it's unsure," and "an automated check can only
  be as complete as the rules you gave it" are all old ideas. What's genuinely new here is the
  *measurement* — showing that the AI proofreader's overconfidence lands specifically on the things
  the instructions left out — and the particular way these pieces were assembled and shipped.

- **It is not a complete fix.** If the up-front questioner *itself* fails to ask about an edge — and
  that edge also isn't implied by anything else in the instructions — then the proofreader is still
  blind to it. On those genuinely-missed cases, it still waves the bug through **67–93%** of the
  time. (And to be fair to ourselves: those hardest cases were *hand-picked* to be probe-blind, so
  that's a "this can happen" finding, not "this happens X% of the time in general.") For those, you
  still want an old-fashioned secret test as a backstop.

- **It needs a capable AI.** The "raise your hand instead of guessing" behavior worked on stronger
  models and got unreliable on the weakest one (which tended to ignore the flag).

- **Some numbers are solid, some are early.** The headline blind-spot result is from the careful
  210-check study with confidence ranges. The calibration figures (the 0-out-of-12) and the
  "raise your hand" experiment are smaller, earlier runs — directional, not the final word. We label
  which is which everywhere, on purpose.

---

## The one thing to take away

> **An automated checker can only catch the mistakes your instructions named.** When you're tempted
> to fix a missed bug by reaching for a smarter checker, the more reliable move is almost always to
> go back and make the **instructions** say more — earlier. You can't out-think a gap in the
> question; you can only fill it in.

---

*Want more depth? [edge-probe-user-feature.md](edge-probe-user-feature.md) is the same idea for
people who use the tool; [edge-probe-README.md](edge-probe-README.md) is a one-screen overview; and
the full write-up with all the numbers and citations is the paper, [../paper/main.pdf](../paper/main.pdf).*
