// E2 analysis: run the caller-usage inference over the labelled cases. Report accuracy
// and — the safety metric — the false-DISMISS rate (calling an order-sensitive caller
// 'irrelevant', the only dangerous error).
import { readFileSync, writeFileSync } from 'node:fs';
import { inferFromCaller } from './infer.mjs';

const { cases } = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8'));

let correct = 0, falseDismiss = 0, unknown = 0;
const rows = [];
for (const c of cases) {
  const pred = inferFromCaller(c.caller);
  const hit = pred === c.verdict;
  if (hit) correct++;
  if (pred === 'irrelevant' && c.verdict === 'matters') falseDismiss++; // DANGER
  if (pred === 'unknown') unknown++;
  rows.push({ id: c.id, pred, truth: c.verdict, hit });
}
const n = cases.length;
const decided = n - unknown;
const out = {
  n, correct, accuracy: +(100 * correct / n).toFixed(1),
  decided, unknown, falseDismiss,
  safe: falseDismiss === 0, rows,
};
writeFileSync(new URL('./results.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
process.stdout.write(`E2 n=${n} acc=${out.accuracy}% decided=${decided} unknown=${unknown} falseDismiss=${falseDismiss} safe=${out.safe}\n`);
