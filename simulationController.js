/**
 * Simulation Controller
 */

const simulationService = require('../services/simulationService');
const storageService = require('../services/storageService');
const { getStorageStatus } = require('../config/database');

// Health Check
exports.getHealth = async (req, res, next) => {
  try {
    const storageInfo = getStorageStatus();
    res.status(200).json({
      success: true,
      status: 'healthy',
      application: 'Autonomous Driving Prototype - SIH 2026',
      problemStatementId: 'SIH26037',
      version: '1.0.0',
      database: {
        status: storageInfo.connected ? 'connected' : 'disconnected',
        activeMode: storageInfo.mode,
        label: storageInfo.label,
        warning: storageInfo.warning
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};

// Available scenarios
exports.getScenarios = async (req, res, next) => {
  try {
    const scenarios = simulationService.getAvailableScenarios();
    res.status(200).json({ success: true, count: scenarios.length, scenarios });
  } catch (err) {
    next(err);
  }
};

// Create simulation
exports.createSimulation = async (req, res, next) => {
  try {
    const { scenarioId } = req.body;
    const sim = await simulationService.createSimulation(scenarioId || 'normal-road');
    res.status(201).json({ success: true, simulation: sim });
  } catch (err) {
    next(err);
  }
};

// List simulations
exports.listSimulations = async (req, res, next) => {
  try {
    const simulations = await simulationService.listSimulations();
    res.status(200).json({ success: true, count: simulations.length, simulations });
  } catch (err) {
    next(err);
  }
};

// Get simulation details
exports.getSimulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sim = await simulationService.getSimulation(id);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation session not found' });
    }
    res.status(200).json({ success: true, simulation: sim });
  } catch (err) {
    next(err);
  }
};

// Start simulation
exports.startSimulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sim = await simulationService.startSimulation(id);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation session not found' });
    }
    res.status(200).json({ success: true, simulation: sim, message: 'Simulation started' });
  } catch (err) {
    next(err);
  }
};

// Pause simulation
exports.pauseSimulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sim = await simulationService.pauseSimulation(id);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation session not found' });
    }
    res.status(200).json({ success: true, simulation: sim, message: 'Simulation paused' });
  } catch (err) {
    next(err);
  }
};

// Resume simulation
exports.resumeSimulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sim = await simulationService.resumeSimulation(id);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation session not found' });
    }
    res.status(200).json({ success: true, simulation: sim, message: 'Simulation resumed' });
  } catch (err) {
    next(err);
  }
};

// Reset simulation
exports.resetSimulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sim = await simulationService.resetSimulation(id);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation session not found' });
    }
    res.status(200).json({ success: true, simulation: sim, message: 'Simulation reset to origin' });
  } catch (err) {
    next(err);
  }
};

// Step simulation
exports.stepSimulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sim = await simulationService.step(id);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation session not found' });
    }
    res.status(200).json({ success: true, simulation: sim });
  } catch (err) {
    next(err);
  }
};

// Get current state
exports.getSimulationState = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sim = await simulationService.getSimulation(id);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation session not found' });
    }
    res.status(200).json({
      success: true,
      state: {
        id: sim.id || sim._id,
        scenarioId: sim.scenarioId,
        scenarioName: sim.scenarioName,
        status: sim.status,
        vehicleState: sim.vehicleState,
        destination: sim.destination,
        roadBounds: sim.roadBounds,
        obstacles: sim.obstacles,
        plannedRoute: sim.plannedRoute,
        rejectedRoutes: sim.rejectedRoutes,
        riskMetrics: sim.riskMetrics,
        metrics: sim.metrics
      }
    });
  } catch (err) {
    next(err);
  }
};

// Emergency Stop
exports.emergencyStop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const sim = await simulationService.emergencyStop(id, reason);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation session not found' });
    }
    res.status(200).json({
      success: true,
      simulation: sim,
      message: 'EMERGENCY STOP executed immediately. Vehicle halted.'
    });
  } catch (err) {
    next(err);
  }
};

// Evaluate
exports.evaluateSimulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const evaluation = await simulationService.evaluateSimulation(id);
    if (!evaluation) {
      return res.status(404).json({ success: false, error: 'Simulation session not found' });
    }
    res.status(200).json({ success: true, evaluation });
  } catch (err) {
    next(err);
  }
};
