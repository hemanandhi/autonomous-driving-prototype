const express = require('express');
const cors = require('cors');
const errorHandler = require('./src/middleware/errorHandler');

// Controllers & Routes
const simulationController = require('./src/controllers/simulationController');
const analyticsController = require('./src/controllers/analyticsController');
const simulationRoutes = require('./src/routes/simulationRoutes');
const obstacleRoutes = require('./src/routes/obstacleRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');

const app = express();

// Security and parser middlewares
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: [clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health Check Endpoint
app.get('/api/health', simulationController.getHealth);

// Nested routes for simulations
app.use('/api/simulations/:id/obstacles', obstacleRoutes);
app.get('/api/simulations/:id/events', analyticsController.getEvents);
app.get('/api/simulations/:id/analytics', analyticsController.getSimulationAnalytics);

// Main simulation endpoints
app.use('/api/simulations', simulationRoutes);

// Global analytics endpoints
app.use('/api/analytics', analyticsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Middleware
app.use(errorHandler);

module.exports = app;
