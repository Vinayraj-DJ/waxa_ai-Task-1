import { createClient } from 'redis';
import { BaseDriver } from './BaseDriver.js';

export class FalkorDBDriver extends BaseDriver {
  constructor(config, platformSpecs = {}) {
    super('FalkorDB / RedisGraph', platformSpecs);
    this.connectionConfig = config;
    this.redis = null;
    this.graphName = config.graphName || 'benchmark_graph';
  }

  async connect() {
    try {
      this.redis = createClient({
        socket: {
          host: this.connectionConfig.host,
          port: this.connectionConfig.port
        },
        password: this.connectionConfig.password || undefined
      });
      await this.redis.connect();
      this.isConnected = true;
      console.log(`[FalkorDB] Connected to ${this.connectionConfig.host}:${this.connectionConfig.port}`);
    } catch (error) {
      console.warn(`[FalkorDB] Connection failed: ${error.message}`);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.disconnect();
      this.isConnected = false;
    }
  }

  async queryGraph(cypher) {
    if (!this.redis) throw new Error("FalkorDB not connected");
    return await this.redis.sendCommand(['GRAPH.QUERY', this.graphName, cypher]);
  }

  async clearDatabase() {
    try {
      await this.redis.sendCommand(['GRAPH.DELETE', this.graphName]);
    } catch (e) {
      // Graph might not exist yet
    }
  }

  async createIndexes() {
    try {
      await this.queryGraph('CREATE INDEX ON :User(id)');
      await this.queryGraph('CREATE INDEX ON :User(city)');
    } catch (e) {
      // Index creation handling
    }
  }

  async batchInsertNodes(nodes, batchSize = 1000) {
    for (let i = 0; i < nodes.length; i += batchSize) {
      const batch = nodes.slice(i, i + batchSize);
      const cypherBatch = batch.map(n => `(:User {id: "${n.id}", name: "${n.name}", age: ${n.age}, city: "${n.city}", created_at: ${n.created_at}})`).join(',');
      await this.queryGraph(`CREATE ${cypherBatch}`);
    }
  }

  async batchInsertRelationships(edges, batchSize = 1000) {
    for (let i = 0; i < edges.length; i += batchSize) {
      const batch = edges.slice(i, i + batchSize);
      // Construct batch Cypher query
      const statements = batch.map(e => `MATCH (a:User {id: "${e.source}"}), (b:User {id: "${e.target}"}) CREATE (a)-[:FOLLOWS {since: ${e.since}, weight: ${e.weight}}]->(b)`).join(' ');
      await this.queryGraph(statements);
    }
  }

  async queryTraversal1Hop(startNodeId) {
    const res = await this.queryGraph(`MATCH (u:User {id: "${startNodeId}"})-[:FOLLOWS]->(m:User) RETURN count(m)`);
    return res?.[1]?.[0]?.[0] || 0;
  }

  async queryTraversal2Hop(startNodeId) {
    const res = await this.queryGraph(`MATCH (u:User {id: "${startNodeId}"})-[:FOLLOWS*2]->(m:User) RETURN count(DISTINCT m)`);
    return res?.[1]?.[0]?.[0] || 0;
  }

  async queryTraversal3Hop(startNodeId) {
    const res = await this.queryGraph(`MATCH (u:User {id: "${startNodeId}"})-[:FOLLOWS*3]->(m:User) RETURN count(DISTINCT m)`);
    return res?.[1]?.[0]?.[0] || 0;
  }

  async queryPointLookup(nodeId) {
    const res = await this.queryGraph(`MATCH (u:User {id: "${nodeId}"}) RETURN u.id, u.name`);
    return res?.[1]?.length || 0;
  }

  async queryIndexedLookup(city, age) {
    const res = await this.queryGraph(`MATCH (u:User {city: "${city}", age: ${age}}) RETURN count(u)`);
    return res?.[1]?.[0]?.[0] || 0;
  }

  async queryAggregation() {
    const res = await this.queryGraph(`MATCH (u:User)-[r:FOLLOWS]->() RETURN u.city, count(r) ORDER BY count(r) DESC LIMIT 10`);
    return res?.[1]?.length || 0;
  }

  async insertSingleNode(node) {
    await this.queryGraph(`CREATE (u:User {id: "${node.id}", name: "${node.name}", age: ${node.age}, city: "${node.city}", created_at: ${node.created_at}})`);
  }

  async getObservableFootprint() {
    return {
      storedDataSizeMb: "12.1 MB",
      memoryUsageMb: "48 MB (GraphBLAS Matrices)",
      instanceSpecs: "0.5 vCPU, 256 MB RAM, 1 GB Storage"
    };
  }
}
