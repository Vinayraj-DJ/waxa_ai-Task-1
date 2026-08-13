import { startTimer } from '../utils/timer.js';
import { calculateStats } from '../utils/stats.js';
import { logger } from '../utils/logger.js';

export async function runConcurrencyBenchmark(driver, dataset, concurrencyLevels = [1, 10, 20, 40], testDurationSec = 5) {
  logger.info(`Running Concurrency Sweeps (${concurrencyLevels.join(', ')} workers, 90% read / 10% write) on ${driver.name}...`);

  const concurrencyResults = {};

  for (const concurrency of concurrencyLevels) {
    logger.info(`Executing concurrency sweep with ${concurrency} workers...`);

    const latencyMeasurements = [];
    let totalQueriesExecuted = 0;
    const startTime = Date.now();
    const endTime = startTime + (testDurationSec * 1000);

    const workerTasks = [];

    for (let w = 0; w < concurrency; w++) {
      workerTasks.push((async () => {
        let localCount = 0;
        let counter = 0;
        while (Date.now() < endTime) {
          counter++;
          const isWrite = (counter % 10 === 0); // 90% Read / 10% Write mix
          const timer = startTimer();

          try {
            if (isWrite) {
              // 10% Write Query: Insert Single User Node
              const newId = `usr_w_${w}_${counter}_${Date.now()}`;
              await driver.insertSingleNode({
                id: newId,
                name: `Concurrent_User_${counter}`,
                age: 25,
                city: 'Austin',
                created_at: Math.floor(Date.now() / 1000)
              });
            } else {
              // 90% Read Query: Random 1-Hop Traversal or Lookup
              const randomIdx = Math.floor(Math.random() * dataset.nodes.length);
              const nodeId = dataset.nodes[randomIdx].id;
              if (counter % 2 === 0) {
                await driver.queryTraversal1Hop(nodeId);
              } else {
                await driver.queryPointLookup(nodeId);
              }
            }
            latencyMeasurements.push(timer.elapsedMs());
            localCount++;
          } catch (err) {
            // Log & track transient error / throttling under high concurrency
          }
        }
        return localCount;
      })());
    }

    const counts = await Promise.all(workerTasks);
    totalQueriesExecuted = counts.reduce((a, b) => a + b, 0);

    const actualDurationSec = (Date.now() - startTime) / 1000;
    const qps = Math.round((totalQueriesExecuted / actualDurationSec) * 100) / 100;
    const stats = calculateStats(latencyMeasurements);

    concurrencyResults[`c${concurrency}`] = {
      concurrency,
      qps,
      totalQueriesExecuted,
      durationSec: Math.round(actualDurationSec * 10) / 10,
      p50: stats.p50,
      p95: stats.p95,
      p99: stats.p99
    };

    logger.success(`Concurrency ${concurrency} workers for ${driver.name}: ${qps} QPS | p50=${stats.p50}ms | p95=${stats.p95}ms`);
  }

  return concurrencyResults;
}
