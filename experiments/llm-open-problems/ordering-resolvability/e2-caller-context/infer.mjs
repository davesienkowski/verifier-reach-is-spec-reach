// E2: infer whether order matters from the CALLER's usage pattern. Deterministic.
// Conservative by design: only return 'irrelevant' on a positive order-destroying signal;
// any positional/sequence use => 'matters'; ambiguous => 'unknown' (never auto-dismiss).
export function inferFromCaller(caller) {
  const c = caller;

  // order-DESTROYING signals => order is irrelevant to this consumer
  const destroys =
    /new Set\(/.test(c) ||                         // collapsed into a set
    /new Map\(/.test(c) ||                          // re-keyed
    /\.sort\(/.test(c) ||                           // re-sorted downstream
    /\.includes\(|\.has\(/.test(c) ||               // membership test
    /\.reduce\(|\.some\(|\.every\(|\.size\b/.test(c); // order-agnostic aggregate

  // order-DEPENDING signals => order matters
  const depends =
    /\[\s*0\s*\]|\.length\s*-\s*1\s*\]|\[\s*\w+\s*\]/.test(c) || // positional index
    /\.slice\(\s*0/.test(c) ||                       // head slice (top-N)
    /\.join\(/.test(c) ||                            // serialised in order
    /deepEqual|toEqual/.test(c) ||                   // sequence equality
    /for\s*\(.*of\s|forEach/.test(c);                // sequential iteration / effects

  // depends wins ties (safe: never silently call an order-sensitive caller irrelevant)
  if (depends) return 'matters';
  if (destroys) return 'irrelevant';
  return 'unknown';
}
