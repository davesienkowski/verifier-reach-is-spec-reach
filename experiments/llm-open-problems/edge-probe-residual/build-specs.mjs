// Builds the three spec variants per task for the edge-probe-residual study.
//  narrow              = corpus spec with the meta-note (which reveals the omitted edge) stripped
//  surfaced-unresolved = narrow + the REAL edge-probe output (categories + probe questions) as flagged
//                        UNRESOLVED edges (this is the deployed tagger, replacing N17's oracle flag)
//  surfaced-resolved   = narrow + the omitted edge written as an explicit, decided acceptance criterion
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CORPUS = join(ROOT, '..', 'noninferable-corpus', 'tasks');
const N17 = join(ROOT, '..', 'verifier-abstention', 'tasks');
const EP = join(ROOT, '..', '..', '..', 'gsd-core', 'bin', 'lib', 'edge-probe.cjs');
const resolved = JSON.parse(readFileSync(join(ROOT, 'resolved-criteria.json'), 'utf8'));

// requirement text fed to the edge-probe (contract stated plainly; omitted edge NOT revealed)
const reqText = {
  '02-merge-intervals': 'Merge a list of numeric [start,end] intervals; overlapping intervals are merged into one spanning pair, and the result is sorted by start.',
  '03-truncate-graphemes': 'Return the first max characters of a string, leaving shorter strings unchanged.',
  '04-stable-sort': 'Sort an array of {name, score} objects by score in descending order, returning a new array.',
  '05-round-int': 'Round a number to the nearest integer; larger fractional parts round up and smaller round down.',
};

const stripMeta = (md) => md.split('\n').filter((l) => !l.trimStart().startsWith('>')).join('\n').replace(/\n{3,}/g, '\n\n');

function edgeProbeBlock(taskId) {
  const reqPath = join(ROOT, `req-${taskId}.json`);
  writeFileSync(reqPath, JSON.stringify([{ id: 'R1', text: reqText[taskId] }]));
  const out = JSON.parse(execSync(`node ${EP} ${reqPath}`, { encoding: 'utf8' }));
  const lines = out.items.map((i) => `- **${i.category}** (unresolved): ${i.probe}`).join('\n');
  return `\n## Spec-completeness probe — UNRESOLVED edges\nA completeness probe flagged these applicable edges as NOT determined by the spec above:\n${lines}\n`;
}

const NI = ['02-merge-intervals', '03-truncate-graphemes', '04-stable-sort', '05-round-int'];
const manifest = [];

for (const taskId of NI) {
  const dir = join(CORPUS, taskId);
  const narrow = stripMeta(readFileSync(join(dir, 'spec.md'), 'utf8')).trim();
  const probe = edgeProbeBlock(taskId);
  const resolvedCrit = `\n## must_haves (additional, resolved edge)\n${resolved[taskId]}\n`;

  writeFileSync(join(ROOT, 'specs', `${taskId}__narrow.md`), narrow + '\n');
  writeFileSync(join(ROOT, 'specs', `${taskId}__surfaced-unresolved.md`), narrow + '\n' + probe);
  writeFileSync(join(ROOT, 'specs', `${taskId}__surfaced-resolved.md`), narrow + '\n' + resolvedCrit);
  copyFileSync(join(dir, 'defective.mjs'), join(ROOT, 'code', `${taskId}.mjs`));

  for (const cond of ['narrow', 'surfaced-unresolved', 'surfaced-resolved']) {
    manifest.push({ task: taskId, regime: 'NI', condition: cond, groundTruth: 'defect-present-noninferable' });
  }
}

// INF control: stated-rule defect (sorted-by-start). narrow + surfaced-unresolved only.
{
  const taskId = '02-merge-intervals-INFERABLE';
  const narrow = stripMeta(readFileSync(join(CORPUS, '02-merge-intervals', 'spec.md'), 'utf8')).trim();
  const probe = edgeProbeBlock('02-merge-intervals'); // same merge probe (noise edges)
  writeFileSync(join(ROOT, 'specs', `${taskId}__narrow.md`), narrow + '\n');
  writeFileSync(join(ROOT, 'specs', `${taskId}__surfaced-unresolved.md`), narrow + '\n' + probe);
  copyFileSync(join(N17, '02-merge-intervals-INFERABLE.mjs'), join(ROOT, 'code', `${taskId}.mjs`));
  for (const cond of ['narrow', 'surfaced-unresolved']) {
    manifest.push({ task: taskId, regime: 'INF', condition: cond, groundTruth: 'defect-present-stated-rule' });
  }
}

writeFileSync(join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Built ${manifest.length} (task,condition) cells across ${NI.length} NI tasks + 1 INF control.`);
console.log('Spec variants in specs/, code in code/, manifest.json written.');
