import { startTimer } from '../utils/timer.js';
import { calculateStats } from '../utils/stats.js';
import { logger } from '../utils/logger.js';

export async function runTraversalBenchmark(driver, dataset, iterations = 100, warmupCount = 20) {
  logger.info(`Running Traversal Benchmark (1-hop, 2-hop, 3-hop) on ${driver.name}...`);

  // Random sample of start node IDs
  const sampleStartNodes = [];
  for (let i = 0; i < iterations + warmupCount; i++) {
    const randomIdx = Math.floor(Math.random() * dataset.nodes.length);
    sampleStartNodes.push(dataset.nodes[randomIdx].id);
  }

  const hops = [1, 2, 3];
  const results = {};

  for (const hop of hops) {
    logger.info(`Executing ${hop}-hop traversal benchmark (${iterations} warm iterations)...`);
    
    // Cold run measurement
    const coldTimer = startTimer();
    if (hop === 1) await driver.queryTraversal1Hop(sampleStartNodes[0]);
    if (hop === 2) await driver.queryTraversal2Hop(sampleStartNodes[0]);
    if (hop === 3) await driver.queryTraversal3Hop(sampleStartNodes[0]);
    const coldLatencyMs = Math.round(coldTimer.elapsedMs() * 100) / 100;

    // Warm-up sweeps
    for (let w = 1; w < warmupCount; w++) {
      if (hop === 1) await driver.queryTraversal1Hop(sampleStartNodes[w]);
      if (hop === 2) await driver.queryTraversal2Hop(sampleStartNodes[w]);
      if (hop === 3) await driver.queryTraversal3Hop(sampleStartNodes[w]);
    }

    // Warm measurements
    const warmMeasurements = [];
    for (let i = warmupCount; i < iterations + warmupCount; i++) {
      const startId = sampleStartNodes[i];
      const timer = startTimer();
      if (hop === 1) await driver.queryTraversal1Hop(startId);
      if (hop === 2) await driver.queryTraversal2Hop(startId);
      if (hop === 3) await driver.queryTraversal3Hop(startId);
      warmMeasurements.push(timer.elapsedMs());
    }

    const warmStats = calculateStats(warmMeasurements);
    results[`hop${hop}`] = {
      coldLatencyMs,
      ...warmStats
    };

    logger.success(`${hop}-hop complete for ${driver.name}: Cold=${coldLatencyMs}ms | Warm p50=${warmStats.p50}ms | Warm p95=${warmStats.p95}ms`);
  }

  return results;
}
