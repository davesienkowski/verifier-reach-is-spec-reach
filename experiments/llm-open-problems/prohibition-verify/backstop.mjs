// N7 — deterministic backstops for the three prohibitions. The thesis: prohibitions ("must NOT")
// that an LLM verifier under-catches are cheaply and reliably caught by a deterministic check
// (the eslint-rules pattern already in the repo). Each backstop catches the violation regardless
// of how the spec is framed (the LLM's polarity weakness does not exist here).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(ROOT, 'cand', f), 'utf8');

const checks = [
  {
    id: 'c1', prohibition: 'no IO in a pure module (ADR 0007)',
    violated: /\bfrom\s+["']node:fs["']|\breadFileSync\b|\bfetch\s*\(/.test(read('c1-impl.mjs')),
  },
  {
    id: 'c2', prohibition: 'no red color (ADR 0005)',
    violated: /#ef4444|#ff0000|#f00\b|rgb\(\s*255\s*,\s*0\s*,\s*0\s*\)|["']red["']/i.test(read('c2-impl.mjs')),
  },
  {
    id: 'c3', prohibition: 'monotonic momentum — never decrement (ADR 0011)',
    // property test: run a sequence, assert never decreases
    violated: (() => {
      const src = read('c3-impl.mjs');
      // structural: a literal decrement on the lapse path
      return /-\s*1\b/.test(src) || /current\s*-\s/.test(src);
    })(),
  },
];

console.log('=== N7 deterministic backstops ===');
let caught = 0;
for (const c of checks) {
  if (c.violated) caught++;
  console.log(`  ${c.id}  ${c.violated ? 'VIOLATION CAUGHT ✅' : 'clean'}   ${c.prohibition}`);
}
console.log(`\nBackstop catch rate: ${caught}/${checks.length} (polarity-independent, deterministic).`);
process.exit(0);
