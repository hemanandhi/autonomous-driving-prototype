const mongoose = require('mongoose');

const SimulationSchema = new mongoose.Schema({
  scenarioId: {
    type: String,
    required: true,
    default: 'normal-road'
  },
  scenarioName: {
    type: String,
    required: true,
    default: 'Normal Road'
  },
  status: {
    type: String,
    enum: ['IDLE', 'RUNNING', 'PAUSED', 'COMPLETED', 'EMERGENCY_STOP', 'BLOCKED'],
    default: 'IDLE'
  },
  vehicleState: {
    x: { type: Number, default: 60 },
    y: { type: Number, default: 200 },
    vx: { type: Number, default: 0 },
    vy: { type: Number, default: 0 },
    speedKmh: { type: Number, default: 0 },
    targetSpeedKmh: { type: Number, default: 45 },
    headingDeg: { type: Number, default: 0 },
    width: { type: Number, default: 42 },
    height: { type: Number, default: 22 },
    safetyRadius: { type: Number, default: 28 }
  },
  destination: {
    x: { type: Number, default: 920 },
    y: { type: Number, default: 200 },
    radius: { type: Number, default: 30 }
  },
  roadBounds: {
    minX: { type: Number, default: 0 },
    maxX: { type: Number, default: 1000 },
    minY: { type: Number, default: 60 },
    maxY: { type: Number, default: 340 },
    laneWidth: { type: Number, default: 140 },
    isNarrow: { type: Boolean, default: false },
    narrowSection: {
      startX: { type: Number, default: 350 },
      endX: { type: Number, default: 650 },
      minY: { type: Number, default: 110 },
      maxY: { type: Number, default: 290 }
    }
  },
  obstacles: [{
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['motorcycle', 'car', 'pedestrian', 'cow', 'pothole', 'barrier'],
      required: true
    },
    label: { type: String, default: 'Obstacle' },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    vx: { type: Number, default: 0 },
    vy: { type: Number, default: 0 },
    width: { type: Number, default: 20 },
    height: { type: Number, default: 20 },
    safetyRadius: { type: Number, default: 20 },
    isDynamic: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    predictedTrajectory: [{
      x: Number,
      y: Number,
      t: Number
    }],
    riskFactor: { type: Number, default: 0 }
  }],
  plannedRoute: [{
    x: Number,
    y: Number
  }],
  rejectedRoutes: [[{
    x: Number,
    y: Number
  }]],
  riskMetrics: {
    riskScore: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW'
    },
    highestRiskObstacleId: { type: String, default: null },
    explanation: { type: String, default: 'Path is clear.' },
    timeToCollision: { type: Number, default: null },
    nearestDistance: { type: Number, default: 999 }
  },
  metrics: {
    distanceTravelled: { type: Number, default: 0 },
    replanningCount: { type: Number, default: 0 },
    collisionCount: { type: Number, default: 0 },
    minObstacleClearance: { type: Number, default: 999 },
    avgComputationTimeMs: { type: Number, default: 0 },
    tickCount: { type: Number, default: 0 },
    runStartTime: { type: Date, default: null },
    runEndTime: { type: Date, default: null },
    totalRuns: { type: Number, default: 1 },
    successRate: { type: Number, default: 100 }
  },
  evaluation: {
    completedAt: Date,
    status: String,
    safetyScore: Number,
    efficiencyScore: Number,
    smoothnessScore: Number,
    summary: String,
    recommendations: [String]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Simulation', SimulationSchema);
