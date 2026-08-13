import { startTimer } from '../utils/timer.js';
import { logger } from '../utils/logger.js';

export async function runIngestBenchmark(driver, dataset, batchSize = 1000) {
  logger.info(`Running Data Ingest Benchmark on ${driver.name}...`);

  await driver.clearDatabase().catch(err => console.warn(`Clear warning: ${err.message}`));

  // 1. Measure Node Insertion
  const nodeTimer = startTimer();
  await driver.batchInsertNodes(dataset.nodes, batchSize);
  const nodeTimeMs = nodeTimer.elapsedMs();
  const nodesPerSec = Math.round((dataset.nodes.length / (nodeTimeMs / 1000)) * 100) / 100;

  // 2. Measure Relationship Insertion
  const edgeTimer = startTimer();
  await driver.batchInsertRelationships(dataset.edges, batchSize);
  const edgeTimeMs = edgeTimer.elapsedMs();
  const relsPerSec = Math.round((dataset.edges.length / (edgeTimeMs / 1000)) * 100) / 100;

  // 3. Create indexes after load
  const indexTimer = startTimer();
  await driver.createIndexes().catch(() => {});
  const indexTimeMs = indexTimer.elapsedMs();

  const totalWallClockTimeSec = Math.round(((nodeTimeMs + edgeTimeMs + indexTimeMs) / 1000) * 100) / 100;

  const result = {
    nodesPerSec,
    relsPerSec,
    nodeTimeMs: Math.round(nodeTimeMs),
    edgeTimeMs: Math.round(edgeTimeMs),
    totalWallClockTimeSec
  };

  logger.success(`Ingest complete for ${driver.name}: ${nodesPerSec} nodes/s, ${relsPerSec} rels/s (${totalWallClockTimeSec}s total)`);
  return result;
}
