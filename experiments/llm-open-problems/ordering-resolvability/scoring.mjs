// Shared coarse order-class scoring for the model arms (E3, E4).
//
// WHY THIS EXISTS: the orchestrator that runs the blind model arms has seen the
// ground-truth labels. To keep label-awareness out of the *scoring* path, scoring is
// fully mechanical here — a model emits a coarse class string, and these functions map
// the corpus `intended_order` prose to the same coarse vocabulary for an equality test.
//
// truthClass6 is the EXACT mapping the E4 heuristic baseline uses (predict-heuristic.mjs
// imports it), so the model arm is scored identically to the heuristic it is compared to.
// Do not reorder the regex tests: r06 ("sorted by timestamp") deliberately resolves to
// sorted-by-field because "sorted" is tested before "timestamp" — see RESULTS.md note.

export function truthClass6(intended) {
  const s = (intended || '').toLowerCase();
  if (/random|non-deterministic|nondeterministic/.test(s)) return 'nondeterministic';
  if (/sorted|ascending|descending|alphabetic|bucket index|relevance|upvotes/.test(s)) return 'sorted-by-field';
  if (/timestamp|occurred|encounter|chronolog/.test(s)) return 'chronological';
  if (/stable|input order|first occurrence/.test(s)) return 'stable-input';
  if (/sequence|traversal|path|a first|b last/.test(s)) return 'sequence-significant';
  if (/unspecified|undecided/.test(s)) return 'UNSTATED';
  return 'OTHER';
}

// E3 forced-choice offers only 4 classes (a) input/stable (b) sorted-by-field
// (c) unspecified (d) nondeterministic. Collapse the 6-class truth into that vocabulary:
//   chronological        -> sorted-by-field      (time is just a sort key)
//   sequence-significant  -> stable-input         (a meaningful sequence = "input/stable order")
export function truthClass4(intended) {
  const c = truthClass6(intended);
  if (c === 'nondeterministic') return 'nondeterministic';
  if (c === 'sorted-by-field' || c === 'chronological') return 'sorted-by-field';
  if (c === 'stable-input' || c === 'sequence-significant') return 'stable-input';
  return 'unspecified'; // UNSTATED / OTHER
}

export const E4_CLASSES = ['sorted-by-field', 'chronological', 'stable-input', 'nondeterministic', 'sequence-significant', 'UNSTATED'];
export const E3_CLASSES = ['stable-input', 'sorted-by-field', 'unspecified', 'nondeterministic'];
