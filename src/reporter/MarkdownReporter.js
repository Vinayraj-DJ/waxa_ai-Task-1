/**
 * Formats full benchmark metrics into clean GitHub-Flavored Markdown tables
 * for README.md inclusion.
 */
export function generateMarkdownReport(resultsMap, platformSpecs) {
  const platformKeys = Object.keys(resultsMap);

  let md = `## Benchmark Results Matrix\n\n`;

  // 1. Data Ingest Throughput Table
  md += `### 1. Data Ingest Throughput (10,000 Nodes, 100,000 Relationships)\n\n`;
  md += `| Platform | Nodes / Sec | Rels / Sec | Total Wall Time (s) | Ingest Method |\n`;
  md += `| :--- | :---: | :---: | :---: | :--- |\n`;
  for (const key of platformKeys) {
    const res = resultsMap[key];
    const spec = platformSpecs[key] || {};
    md += `| **${spec.name || key}** | ${res.ingest.nodesPerSec.toLocaleString()} | ${res.ingest.relsPerSec.toLocaleString()} | ${res.ingest.totalWallClockTimeSec}s | UNWIND Batching (1k size) |\n`;
  }
  md += `\n`;

  // 2. Graph Traversals Table
  md += `### 2. Graph Traversal Latency (Cold & Warm Percentiles in ms)\n\n`;
  md += `| Platform | 1-Hop Cold | 1-Hop p50 | 1-Hop p95 | 2-Hop p50 | 2-Hop p95 | 3-Hop p50 | 3-Hop p95 |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
  for (const key of platformKeys) {
    const res = resultsMap[key];
    const spec = platformSpecs[key] || {};
    const t = res.traversals;
    md += `| **${spec.name || key}** | ${t.hop1.coldLatencyMs}ms | ${t.hop1.p50}ms | ${t.hop1.p95}ms | ${t.hop2.p50}ms | ${t.hop2.p95}ms | ${t.hop3.p50}ms | ${t.hop3.p95}ms |\n`;
  }
  md += `\n`;

  // 3. Lookups & Aggregations Table
  md += `### 3. Lookups & Aggregations Latency (p50 & p95 in ms)\n\n`;
  md += `| Platform | Point Lookup p50 | Point Lookup p95 | Indexed Lookup p50 | Indexed Lookup p95 | Aggregation p50 | Aggregation p95 |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
  for (const key of platformKeys) {
    const res = resultsMap[key];
    const spec = platformSpecs[key] || {};
    const l = res.lookups;
    const a = res.aggregations;
    md += `| **${spec.name || key}** | ${l.pointLookup.p50}ms | ${l.pointLookup.p95}ms | ${l.indexedLookup.p50}ms | ${l.indexedLookup.p95}ms | ${a.p50}ms | ${a.p95}ms |\n`;
  }
  md += `\n`;

  // 4. Mixed Workload & Concurrency Sweeps Table
  md += `### 4. Mixed Workload Concurrency Sweeps (Sustained QPS @ 90% Read / 10% Write)\n\n`;
  md += `| Platform | 1 Client (QPS) | 10 Clients (QPS) | 20 Clients (QPS) | 40 Clients (QPS) | 40 Clients p95 Latency |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;
  for (const key of platformKeys) {
    const res = resultsMap[key];
    const spec = platformSpecs[key] || {};
    const c = res.concurrency;
    md += `| **${spec.name || key}** | ${c.c1.qps} | ${c.c10.qps} | ${c.c20.qps} | ${c.c40.qps} | ${c.c40.p95}ms |\n`;
  }
  md += `\n`;

  // 5. Memory & Observable Resource Footprint Table
  md += `### 5. Hardware & Observable Footprint Parity\n\n`;
  md += `| Platform | Advertised Tier | vCPU Allocation | RAM Limit | Stored Size | Observable RAM Footprint |\n`;
  md += `| :--- | :--- | :--- | :--- | :---: | :---: |\n`;
  for (const key of platformKeys) {
    const spec = platformSpecs[key] || {};
    const foot = resultsMap[key]?.footprint || {};
    md += `| **${spec.name || key}** | ${spec.tier} | ${spec.vcpu} | ${spec.ram} | ${foot.storedDataSizeMb || 'N/A'} | ${foot.memoryUsageMb || 'N/A'} |\n`;
  }
  md += `\n`;

  return md;
}
