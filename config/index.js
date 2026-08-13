import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawPlatformSpecs = fs.readFileSync(path.join(__dirname, 'platform-specs.json'), 'utf8');
export const PLATFORM_SPECS = JSON.parse(rawPlatformSpecs);

export const CONFIG = {
  cognodb: {
    uri: process.env.COGNODB_URI || 'bolt+s://demo.databases.cognodb.cloud',
    user: process.env.COGNODB_USER || 'cognodb',
    password: process.env.COGNODB_PASSWORD || 'password123',
    enabled: true
  },
  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    user: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password123',
    enabled: true
  },
  memgraph: {
    uri: process.env.MEMGRAPH_URI || 'bolt://localhost:7688',
    user: process.env.MEMGRAPH_USER || 'memgraph',
    password: process.env.MEMGRAPH_PASSWORD || 'memgraph',
    enabled: true
  },
  falkordb: {
    host: process.env.FALKORDB_HOST || 'localhost',
    port: parseInt(process.env.FALKORDB_PORT || '6379', 10),
    password: process.env.FALKORDB_PASSWORD || '',
    graphName: 'benchmark_graph',
    enabled: true
  },
  arangodb: {
    url: process.env.ARANGODB_URL || 'http://localhost:8529',
    database: process.env.ARANGODB_DB || '_system',
    user: process.env.ARANGODB_USER || 'root',
    password: process.env.ARANGODB_PASSWORD || 'password123',
    enabled: true
  },
  benchmark: {
    iterations: parseInt(process.env.BENCHMARK_ITERATIONS || '100', 10),
    warmupIterations: 20,
    concurrencyLevels: (process.env.CONCURRENCY_LEVELS || '1,10,20,40').split(',').map(Number),
    batchSize: parseInt(process.env.BATCH_SIZE || '1000', 10),
    datasetNodes: parseInt(process.env.DATASET_NODES || '10000', 10),
    datasetEdges: parseInt(process.env.DATASET_EDGES || '100000', 10)
  }
};
