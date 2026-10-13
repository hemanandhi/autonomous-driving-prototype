const mongoose = require('mongoose');

const ObstacleSchema = new mongoose.Schema({
  simulationId: {
    type: String,
    required: true,
    index: true
  },
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['motorcycle', 'car', 'pedestrian', 'cow', 'pothole', 'barrier'],
    required: true
  },
  label: {
    type: String,
    default: 'Obstacle'
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  vx: {
    type: Number,
    default: 0
  },
  vy: {
    type: Number,
    default: 0
  },
  width: {
    type: Number,
    default: 20
  },
  height: {
    type: Number,
    default: 20
  },
  safetyRadius: {
    type: Number,
    default: 20
  },
  isDynamic: {
    type: Boolean,
    default: false
  },
  predictedTrajectory: [{
    x: Number,
    y: Number,
    t: Number
  }],
  uncertaintyRadius: {
    type: Number,
    default: 10
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Obstacle', ObstacleSchema);
