const mongoose = require('mongoose');

const SimulationEventSchema = new mongoose.Schema({
  simulationId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tick: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: [
      'SIMULATION_STARTED',
      'SIMULATION_PAUSED',
      'SIMULATION_RESUMED',
      'SIMULATION_RESET',
      'EMERGENCY_STOP',
      'OBSTACLE_DETECTED',
      'OBSTACLE_ADDED',
      'OBSTACLE_REMOVED',
      'PATH_CONFLICT_DETECTED',
      'RISK_INCREASED',
      'RISK_DECREASED',
      'SPEED_REDUCED',
      'SPEED_RESUMED',
      'ROUTE_REPLANNED',
      'ROUTE_BLOCKED',
      'POTHOLE_AVOIDED',
      'DESTINATION_REACHED',
      'COLLISION_DETECTED'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'DANGER', 'CRITICAL'],
    default: 'INFO'
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SimulationEvent', SimulationEventSchema);
