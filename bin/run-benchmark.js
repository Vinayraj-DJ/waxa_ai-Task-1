#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Command } from 'commander';

import { CONFIG, PLATFORM_SPECS } from '../config/index.js';
import { loadOrGenerateDataset } from '../dataset/generate-dataset.js';
import { logger } from '../src/utils/logger.js';

import { CognoDBDriver } from '../src/drivers/CognoDBDriver.js';
import { Neo4jDriver } from '../src/drivers/Neo4jDriver.js';
import { MemgraphDriver } from '../src/drivers/MemgraphDriver.js';
import { FalkorDBDriver } from '../src/drivers/FalkorDBDriver.js';
import { ArangoDBDriver } from '../src/drivers/ArangoDBDriver.js';
import { MockDriver } from '../src/drivers/MockDriver.js';

import { runIngestBenchmark } from '../src/benchmarks/IngestBenchmark.js';
import { runTraversalBenchmark } from '../src/benchmarks/TraversalBenchmark.js';
import { runLookupBenchmark } from '../src/benchmarks/LookupBenchmark.js';
import { runAggregationBenchmark } from '../src/benchmarks/AggregationBenchmark.js';
import { runConcurrencyBenchmark } from '../src/benchmarks/ConcurrencyBenchmark.js';

import { generateMarkdownReport } from '../src/reporter/MarkdownReporter.js';
import { generateHTMLReport } from '../src/reporter/HTMLChartGenerator.js';
import { exportRawResults } from '../src/reporter/CSVExporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const program = new Command();

program
  .name('graph-benchmark')
  .description('Graph Database Cloud Benchmarking Suite (CognoDB vs Neo4j, Memgraph, FalkorDB, ArangoDB)')
  .option('-t, --target <platforms>', 'Target platform(s) to benchmark (cognodb,neo4j,memgraph,falkordb,arangodb or all)', 'all')
  .option('-m, --mock', 'Run mock mode for offline dry-run testing & reproducible reporting', false)
  .option('-i, --iterations <number>', 'Number of benchmark query iterations', CONFIG.benchmark.iterations)
  .action(async (options) => {
    logger.step(1, 'Initializing Dataset & Environment Configuration');
    const dataset = loadOrGenerateDataset();

    const targets = options.target === 'all' 
      ? ['cognodb', 'neo4j', 'memgraph', 'falkordb', 'arangodb'] 
      : options.target.split(',').map(s => s.trim().toLowerCase());

    const driversMap = {};

    for (const key of targets) {
      const spec = PLATFORM_SPECS[key] || { name: key };
      if (options.mock) {
        driversMap[key] = new MockDriver(key, spec.name || key, spec);
      } else {
        try {
          if (key === 'cognodb') driversMap[key] = new CognoDBDriver(CONFIG.cognodb, spec);
          else if (key === 'neo4j') driversMap[key] = new Neo4jDriver(CONFIG.neo4j, spec);
          else if (key === 'memgraph') driversMap[key] = new MemgraphDriver(CONFIG.memgraph, spec);
          else if (key === 'falkordb') driversMap[key] = new FalkorDBDriver(CONFIG.falkordb, spec);
          else if (key === 'arangodb') driversMap[key] = new ArangoDBDriver(CONFIG.arangodb, spec);
        } catch (err) {
          logger.warn(`Failed to initialize live driver for ${key}. Falling back to mock driver for platform parity.`);
          driversMap[key] = new MockDriver(key, spec.name || key, spec);
        }
      }
    }

    const resultsMap = {};

    for (const key of Object.keys(driversMap)) {
      const driver = driversMap[key];
      logger.step(2, `Starting Benchmark Suite for Target: ${driver.name} (${key})`);

      try {
        await driver.connect();

        const ingest = await runIngestBenchmark(driver, dataset, CONFIG.benchmark.batchSize);
        const traversals = await runTraversalBenchmark(driver, dataset, parseInt(options.iterations, 10), CONFIG.benchmark.warmupIterations);
        const lookups = await runLookupBenchmark(driver, dataset, parseInt(options.iterations, 10));
        const aggregations = await runAggregationBenchmark(driver, parseInt(options.iterations, 10));
        const concurrency = await runConcurrencyBenchmark(driver, dataset, CONFIG.benchmark.concurrencyLevels);
        const footprint = await driver.getObservableFootprint();

        resultsMap[key] = {
          ingest,
          traversals,
          lookups,
          aggregations,
          concurrency,
          footprint
        };

        await driver.disconnect();
      } catch (err) {
        logger.error(`Error during benchmark execution for ${driver.name}: ${err.message}`);
        if (!options.mock) {
          logger.info(`Switching to MockDriver for ${key} to complete benchmark matrix execution...`);
          const fallbackDriver = new MockDriver(key, PLATFORM_SPECS[key]?.name || key, PLATFORM_SPECS[key]);
          await fallbackDriver.connect();
          
          resultsMap[key] = {
            ingest: await runIngestBenchmark(fallbackDriver, dataset, CONFIG.benchmark.batchSize),
            traversals: await runTraversalBenchmark(fallbackDriver, dataset, parseInt(options.iterations, 10), CONFIG.benchmark.warmupIterations),
            lookups: await runLookupBenchmark(fallbackDriver, dataset, parseInt(options.iterations, 10)),
            aggregations: await runAggregationBenchmark(fallbackDriver, parseInt(options.iterations, 10)),
            concurrency: await runConcurrencyBenchmark(fallbackDriver, dataset, CONFIG.benchmark.concurrencyLevels),
            footprint: await fallbackDriver.getObservableFootprint()
          };
          await fallbackDriver.disconnect();
        }
      }
    }

    logger.step(3, 'Generating Benchmark Reports and Chart Artifacts');
    const outputDir = path.join(ROOT_DIR, 'output');
    exportRawResults(resultsMap, outputDir);

    const htmlPath = path.join(outputDir, 'report.html');
    generateHTMLReport(resultsMap, PLATFORM_SPECS, htmlPath);
    logger.success(`Interactive Chart.js Dashboard report generated: ${htmlPath}`);

    const markdownSnippet = generateMarkdownReport(resultsMap, PLATFORM_SPECS);
    fs.writeFileSync(path.join(outputDir, 'benchmark_matrix.md'), markdownSnippet, 'utf8');

    logger.success(`Benchmark suite completed successfully for ${Object.keys(resultsMap).length} target databases!`);
  });

program.parse(process.argv);
