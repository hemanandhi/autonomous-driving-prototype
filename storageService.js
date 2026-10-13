const { getStorageStatus } = require('../config/database');
const demoStore = require('../utils/demoStore');
const Simulation = require('../models/Simulation');
const Obstacle = require('../models/Obstacle');
const SimulationEvent = require('../models/SimulationEvent');

class StorageService {
  isMongoActive() {
    return getStorageStatus().mode === 'mongodb';
  }

  // --- Simulation ---
  async createSimulation(data) {
    if (this.isMongoActive()) {
      const sim = new Simulation(data);
      const saved = await sim.save();
      return saved.toObject();
    }
    return demoStore.createSimulation(data);
  }

  async getSimulation(id) {
    if (this.isMongoActive()) {
      const sim = await Simulation.findById(id).lean();
      return sim;
    }
    return demoStore.getSimulation(id);
  }

  async listSimulations() {
    if (this.isMongoActive()) {
      return await Simulation.find({}, 'scenarioId scenarioName status metrics createdAt updatedAt')
        .sort({ createdAt: -1 })
        .lean();
    }
    return demoStore.listSimulations();
  }

  async updateSimulation(id, updates) {
    if (this.isMongoActive()) {
      const updated = await Simulation.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      return updated;
    }
    return demoStore.updateSimulation(id, updates);
  }

  async deleteSimulation(id) {
    if (this.isMongoActive()) {
      const res = await Simulation.findByIdAndDelete(id);
      await Obstacle.deleteMany({ simulationId: id });
      await SimulationEvent.deleteMany({ simulationId: id });
      return !!res;
    }
    return demoStore.deleteSimulation(id);
  }

  // --- Obstacles ---
  async getObstacles(simulationId) {
    if (this.isMongoActive()) {
      const sim = await Simulation.findById(simulationId, 'obstacles').lean();
      return sim ? sim.obstacles : [];
    }
    return demoStore.getObstacles(simulationId);
  }

  async setObstacles(simulationId, obstacles) {
    if (this.isMongoActive()) {
      await Simulation.findByIdAndUpdate(simulationId, { $set: { obstacles } });
      return obstacles;
    }
    return demoStore.setObstacles(simulationId, obstacles);
  }

  async addObstacle(simulationId, obstacle) {
    if (this.isMongoActive()) {
      const obsId = obstacle.id || `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newObs = { ...obstacle, id: obsId };
      await Simulation.findByIdAndUpdate(simulationId, {
        $push: { obstacles: newObs }
      });
      return newObs;
    }
    return demoStore.addObstacle(simulationId, obstacle);
  }

  async updateObstacle(simulationId, obstacleId, updates) {
    if (this.isMongoActive()) {
      const sim = await Simulation.findById(simulationId);
      if (!sim) return null;
      const obsIndex = sim.obstacles.findIndex(o => o.id === obstacleId);
      if (obsIndex === -1) return null;

      Object.assign(sim.obstacles[obsIndex], updates);
      await sim.save();
      return sim.obstacles[obsIndex].toObject();
    }
    return demoStore.updateObstacle(simulationId, obstacleId, updates);
  }

  async deleteObstacle(simulationId, obstacleId) {
    if (this.isMongoActive()) {
      const sim = await Simulation.findById(simulationId);
      if (!sim) return false;
      sim.obstacles = sim.obstacles.filter(o => o.id !== obstacleId);
      await sim.save();
      return true;
    }
    return demoStore.deleteObstacle(simulationId, obstacleId);
  }

  // --- Events ---
  async addEvent(simulationId, eventData) {
    if (this.isMongoActive()) {
      const evt = new SimulationEvent({
        simulationId,
        ...eventData
      });
      await evt.save();
      return evt.toObject();
    }
    return demoStore.addEvent(simulationId, eventData);
  }

  async getEvents(simulationId, limit = 50) {
    if (this.isMongoActive()) {
      return await SimulationEvent.find({ simulationId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    }
    return demoStore.getEvents(simulationId, limit);
  }
}

const storageService = new StorageService();

module.exports = storageService;
