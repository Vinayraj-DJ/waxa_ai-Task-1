import fs from 'fs';
import path from 'path';

/**
 * Generates an interactive Chart.js HTML report visualization dashboard
 */
export function generateHTMLReport(resultsMap, platformSpecs, outputPath) {
  const platformKeys = Object.keys(resultsMap);
  const labels = platformKeys.map(k => platformSpecs[k]?.name || k);

  const ingestNodes = platformKeys.map(k => resultsMap[k].ingest.nodesPerSec);
  const ingestRels = platformKeys.map(k => resultsMap[k].ingest.relsPerSec);

  const hop1p50 = platformKeys.map(k => resultsMap[k].traversals.hop1.p50);
  const hop2p50 = platformKeys.map(k => resultsMap[k].traversals.hop2.p50);
  const hop3p50 = platformKeys.map(k => resultsMap[k].traversals.hop3.p50);

  const conc10 = platformKeys.map(k => resultsMap[k].concurrency.c10.qps);
  const conc40 = platformKeys.map(k => resultsMap[k].concurrency.c40.qps);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Graph Database Cloud Benchmarking Dashboard | Wexa AI</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap">
  <style>
    :root {
      --bg-dark: #0f172a;
      --card-bg: #1e293b;
      --border-color: #334155;
      --accent-cyan: #38bdf8;
      --accent-violet: #818cf8;
      --accent-green: #34d399;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-main);
      padding: 2rem;
      line-height: 1.6;
    }
    header {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1.5rem;
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 800;
      background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.subtitle {
      color: var(--text-muted);
      font-size: 1rem;
      margin-top: 0.5rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
    }
    .card h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--accent-cyan);
      margin-bottom: 1rem;
    }
    canvas {
      width: 100% !important;
      height: 320px !important;
    }
    .badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.1);
      color: var(--accent-cyan);
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>Graph Database Cloud Benchmarking Dashboard</h1>
    <p class="subtitle">CognoDB Cloud vs Neo4j, Memgraph, FalkorDB, and ArangoDB under 0.5 vCPU / 256MB RAM Tier Parity</p>
    <div style="margin-top: 1rem;">
      <span class="badge">Dataset: 10,000 Nodes | 100,000 Relationships</span>
      <span class="badge" style="margin-left: 0.5rem;">Client: 90% Read / 10% Write Mix</span>
    </div>
  </header>

  <div class="grid">
    <div class="card">
      <h3>Data Ingest Throughput (Ops / Sec)</h3>
      <canvas id="ingestChart"></canvas>
    </div>
    <div class="card">
      <h3>Graph Traversal p50 Latency (ms) - Hop Depth 1, 2, 3</h3>
      <canvas id="traversalChart"></canvas>
    </div>
    <div class="card">
      <h3>Mixed Workload Concurrency Sweeps (QPS)</h3>
      <canvas id="concurrencyChart"></canvas>
    </div>
    <div class="card">
      <h3>Lookup & Aggregation Latency (p95 ms)</h3>
      <canvas id="lookupChart"></canvas>
    </div>
  </div>

  <script>
    const labels = ${JSON.stringify(labels)};

    // Chart 1: Ingest
    new Chart(document.getElementById('ingestChart'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Nodes / sec', data: ${JSON.stringify(ingestNodes)}, backgroundColor: '#38bdf8' },
          { label: 'Rels / sec', data: ${JSON.stringify(ingestRels)}, backgroundColor: '#818cf8' }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
        }
      }
    });

    // Chart 2: Traversals
    new Chart(document.getElementById('traversalChart'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: '1-Hop p50 (ms)', data: ${JSON.stringify(hop1p50)}, backgroundColor: '#34d399' },
          { label: '2-Hop p50 (ms)', data: ${JSON.stringify(hop2p50)}, backgroundColor: '#fbbf24' },
          { label: '3-Hop p50 (ms)', data: ${JSON.stringify(hop3p50)}, backgroundColor: '#f87171' }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
        }
      }
    });

    // Chart 3: Concurrency
    new Chart(document.getElementById('concurrencyChart'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: '10 Clients QPS', data: ${JSON.stringify(conc10)}, borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.2)', fill: true, tension: 0.3 },
          { label: '40 Clients QPS', data: ${JSON.stringify(conc40)}, borderColor: '#818cf8', backgroundColor: 'rgba(129,140,248,0.2)', fill: true, tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
        }
      }
    });

    // Chart 4: Lookups & Aggregations
    new Chart(document.getElementById('lookupChart'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Point Lookup p95 (ms)', data: ${JSON.stringify(platformKeys.map(k => resultsMap[k].lookups.pointLookup.p95))}, backgroundColor: '#a78bfa' },
          { label: 'Indexed Lookup p95 (ms)', data: ${JSON.stringify(platformKeys.map(k => resultsMap[k].lookups.indexedLookup.p95))}, backgroundColor: '#f472b6' },
          { label: 'Aggregation p95 (ms)', data: ${JSON.stringify(platformKeys.map(k => resultsMap[k].aggregations.p95))}, backgroundColor: '#38bdf8' }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
        }
      }
    });
  </script>
</body>
</html>`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, htmlContent, 'utf8');
}
