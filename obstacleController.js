/**
 * Obstacle Controller
 */

const storageService = require('../services/storageService');
const pathPlanningService = require('../services/pathPlanningService');
const riskAssessmentService = require('../services/riskAssessmentService');

// Get obstacles
exports.getObstacles = async (req, res, next) => {
  try {
    const { id } = req.params;
    const obstacles = await storageService.getObstacles(id);
    res.status(200).json({ success: true, count: obstacles.length, obstacles });
  } catch (err) {
    next(err);
  }
};

// Add obstacle
exports.addObstacle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sim = await storageService.getSimulation(id);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation session not found' });
    }

    const { type, label, x, y, vx, vy, width, height, safetyRadius, isDynamic } = req.body;

    if (!type || x === undefined || y === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required obstacle fields: type, x, y are required.'
      });
    }

    // Road boundary validation
    const bounds = sim.roadBounds || { minX: 0, maxX: 1000, minY: 50, maxY: 350 };
    if (x < bounds.minX || x > bounds.maxX || y < bounds.minY - 20 || y > bounds.maxY + 20) {
      return res.status(400).json({
        success: false,
        error: `Coordinates (${x}, ${y}) are out of valid road environment bounds.`
      });
    }

    const newObstacle = {
      type,
      label: label || `Custom ${type.toUpperCase()}`,
      x: Number(x),
      y: Number(y),
      vx: Number(vx || 0),
      vy: Number(vy || 0),
      width: Number(width || (type === 'car' ? 44 : type === 'motorcycle' ? 24 : 20)),
      height: Number(height || (type === 'car' ? 22 : type === 'motorcycle' ? 12 : 20)),
      safetyRadius: Number(safetyRadius || 24),
      isDynamic: Boolean(isDynamic || (vx && vx !== 0) || (vy && vy !== 0)),
      active: true
    };

    const added = await storageService.addObstacle(id, newObstacle);

    // Re-evaluate path and risk with the new obstacle
    const currentObstacles = await storageService.getObstacles(id);
    const planResult = pathPlanningService.planPath(
      { x: sim.vehicleState.x, y: sim.vehicleState.y },
      sim.destination,
      currentObstacles,
      sim.roadBounds,
      sim.plannedRoute
    );

    const riskAssessment = riskAssessmentService.assessRisk(
      sim.vehicleState,
      currentObstacles,
      planResult.path,
      sim.roadBounds
    );

    await storageService.updateSimulation(id, {
      plannedRoute: planResult.path,
      rejectedRoutes: planResult.rejectedRoutes || [],
      riskMetrics: riskAssessment,
      'metrics.replanningCount': (sim.metrics?.replanningCount || 0) + (planResult.replanned ? 1 : 0)
    });

    await storageService.addEvent(id, {
      type: 'OBSTACLE_ADDED',
      severity: 'WARNING',
      message: `Obstacle added: ${newObstacle.label} placed at (${newObstacle.x}, ${newObstacle.y}). Route recalculated.`
    });

    res.status(201).json({ success: true, obstacle: added });
  } catch (err) {
    next(err);
  }
};

// Update obstacle
exports.updateObstacle = async (req, res, next) => {
  try {
    const { id, obstacleId } = req.params;
    const sim = await storageService.getSimulation(id);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation session not found' });
    }

    const updated = await storageService.updateObstacle(id, obstacleId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Obstacle not found' });
    }

    // Re-evaluate path
    const currentObstacles = await storageService.getObstacles(id);
    const planResult = pathPlanningService.planPath(
      { x: sim.vehicleState.x, y: sim.vehicleState.y },
      sim.destination,
      currentObstacles,
      sim.roadBounds,
      sim.plannedRoute
    );

    const riskAssessment = riskAssessmentService.assessRisk(
      sim.vehicleState,
      currentObstacles,
      planResult.path,
      sim.roadBounds
    );

    await storageService.updateSimulation(id, {
      plannedRoute: planResult.path,
      rejectedRoutes: planResult.rejectedRoutes || [],
      riskMetrics: riskAssessment
    });

    res.status(200).json({ success: true, obstacle: updated });
  } catch (err) {
    next(err);
  }
};

// Delete obstacle
exports.deleteObstacle = async (req, res, next) => {
  try {
    const { id, obstacleId } = req.params;
    const sim = await storageService.getSimulation(id);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation session not found' });
    }

    const removed = await storageService.deleteObstacle(id, obstacleId);
    if (!removed) {
      return res.status(404).json({ success: false, error: 'Obstacle not found' });
    }

    // Re-evaluate path
    const currentObstacles = await storageService.getObstacles(id);
    const planResult = pathPlanningService.planPath(
      { x: sim.vehicleState.x, y: sim.vehicleState.y },
      sim.destination,
      currentObstacles,
      sim.roadBounds,
      sim.plannedRoute
    );

    const riskAssessment = riskAssessmentService.assessRisk(
      sim.vehicleState,
      currentObstacles,
      planResult.path,
      sim.roadBounds
    );

    await storageService.updateSimulation(id, {
      plannedRoute: planResult.path,
      rejectedRoutes: planResult.rejectedRoutes || [],
      riskMetrics: riskAssessment
    });

    await storageService.addEvent(id, {
      type: 'OBSTACLE_REMOVED',
      severity: 'INFO',
      message: `Obstacle ${obstacleId} removed from roadway. Route optimized.`
    });

    res.status(200).json({ success: true, message: 'Obstacle removed successfully' });
  } catch (err) {
    next(err);
  }
};
