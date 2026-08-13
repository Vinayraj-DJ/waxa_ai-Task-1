import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

const CITIES = ['San Francisco', 'New York', 'London', 'Tokyo', 'Berlin', 'Toronto', 'Sydney', 'Singapore', 'Austin', 'Paris'];
const NAMES = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Sam', 'Chris', 'Pat', 'Riley', 'Casey', 'Avery', 'Devon', 'Logan', 'Quinn', 'Reese', 'Skyler'];

/**
 * Generates a power-law scale-free graph (Barabási-Albert model)
 * dataset containing 10,000 nodes and 100,000+ relationships.
 */
export function generateSyntheticDataset(numNodes = 10000, targetEdges = 100000) {
  console.log(`[Dataset] Generating synthetic graph dataset (${numNodes} nodes, ~${targetEdges} relationships)...`);
  
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const nodes = [];
  for (let i = 1; i <= numNodes; i++) {
    nodes.push({
      id: `usr_${i}`,
      name: `${NAMES[i % NAMES.length]}_${i}`,
      age: 18 + (i % 55),
      city: CITIES[i % CITIES.length],
      created_at: 1600000000 + (i * 3600)
    });
  }

  const edges = [];
  const edgeSet = new Set();
  const edgesPerNode = Math.ceil(targetEdges / numNodes);

  // Power law distribution setup: node degree tracking
  const nodeDegrees = new Array(numNodes + 1).fill(1);
  let totalDegrees = numNodes;

  for (let sourceIdx = 1; sourceIdx <= numNodes; sourceIdx++) {
    const sourceId = `usr_${sourceIdx}`;
    let addedForNode = 0;

    // Connect to hubs using preferential attachment
    for (let attempts = 0; attempts < edgesPerNode * 3 && addedForNode < edgesPerNode; attempts++) {
      let targetIdx = Math.floor(Math.random() * numNodes) + 1;
      
      // Preferential attachment probability check
      const prob = nodeDegrees[targetIdx] / totalDegrees;
      if (Math.random() < prob || attempts > edgesPerNode * 2) {
        if (targetIdx !== sourceIdx) {
          const targetId = `usr_${targetIdx}`;
          const key = `${sourceId}->${targetId}`;
          
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            edges.push({
              source: sourceId,
              target: targetId,
              since: 2018 + (edges.length % 7),
              weight: Math.round((Math.random() * 10) * 100) / 100
            });
            nodeDegrees[sourceIdx]++;
            nodeDegrees[targetIdx]++;
            totalDegrees += 2;
            addedForNode++;
          }
        }
      }
    }
  }

  // Ensure minimum edge count threshold reached
  while (edges.length < targetEdges) {
    const sourceIdx = Math.floor(Math.random() * numNodes) + 1;
    const targetIdx = Math.floor(Math.random() * numNodes) + 1;
    if (sourceIdx !== targetIdx) {
      const sourceId = `usr_${sourceIdx}`;
      const targetId = `usr_${targetIdx}`;
      const key = `${sourceId}->${targetId}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({
          source: sourceId,
          target: targetId,
          since: 2020 + (edges.length % 5),
          weight: Math.round((Math.random() * 5) * 100) / 100
        });
      }
    }
  }

  const dataset = {
    metadata: {
      generatedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      relationshipCount: edges.length,
      datasetName: "Synthetic Pokec-Scale Social Network Graph",
      schema: {
        nodeLabel: "User",
        relationshipType: "FOLLOWS",
        indexedProperty: "city"
      }
    },
    nodes,
    edges
  };

  const jsonPath = path.join(DATA_DIR, 'dataset.json');
  fs.writeFileSync(jsonPath, JSON.stringify(dataset, null, 2));

  // Also write CSV files for databases with native CSV loaders
  const nodesCsvHeader = "id:ID(User),name,age:INT,city,created_at:INT\n";
  const nodesCsvBody = nodes.map(n => `${n.id},${n.name},${n.age},${n.city},${n.created_at}`).join("\n");
  fs.writeFileSync(path.join(DATA_DIR, 'nodes.csv'), nodesCsvHeader + nodesCsvBody);

  const edgesCsvHeader = ":START_ID(User),:END_ID(User),since:INT,weight:FLOAT\n";
  const edgesCsvBody = edges.map(e => `${e.source},${e.target},${e.since},${e.weight}`).join("\n");
  fs.writeFileSync(path.join(DATA_DIR, 'edges.csv'), edgesCsvHeader + edgesCsvBody);

  console.log(`[Dataset] Successfully created dataset with ${nodes.length} nodes & ${edges.length} relationships!`);
  return dataset;
}

export function loadOrGenerateDataset() {
  const jsonPath = path.join(DATA_DIR, 'dataset.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      const data = JSON.parse(raw);
      console.log(`[Dataset] Loaded cached dataset (${data.nodes.length} nodes, ${data.edges.length} edges).`);
      return data;
    } catch (e) {
      console.warn(`[Dataset] Cached dataset invalid, re-generating...`);
    }
  }
  return generateSyntheticDataset();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSyntheticDataset();
}
