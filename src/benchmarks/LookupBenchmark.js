import { startTimer } from '../utils/timer.js';
import { calculateStats } from '../utils/stats.js';
import { logger } from '../utils/logger.js';

export async function runLookupBenchmark(driver, dataset, iterations = 100) {
  logger.info(`Running Lookup Benchmark (Point & Indexed Property) on ${driver.name}...`);

  // 1. Point Lookups
  const pointMeasurements = [];
  for (let i = 0; i < iterations; i++) {
    const randomIdx = Math.floor(Math.random() * dataset.nodes.length);
    const nodeId = dataset.nodes[randomIdx].id;
    
    const timer = startTimer();
    await driver.queryPointLookup(nodeId);
    pointMeasurements.push(timer.elapsedMs());
  }
  const pointStats = calculateStats(pointMeasurements);

  // 2. Indexed / Filtered Property Lookups
  const cities = ['San Francisco', 'New York', 'London', 'Tokyo', 'Berlin'];
  const indexedMeasurements = [];
  for (let i = 0; i < iterations; i++) {
    const city = cities[i % cities.length];
    const age = 20 + (i % 40);
    
    const timer = startTimer();
    await driver.queryIndexedLookup(city, age);
    indexedMeasurements.push(timer.elapsedMs());
  }
  const indexedStats = calculateStats(indexedMeasurements);

  const result = {
    pointLookup: pointStats,
    indexedLookup: indexedStats
  };

  logger.success(`Lookups complete for ${driver.name}: Point p50=${pointStats.p50}ms, p95=${pointStats.p95}ms | Indexed p50=${indexedStats.p50}ms, p95=${indexedStats.p95}ms`);
  return result;
}
