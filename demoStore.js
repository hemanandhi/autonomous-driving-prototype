/**
 * In-Memory Demo Storage for Autonomous Driving Prototype
 * Used when MongoDB is not available or STORAGE_MODE=demo.
 *
 * NOTE: All records stored here are kept in-memory and will be lost
 * when the backend process restarts.
 */

class DemoStore {
  constructor() {
    this.simulations = new Map();
    this.events = new Map(); // simulationId -> array of events
    this.obstacles = new Map(); // simulationId -> array of obstacles
  }

  // --- Simulation Operations ---
  createSimulation(data) {
    const id = data._id || data.id || `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const doc = {
      ...data,
      _id: id,
      id: id,
      createdAt: now,
      updatedAt: now
    };
    this.simulations.set(id, JSON.parse(JSON.stringify(doc)));
    this.events.set(id, []);
    this.obstacles.set(id, doc.obstacles ? JSON.parse(JSON.stringify(doc.obstacles)) : []);
    return doc;
  }

  getSimulation(id) {
    const doc = this.simulations.get(id);
    if (!doc) return null;
    return JSON.parse(JSON.stringify(doc));
  }

  listSimulations() {
    return Array.from(this.simulations.values())
      .map(doc => ({
        id: doc.id || doc._id,
        _id: doc._id || doc.id,
        scenarioId: doc.scenarioId,
        scenarioName: doc.scenarioName,
        status: doc.status,
        metrics: doc.metrics,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  updateSimulation(id, updates) {
    const current = this.simulations.get(id);
    if (!current) return null;

    const merged = JSON.parse(JSON.stringify(current));

    for (const [key, value] of Object.entries(updates)) {
      if (key.includes('.')) {
        const parts = key.split('.');
        let target = merged;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!target[parts[i]]) target[parts[i]] = {};
          target = target[parts[i]];
        }
        target[parts[parts.length - 1]] = value;
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        merged[key] = { ...(merged[key] || {}), ...value };
      } else {
        merged[key] = value;
      }
    }

    merged.updatedAt = new Date();
    this.simulations.set(id, JSON.parse(JSON.stringify(merged)));
    return JSON.parse(JSON.stringify(merged));
  }

  deleteSimulation(id) {
    const exists = this.simulations.has(id);
    this.simulations.delete(id);
    this.events.delete(id);
    this.obstacles.delete(id);
    return exists;
  }

  // --- Obstacle Operations ---
  getObstacles(simulationId) {
    const list = this.obstacles.get(simulationId) || [];
    return JSON.parse(JSON.stringify(list));
  }

  setObstacles(simulationId, obstacles) {
    this.obstacles.set(simulationId, JSON.parse(JSON.stringify(obstacles)));
    // Also sync to simulation doc
    const sim = this.simulations.get(simulationId);
    if (sim) {
      sim.obstacles = JSON.parse(JSON.stringify(obstacles));
      this.simulations.set(simulationId, sim);
    }
    return this.getObstacles(simulationId);
  }

  addObstacle(simulationId, obstacle) {
    const list = this.obstacles.get(simulationId) || [];
    const obsId = obstacle.id || `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newObs = {
      ...obstacle,
      id: obsId,
      _id: obsId,
      createdAt: new Date()
    };
    list.push(newObs);
    this.obstacles.set(simulationId, list);

    const sim = this.simulations.get(simulationId);
    if (sim) {
      sim.obstacles = JSON.parse(JSON.stringify(list));
      this.simulations.set(simulationId, sim);
    }
    return newObs;
  }

  updateObstacle(simulationId, obstacleId, updates) {
    const list = this.obstacles.get(simulationId) || [];
    const index = list.findIndex(o => o.id === obstacleId || o._id === obstacleId);
    if (index === -1) return null;

    list[index] = { ...list[index], ...updates, updatedAt: new Date() };
    this.obstacles.set(simulationId, list);

    const sim = this.simulations.get(simulationId);
    if (sim) {
      sim.obstacles = JSON.parse(JSON.stringify(list));
      this.simulations.set(simulationId, sim);
    }
    return list[index];
  }

  deleteObstacle(simulationId, obstacleId) {
    const list = this.obstacles.get(simulationId) || [];
    const filtered = list.filter(o => o.id !== obstacleId && o._id !== obstacleId);
    if (filtered.length === list.length) return false;

    this.obstacles.set(simulationId, filtered);
    const sim = this.simulations.get(simulationId);
    if (sim) {
      sim.obstacles = JSON.parse(JSON.stringify(filtered));
      this.simulations.set(simulationId, sim);
    }
    return true;
  }

  // --- Event Operations ---
  addEvent(simulationId, eventData) {
    const list = this.events.get(simulationId) || [];
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      simulationId,
      timestamp: new Date(),
      ...eventData
    };
    list.push(event);
    // keep max 500 events in memory per simulation
    if (list.length > 500) {
      list.shift();
    }
    this.events.set(simulationId, list);
    return event;
  }

  getEvents(simulationId, limit = 50) {
    const list = this.events.get(simulationId) || [];
    const slice = list.slice(-limit);
    return JSON.parse(JSON.stringify(slice)).reverse();
  }

  clear() {
    this.simulations.clear();
    this.events.clear();
    this.obstacles.clear();
  }
}

const demoStore = new DemoStore();

module.exports = demoStore;
