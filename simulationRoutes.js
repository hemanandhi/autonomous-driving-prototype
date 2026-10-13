const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

// Scenarios list
router.get('/scenarios', simulationController.getScenarios);

// Simulations collection
router.get('/', simulationController.listSimulations);
router.post('/', simulationController.createSimulation);

// Specific simulation
router.get('/:id', simulationController.getSimulation);
router.get('/:id/state', simulationController.getSimulationState);

// Lifecycle controls
router.post('/:id/start', simulationController.startSimulation);
router.post('/:id/pause', simulationController.pauseSimulation);
router.post('/:id/resume', simulationController.resumeSimulation);
router.post('/:id/reset', simulationController.resetSimulation);
router.post('/:id/step', simulationController.stepSimulation);
router.post('/:id/emergency-stop', simulationController.emergencyStop);
router.post('/:id/evaluate', simulationController.evaluateSimulation);

module.exports = router;
