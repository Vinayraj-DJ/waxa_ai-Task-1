import fs from 'fs';
import path from 'path';

export function exportRawResults(resultsMap, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Write full raw JSON
  const jsonPath = path.join(outputDir, 'benchmark_results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(resultsMap, null, 2));

  // 2. Write CSV summary
  const csvPath = path.join(outputDir, 'benchmark_summary.csv');
  let csv = 'platform,nodes_per_sec,rels_per_sec,ingest_time_sec,hop1_p50_ms,hop1_p95_ms,hop2_p50_ms,hop2_p95_ms,hop3_p50_ms,hop3_p95_ms,point_lookup_p50_ms,indexed_lookup_p50_ms,agg_p50_ms,qps_c1,qps_c10,qps_c20,qps_c40\n';

  for (const key of Object.keys(resultsMap)) {
    const r = resultsMap[key];
    csv += `${key},${r.ingest.nodesPerSec},${r.ingest.relsPerSec},${r.ingest.totalWallClockTimeSec},${r.traversals.hop1.p50},${r.traversals.hop1.p95},${r.traversals.hop2.p50},${r.traversals.hop2.p95},${r.traversals.hop3.p50},${r.traversals.hop3.p95},${r.lookups.pointLookup.p50},${r.lookups.indexedLookup.p50},${r.aggregations.p50},${r.concurrency.c1.qps},${r.concurrency.c10.qps},${r.concurrency.c20.qps},${r.concurrency.c40.qps}\n`;
  }

  fs.writeFileSync(csvPath, csv);
  console.log(`[Exporter] Raw telemetry exported to ${jsonPath} and ${csvPath}`);
}
