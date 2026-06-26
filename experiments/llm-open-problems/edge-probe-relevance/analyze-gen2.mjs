#!/usr/bin/env node
/**
 * Test A — generalization. A fresh 6-spec corpus (different features from the original 7) scored the
 * same way, to check the deterministic-vs-LLM pattern replicates and isn't an artifact of the first
 * corpus. Writes specs2/<slug>/{requirements,ground-truth}.json, scores the deterministic engine
 * always, and scores any llm-runs/gen2/<tier>-rep1.json present.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ENGINE = process.env.EDGE_PROBE_JS ||
  join(HERE, '../../../.claude/worktrees/550-edge-probe/gsd-core/bin/lib/edge-probe.cjs');
const MISS_ALL = { vibe: true, mid: true, senior: true };
const MISS_VM = { vibe: true, mid: true, senior: false };

const CORPUS = [
  { slug: 'discount-cart', requirements: [
    { id: 'R1', text: 'Apply a discount code to the cart total and show the new price',
      applicable: ['boundary', 'precision', 'idempotency'],
      recall: [{ category: 'precision', why: 'rounding the discounted total to cents', persona: MISS_ALL },
               { category: 'idempotency', why: 'applying the same code twice / stacking', persona: MISS_VM }] } ] },
  { slug: 'username-availability', requirements: [
    { id: 'R1', text: 'Check whether a username is available as the user types',
      applicable: ['encoding', 'empty', 'concurrency'],
      recall: [{ category: 'encoding', why: 'case-fold / unicode / homoglyph equivalence', persona: MISS_ALL },
               { category: 'concurrency', why: 'two people register the same name at once (TOCTOU)', persona: MISS_VM }] } ] },
  { slug: 'meeting-timezone', requirements: [
    { id: 'R1', text: 'Let users schedule a meeting and show the time to each attendee',
      applicable: ['boundary', 'precision', 'concurrency'],
      recall: [{ category: 'boundary', why: 'DST transition / timezone / midnight rollover', persona: MISS_ALL }] } ] },
  { slug: 'leaderboard', requirements: [
    { id: 'R1', text: 'Rank players by score and show the top 10',
      applicable: ['ordering', 'empty', 'boundary', 'adjacency'],
      recall: [{ category: 'ordering', why: 'tie-break when scores are equal (stability)', persona: MISS_ALL },
               { category: 'boundary', why: 'fewer than 10 players', persona: MISS_VM }] } ] },
  { slug: 'password-reset-expiry', requirements: [
    { id: 'R1', text: 'Email a password reset link that works for one hour',
      applicable: ['boundary', 'idempotency', 'concurrency'],
      recall: [{ category: 'boundary', why: 'behavior exactly at the 1-hour expiry', persona: MISS_VM },
               { category: 'idempotency', why: 'link reused / multiple resets requested', persona: MISS_VM }] } ] },
  { slug: 'comment-threading', requirements: [
    { id: 'R1', text: 'Let users reply to comments and show replies nested under the parent',
      applicable: ['ordering', 'empty', 'boundary'],
      recall: [{ category: 'boundary', why: 'maximum nesting depth / deep recursion', persona: MISS_ALL },
               { category: 'ordering', why: 'order of sibling replies', persona: MISS_VM }] } ] },
];

const ALL = ['boundary', 'adjacency', 'empty', 'encoding', 'ordering', 'precision', 'idempotency', 'concurrency'];
const GT = {};
for (const s of CORPUS) {
  const dir = join(HERE, 'specs2', s.slug); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'requirements.json'), JSON.stringify(s.requirements.map((r) => ({ id: r.id, text: r.text })), null, 2) + '\n');
  writeFileSync(join(dir, 'ground-truth.json'), JSON.stringify(s.requirements, null, 2) + '\n');
  GT[s.slug] = Object.fromEntries(s.requirements.map((r) => [r.id, r]));
}

function score(raisedFor) {
  let raised = 0, phantom = 0, app = 0, missed = 0;
  const rw = { vibe: { hit: 0, n: 0 }, mid: { hit: 0, n: 0 }, senior: { hit: 0, n: 0 } };
  for (const slug of Object.keys(GT)) for (const [id, gt] of Object.entries(GT[slug])) {
    const set = new Set(raisedFor(slug, id)); const a = new Set(gt.applicable);
    raised += set.size; phantom += [...set].filter((c) => !a.has(c)).length;
    app += a.size; missed += [...a].filter((c) => !set.has(c)).length;
    for (const rg of gt.recall) for (const t of ['vibe', 'mid', 'senior']) if (rg.persona[t]) { rw[t].n++; if (set.has(rg.category)) rw[t].hit++; }
  }
  return { precision: (raised - phantom) / raised, underfire: missed / app,
    vibe: rw.vibe.hit / rw.vibe.n, mid: rw.mid.hit / rw.mid.n, senior: rw.senior.hit / rw.senior.n };
}

const det = {};
for (const slug of Object.keys(GT)) {
  const tmp = join('/tmp', `gen2-${slug}.json`);
  writeFileSync(tmp, readFileSync(join(HERE, 'specs2', slug, 'requirements.json')));
  for (const it of JSON.parse(execFileSync('node', [ENGINE, tmp], { encoding: 'utf8' })).items)
    (det[`${slug}/${it.requirement_id}`] ||= new Set()).add(it.category);
}
const pct = (x) => (x * 100).toFixed(0) + '%';
const showRow = (label, s) => console.log(`  ${label.padEnd(16)} precision ${pct(s.precision).padEnd(5)} under-fire ${pct(s.underfire).padEnd(5)} recall ${pct(s.vibe)}/${pct(s.mid)}/${pct(s.senior)}`);

console.log(`\nTest A — generalization corpus (${CORPUS.length} new specs)\n`);
showRow('deterministic', score((s, i) => [...(det[`${s}/${i}`] || [])]));
for (const tier of ['haiku', 'sonnet', 'opus']) {
  const f = join(HERE, 'llm-runs', 'gen2', `${tier}-rep1.json`);
  if (!existsSync(f)) { console.log(`  ${tier.padEnd(16)} (no run yet)`); continue; }
  const map = {}; for (const r of JSON.parse(readFileSync(f, 'utf8')).runs) for (const req of r.requirements) map[`${r.slug}/${req.id}`] = req.applicable_categories || [];
  showRow(tier, score((s, i) => map[`${s}/${i}`] || []));
}
console.log('');
