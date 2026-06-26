// E1 classifier: decide from the RETURN TYPE alone whether a requirement's output
// order is observably irrelevant (=> the probe may auto-`dismissed` it) or order-bearing
// (=> stays unresolved, handed to E4). Pure, deterministic, no model.
//
// Two rules are provided so the analysis can show the safety difference:
//   - naive:   any non-sequence container (Set/Map/object) or scalar => dismiss
//   - refined: Map/object are dismissed ONLY when their value_type is not itself a
//              collection (a Map<_, Array> still carries an order in its values)

const COLLECTION = new Set(['Array', 'List', 'Set', 'Map']);
const SEQUENCE = new Set(['Array', 'List', 'string', 'stream']); // observably ordered output
const KEYED = new Set(['Map', 'object', 'dict', 'Record']);
const SCALAR = new Set(['boolean', 'number', 'bigint', 'scalar', 'null', 'enum']);

// returns 'dismiss' (order irrelevant) | 'keep' (order-bearing / undecidable by type)
export function classify(req, rule = 'refined') {
  const t = req.return_type;
  if (SEQUENCE.has(t)) return 'keep';            // Array/string/stream: order is observable
  if (SCALAR.has(t)) return 'dismiss';           // no container, no order
  if (t === 'Set') return 'dismiss';             // set: membership only, order not observable
  if (KEYED.has(t)) {                            // Map/object: keys unordered by contract...
    if (rule === 'naive') return 'dismiss';      // ...naive stops here (UNSAFE)
    // refined: but the VALUES may be ordered collections
    return COLLECTION.has(req.value_type) ? 'keep' : 'dismiss';
  }
  return 'keep'; // unknown type: never auto-dismiss (safe default)
}
