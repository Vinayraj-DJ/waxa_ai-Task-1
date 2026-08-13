import { startTimer } from '../utils/timer.js';
import { calculateStats } from '../utils/stats.js';
import { logger } from '../utils/logger.js';

export async function runAggregationBenchmark(driver, iterations = 100) {
  logger.info(`Running Aggregation Benchmark (Count / Group-By) on ${driver.name}...`);

  const measurements = [];
  for (let i = 0; i < iterations; i++) {
    const timer = startTimer();
    await driver.queryAggregation();
    measurements.push(timer.elapsedMs());
  }

  const stats = calculateStats(measurements);
  logger.success(`Aggregation complete for ${driver.name}: p50=${stats.p50}ms, p95=${stats.p95}ms`);
  return stats;
}
