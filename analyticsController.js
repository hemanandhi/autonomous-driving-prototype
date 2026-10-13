/**
 * Analytics and Event Controller
 */

const storageService = require('../services/storageService');
const metricsService = require('../services/metricsService');

// Get events
exports.getEvents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = Number(req.query.limit) || 60;
    const events = await storageService.getEvents(id, limit);
    res.status(200).json({ success: true, count: events.length, events });
  } catch (err) {
    next(err);
  }
};

// Get session analytics
exports.getSimulationAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sim = await storageService.getSimulation(id);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation session not found' });
    }

    const evaluation = metricsService.evaluateRun(sim);

    res.status(200).json({
      success: true,
      analytics: {
        simulationId: sim.id || sim._id,
        scenarioName: sim.scenarioName,
        status: sim.status,
        metrics: sim.metrics,
        evaluation
      }
    });
  } catch (err) {
    next(err);
  }
};

// Aggregate analytics across all sessions
exports.getGlobalAnalytics = async (req, res, next) => {
  try {
    const simulations = await storageService.listSimulations();
    const aggregate = metricsService.aggregateAnalytics(simulations);
    res.status(200).json({ success: true, aggregate });
  } catch (err) {
    next(err);
  }
};
