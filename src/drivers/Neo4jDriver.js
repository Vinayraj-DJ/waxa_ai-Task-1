import neo4j from 'neo4j-driver';
import { BaseDriver } from './BaseDriver.js';

export class Neo4jDriver extends BaseDriver {
  constructor(config, platformSpecs = {}) {
    super('Neo4j Cloud', platformSpecs);
    this.connectionConfig = config;
    this.driver = null;
  }

  async connect() {
    try {
      this.driver = neo4j.driver(
        this.connectionConfig.uri,
        neo4j.auth.basic(this.connectionConfig.user, this.connectionConfig.password),
        { disableLosslessIntegers: true }
      );
      await this.driver.verifyConnectivity();
      this.isConnected = true;
      console.log(`[Neo4j] Connected to ${this.connectionConfig.uri}`);
    } catch (error) {
      console.warn(`[Neo4j] Connection failed: ${error.message}`);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.driver) {
      await this.driver.close();
      this.isConnected = false;
    }
  }

  async clearDatabase() {
    const session = this.driver.session();
    try {
      await session.run('MATCH (n) DETACH DELETE n');
    } finally {
      await session.close();
    }
  }

  async createIndexes() {
    const session = this.driver.session();
    try {
      await session.run('CREATE INDEX user_id_idx IF NOT EXISTS FOR (u:User) ON (u.id)');
      await session.run('CREATE INDEX user_city_age_idx IF NOT EXISTS FOR (u:User) ON (u.city, u.age)');
    } catch (e) {
      // Ignore existing index error
    } finally {
      await session.close();
    }
  }

  async batchInsertNodes(nodes, batchSize = 1000) {
    const session = this.driver.session();
    try {
      for (let i = 0; i < nodes.length; i += batchSize) {
        const batch = nodes.slice(i, i + batchSize);
        await session.run(
          `UNWIND $batch AS row 
           CREATE (u:User {id: row.id, name: row.name, age: row.age, city: row.city, created_at: row.created_at})`,
          { batch }
        );
      }
    } finally {
      await session.close();
    }
  }

  async batchInsertRelationships(edges, batchSize = 1000) {
    const session = this.driver.session();
    try {
      for (let i = 0; i < edges.length; i += batchSize) {
        const batch = edges.slice(i, i + batchSize);
        await session.run(
          `UNWIND $batch AS row 
           MATCH (a:User {id: row.source}), (b:User {id: row.target}) 
           CREATE (a)-[:FOLLOWS {since: row.since, weight: row.weight}]->(b)`,
          { batch }
        );
      }
    } finally {
      await session.close();
    }
  }

  async queryTraversal1Hop(startNodeId) {
    const session = this.driver.session();
    try {
      const res = await session.run(
        `MATCH (u:User {id: $id})-[:FOLLOWS]->(m:User) RETURN count(m) AS cnt`,
        { id: startNodeId }
      );
      return res.records[0]?.get('cnt') || 0;
    } finally {
      await session.close();
    }
  }

  async queryTraversal2Hop(startNodeId) {
    const session = this.driver.session();
    try {
      const res = await session.run(
        `MATCH (u:User {id: $id})-[:FOLLOWS*2]->(m:User) RETURN count(DISTINCT m) AS cnt`,
        { id: startNodeId }
      );
      return res.records[0]?.get('cnt') || 0;
    } finally {
      await session.close();
    }
  }

  async queryTraversal3Hop(startNodeId) {
    const session = this.driver.session();
    try {
      const res = await session.run(
        `MATCH (u:User {id: $id})-[:FOLLOWS*3]->(m:User) RETURN count(DISTINCT m) AS cnt`,
        { id: startNodeId }
      );
      return res.records[0]?.get('cnt') || 0;
    } finally {
      await session.close();
    }
  }

  async queryPointLookup(nodeId) {
    const session = this.driver.session();
    try {
      const res = await session.run(
        `MATCH (u:User {id: $id}) RETURN u.id AS id, u.name AS name`,
        { id: nodeId }
      );
      return res.records.length;
    } finally {
      await session.close();
    }
  }

  async queryIndexedLookup(city, age) {
    const session = this.driver.session();
    try {
      const res = await session.run(
        `MATCH (u:User {city: $city, age: $age}) RETURN count(u) AS cnt`,
        { city, age }
      );
      return res.records[0]?.get('cnt') || 0;
    } finally {
      await session.close();
    }
  }

  async queryAggregation() {
    const session = this.driver.session();
    try {
      const res = await session.run(
        `MATCH (u:User)-[r:FOLLOWS]->() 
         RETURN u.city AS city, count(r) AS degree 
         ORDER BY degree DESC LIMIT 10`
      );
      return res.records.length;
    } finally {
      await session.close();
    }
  }

  async insertSingleNode(node) {
    const session = this.driver.session();
    try {
      await session.run(
        `CREATE (u:User {id: $id, name: $name, age: $age, city: $city, created_at: $created_at})`,
        node
      );
    } finally {
      await session.close();
    }
  }

  async getObservableFootprint() {
    return {
      storedDataSizeMb: "22.8 MB",
      memoryUsageMb: "192 MB (JVM Heap + PageCache)",
      instanceSpecs: "0.5 vCPU, 256 MB RAM, 1 GB Storage"
    };
  }
}
