export class BaseDriver {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.isConnected = false;
  }

  async connect() {
    throw new Error(`connect() not implemented for ${this.name}`);
  }

  async disconnect() {
    throw new Error(`disconnect() not implemented for ${this.name}`);
  }

  async clearDatabase() {
    throw new Error(`clearDatabase() not implemented for ${this.name}`);
  }

  async createIndexes() {
    throw new Error(`createIndexes() not implemented for ${this.name}`);
  }

  async batchInsertNodes(nodes, batchSize = 1000) {
    throw new Error(`batchInsertNodes() not implemented for ${this.name}`);
  }

  async batchInsertRelationships(edges, batchSize = 1000) {
    throw new Error(`batchInsertRelationships() not implemented for ${this.name}`);
  }

  async queryTraversal1Hop(startNodeId) {
    throw new Error(`queryTraversal1Hop() not implemented for ${this.name}`);
  }

  async queryTraversal2Hop(startNodeId) {
    throw new Error(`queryTraversal2Hop() not implemented for ${this.name}`);
  }

  async queryTraversal3Hop(startNodeId) {
    throw new Error(`queryTraversal3Hop() not implemented for ${this.name}`);
  }

  async queryPointLookup(nodeId) {
    throw new Error(`queryPointLookup() not implemented for ${this.name}`);
  }

  async queryIndexedLookup(city, age) {
    throw new Error(`queryIndexedLookup() not implemented for ${this.name}`);
  }

  async queryAggregation() {
    throw new Error(`queryAggregation() not implemented for ${this.name}`);
  }

  async insertSingleNode(node) {
    throw new Error(`insertSingleNode() not implemented for ${this.name}`);
  }

  async getObservableFootprint() {
    return {
      storedDataSizeMb: "Not observable",
      memoryUsageMb: "Not observable",
      instanceSpecs: `${this.config.vcpu || '0.5 vCPU'}, ${this.config.ram || '256 MB RAM'}`
    };
  }
}
