// CI eval. Run: node --test grade.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, integrationRate, moduleId } from './grade.mjs';

const rows = load();
const rate = arm => integrationRate(rows.filter(r => r.arm === arm));

test('unpinned plan: independent waves NEVER integrate (0/9)', () => {
  const { ok, total } = rate('unpinned');
  assert.equal(total, 9);
  assert.equal(ok, 0);
});

test('pinned plan: independent waves ALWAYS integrate (9/9)', () => {
  const { ok, total } = rate('pinned');
  assert.equal(total, 9);
  assert.equal(ok, 9);
});

test('moduleId normalizes alias / relative / src-rooted paths to the same id', () => {
  assert.equal(moduleId('@/lib/csv'), 'lib/csv');
  assert.equal(moduleId('apps/web/src/lib/csv.ts'), 'lib/csv');
  assert.equal(moduleId('../../lib/csv'), 'lib/csv');
});