#!/usr/bin/env node
// Computes the cross-wave integration matrix from outputs.tsv: for each arm, over every
// (helper, button) pair, does the button's import resolve to the helper's file AND call the
// helper's exported symbol? Models the GSD reality where task-1 (helper) and task-3 (button)
// run in independent waves. Run: node grade.mjs   (and: node --test grade.test.mjs)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// Normalize a file path or import specifier to a canonical module id (tail after the src root,
// no alias, no relative dots, no extension): so `apps/web/src/lib/csv.ts`, `@/lib/csv`, and
// `../../lib/csv` all collapse to `lib/csv`.
export function moduleId(s) {
  return s.trim().replace(/^['"]|['"]$/g, '')
    .replace(/\.tsx?$/, '')
    .replace(/^@\//, '')
    .replace(/^apps\/web\/src\//, '')
    .replace(/^(\.\.?\/)+/, '');
}

export function integrationRate(rows) {
  const helpers = rows.filter(r => r.role === 'helper');
  const buttons = rows.filter(r => r.role === 'button');
  let ok = 0, total = 0;
  for (const h of helpers) for (const b of buttons) {
    total++;
    if (moduleId(h.path_or_import) === moduleId(b.path_or_import) && h.symbol === b.symbol) ok++;
  }
  return { ok, total, rate: total ? ok / total : 0 };
}

export function load() {
  const lines = readFileSync(join(HERE, 'outputs.tsv'), 'utf8').trim().split('\n');
  const head = lines[0].split('\t');
  return lines.slice(1).map(l => Object.fromEntries(l.split('\t').map((v, i) => [head[i], v])));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = load();
  for (const arm of ['unpinned', 'pinned']) {
    const { ok, total, rate } = integrationRate(rows.filter(r => r.arm === arm));
    console.log(`${arm.padEnd(9)} integrating (helper,button) pairs: ${ok}/${total} = ${(rate * 100).toFixed(0)}%`);
  }
}
