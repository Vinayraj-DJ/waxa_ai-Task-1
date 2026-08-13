import assert from 'node:assert';
import { test } from 'node:test';
import { calculateStats } from '../src/utils/stats.js';

test('calculateStats computes accurate p50, p95, p99, min, max, mean', () => {
  const data = Array.from({ length: 100 }, (_, i) => i + 1); // 1 to 100
  const stats = calculateStats(data);

  assert.strictEqual(stats.count, 100);
  assert.strictEqual(stats.min, 1);
  assert.strictEqual(stats.max, 100);
  assert.strictEqual(stats.mean, 50.5);
  assert.strictEqual(stats.p50, 50.5);
  assert.strictEqual(Math.round(stats.p95), 95);
  assert.strictEqual(Math.round(stats.p99), 99);
});

test('calculateStats handles empty arrays gracefully', () => {
  const stats = calculateStats([]);
  assert.strictEqual(stats.count, 0);
  assert.strictEqual(stats.p50, 0);
});
