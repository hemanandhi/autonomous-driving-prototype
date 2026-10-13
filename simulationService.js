/**
 * Simulation Service & Engine
 * 
 * Central coordinator for simulation lifecycle, kinematic updates,
 * scenario generation, and autonomous vehicle decision loop.
 */

const storageService = require('./storageService');
const motionPredictionService = require('./motionPredictionService');
const riskAssessmentService = require('./riskAssessmentService');
const pathPlanningService = require('./pathPlanningService');
const speedControlService = require('./speedControlService');
const metricsService = require('./metricsService');

const SCENARIOS = {
  'normal-road': {
    id: 'normal-road',
    name: 'Normal Road (Nominal Driving)',
    description: 'Clear road corridor with standard shoulders. Demonstrates steady cruise tracking and boundary adherence.',
    vehicleStart: { x: 60, y: 200, speedKmh: 45, headingDeg: 0 },
    destination: { x: 920, y: 200 },
    roadBounds: {
      minX: 0, maxX: 1000, minY: 70, maxY: 330, laneWidth: 130, isNarrow: false
    },
    obstacles: [
      {
        id: 'obs_norm_1',
        type: 'car',
        label: 'Parked Car on Shoulder',
        x: 480,
        y: 90,
        vx: 0,
        vy: 0,
        width: 44,
        height: 22,
        safetyRadius: 24,
        isDynamic: false
      }
    ]
  },

  'oncoming-motorcycle': {
    id: 'oncoming-motorcycle',
    name: 'Oncoming Motorcycle (Wrong-Side Driving)',
    description: 'High-speed motorcycle driving in reverse lane direction, typical on unstructured Indian arterial roads.',
    vehicleStart: { x: 60, y: 200, speedKmh: 35, headingDeg: 0 },
    destination: { x: 920, y: 200 },
    roadBounds: {
      minX: 0, maxX: 1000, minY: 70, maxY: 330, laneWidth: 130, isNarrow: false
    },
    obstacles: [
      {
        id: 'obs_moto_1',
        type: 'motorcycle',
        label: 'Oncoming Motorcycle (Wrong-side)',
        x: 820,
        y: 205,
        vx: -35, // Moving left toward ego vehicle
        vy: 0,
        width: 24,
        height: 12,
        safetyRadius: 22,
        isDynamic: true
      }
    ]
  },

  'pedestrian-crossing': {
    id: 'pedestrian-crossing',
    name: 'Pedestrian Crossing Unmarked Road',
    description: 'Pedestrian suddenly enters the road from the unpaved shoulder to cross perpendicular to traffic.',
    vehicleStart: { x: 60, y: 200, speedKmh: 35, headingDeg: 0 },
    destination: { x: 920, y: 200 },
    roadBounds: {
      minX: 0, maxX: 1000, minY: 70, maxY: 330, laneWidth: 130, isNarrow: false
    },
    obstacles: [
      {
        id: 'obs_ped_1',
        type: 'pedestrian',
        label: 'Crossing Pedestrian',
        x: 460,
        y: 85,
        vx: 0,
        vy: 14, // Crossing downwards
        width: 14,
        height: 14,
        safetyRadius: 20,
        isDynamic: true
      }
    ]
  },

  'pothole-narrow': {
    id: 'pothole-narrow',
    name: 'Pothole and Narrow Road Bottleneck',
    description: 'Road narrows sharply due to construction/shoulder erosion, with a deep road crater in the drivable zone.',
    vehicleStart: { x: 60, y: 200, speedKmh: 30, headingDeg: 0 },
    destination: { x: 920, y: 200 },
    roadBounds: {
      minX: 0, maxX: 1000, minY: 70, maxY: 330, laneWidth: 130, isNarrow: true,
      narrowSection: {
        startX: 320, endX: 680, minY: 125, maxY: 275 // Narrows from 260px down to 150px
      }
    },
    obstacles: [
      {
        id: 'obs_pot_1',
        type: 'pothole',
        label: 'Deep Monsoon Pothole',
        x: 480,
        y: 200, // Directly in center
        vx: 0,
        vy: 0,
        width: 32,
        height: 24,
        safetyRadius: 24,
        isDynamic: false
      }
    ]
  },

  'multiple-obstacles': {
    id: 'multiple-obstacles',
    name: 'Multiple Obstacles (Indian Road Realities)',
    description: 'Stray livestock (cow) resting on centerline, parked auto-rickshaw, crossing pedestrian, and pothole.',
    vehicleStart: { x: 60, y: 200, speedKmh: 30, headingDeg: 0 },
    destination: { x: 920, y: 200 },
    roadBounds: {
      minX: 0, maxX: 1000, minY: 70, maxY: 330, laneWidth: 130, isNarrow: false
    },
    obstacles: [
      {
        id: 'obs_cow_1',
        type: 'cow',
        label: 'Stray Cow (Livestock)',
        x: 360,
        y: 195,
        vx: -1,
        vy: 1, // Slow erratic drift
        width: 36,
        height: 22,
        safetyRadius: 26,
        isDynamic: true
      },
      {
        id: 'obs_pot_mult',
        type: 'pothole',
        label: 'Pothole Trench',
        x: 560,
        y: 250,
        vx: 0,
        vy: 0,
        width: 30,
        height: 20,
        safetyRadius: 22,
        isDynamic: false
      },
      {
        id: 'obs_car_mult',
        type: 'car',
        label: 'Stationary Auto-Rickshaw',
        x: 740,
        y: 140,
        vx: 0,
        vy: 0,
        width: 36,
        height: 20,
        safetyRadius: 24,
        isDynamic: false
      }
    ]
  },

  'dynamic-traffic': {
    id: 'dynamic-traffic',
    name: 'Dynamic Traffic Challenge (Dense Unstructured)',
    description: 'Active traffic matrix: Oncoming motorcycle, crossing pedestrian, moving lead car, and roadway hazards.',
    vehicleStart: { x: 60, y: 200, speedKmh: 32, headingDeg: 0 },
    destination: { x: 920, y: 200 },
    roadBounds: {
      minX: 0, maxX: 1000, minY: 70, maxY: 330, laneWidth: 130, isNarrow: false
    },
    obstacles: [
      {
        id: 'obs_dyn_car',
        type: 'car',
        label: 'Slow Ahead Vehicle',
        x: 300,
        y: 200,
        vx: 8,
        vy: 0,
        width: 44,
        height: 22,
        safetyRadius: 26,
        isDynamic: true
      },
      {
        id: 'obs_dyn_moto',
        type: 'motorcycle',
        label: 'Aggressive Motorcycle',
        x: 820,
        y: 180,
        vx: -30,
        vy: 0,
        width: 22,
        height: 12,
        safetyRadius: 22,
        isDynamic: true
      },
      {
        id: 'obs_dyn_ped',
        type: 'pedestrian',
        label: 'Crossing Pedestrian',
        x: 540,
        y: 85,
        vx: 0,
        vy: 12,
        width: 14,
        height: 14,
        safetyRadius: 20,
        isDynamic: true
      },
      {
        id: 'obs_dyn_pot',
        type: 'pothole',
        label: 'Pothole Zone',
        x: 650,
        y: 240,
        vx: 0,
        vy: 0,
        width: 30,
        height: 20,
        safetyRadius: 22,
        isDynamic: false
      }
    ]
  }
};

class SimulationService {
  getAvailableScenarios() {
    return Object.values(SCENARIOS).map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      obstacleCount: s.obstacles.length
    }));
  }

  /**
   * Create a new simulation session
   */
  async createSimulation(scenarioId = 'normal-road') {
    const scenario = SCENARIOS[scenarioId] || SCENARIOS['normal-road'];

    const initialPlan = pathPlanningService.planPath(
      scenario.vehicleStart,
      scenario.destination,
      scenario.obstacles,
      scenario.roadBounds
    );

    const initialRisk = riskAssessmentService.assessRisk(
      scenario.vehicleStart,
      scenario.obstacles,
      initialPlan.path,
      scenario.roadBounds
    );

    const simulationData = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      status: 'IDLE',
      vehicleState: {
        x: scenario.vehicleStart.x,
        y: scenario.vehicleStart.y,
        vx: 0,
        vy: 0,
        speedKmh: 0,
        targetSpeedKmh: scenario.vehicleStart.speedKmh,
        headingDeg: scenario.vehicleStart.headingDeg,
        width: 42,
        height: 22,
        safetyRadius: 28
      },
      destination: {
        x: scenario.destination.x,
        y: scenario.destination.y,
        radius: 30
      },
      roadBounds: JSON.parse(JSON.stringify(scenario.roadBounds)),
      obstacles: JSON.parse(JSON.stringify(scenario.obstacles)),
      plannedRoute: initialPlan.path,
      rejectedRoutes: initialPlan.rejectedRoutes || [],
      riskMetrics: initialRisk,
      metrics: {
        distanceTravelled: 0,
        replanningCount: 0,
        collisionCount: 0,
        minObstacleClearance: 999,
        avgComputationTimeMs: initialPlan.computationTimeMs || 4.2,
        tickCount: 0,
        runStartTime: null,
        runEndTime: null,
        totalRuns: 1,
        successRate: 100
      }
    };

    const created = await storageService.createSimulation(simulationData);
    const simId = created.id || created._id;

    // Log initialization event
    await storageService.addEvent(simId, {
      type: 'SIMULATION_STARTED',
      severity: 'INFO',
      message: `Simulation initialized with scenario "${scenario.name}". Initial route planned with ${initialPlan.path.length} waypoints.`
    });

    return created;
  }

  async getSimulation(id) {
    return await storageService.getSimulation(id);
  }

  async listSimulations() {
    return await storageService.listSimulations();
  }

  async startSimulation(id) {
    const sim = await storageService.getSimulation(id);
    if (!sim) return null;

    const updates = {
      status: 'RUNNING',
      'metrics.runStartTime': sim.metrics?.runStartTime || new Date()
    };
    const updated = await storageService.updateSimulation(id, updates);

    await storageService.addEvent(id, {
      type: 'SIMULATION_STARTED',
      severity: 'INFO',
      message: 'Autonomous navigation engaged: Vehicle underway towards destination.'
    });

    return updated;
  }

  async pauseSimulation(id) {
    const sim = await storageService.getSimulation(id);
    if (!sim) return null;

    const updated = await storageService.updateSimulation(id, { status: 'PAUSED' });

    await storageService.addEvent(id, {
      type: 'SIMULATION_PAUSED',
      severity: 'INFO',
      message: 'Simulation paused by operator.'
    });

    return updated;
  }

  async resumeSimulation(id) {
    const sim = await storageService.getSimulation(id);
    if (!sim) return null;

    const updated = await storageService.updateSimulation(id, { status: 'RUNNING' });

    await storageService.addEvent(id, {
      type: 'SIMULATION_RESUMED',
      severity: 'INFO',
      message: 'Simulation resumed: Autonomous navigation continuing.'
    });

    return updated;
  }

  async resetSimulation(id) {
    const sim = await storageService.getSimulation(id);
    if (!sim) return null;

    const scenario = SCENARIOS[sim.scenarioId] || SCENARIOS['normal-road'];

    const initialPlan = pathPlanningService.planPath(
      scenario.vehicleStart,
      scenario.destination,
      scenario.obstacles,
      scenario.roadBounds
    );

    const initialRisk = riskAssessmentService.assessRisk(
      scenario.vehicleStart,
      scenario.obstacles,
      initialPlan.path,
      scenario.roadBounds
    );

    const updates = {
      status: 'IDLE',
      vehicleState: {
        x: scenario.vehicleStart.x,
        y: scenario.vehicleStart.y,
        vx: 0,
        vy: 0,
        speedKmh: 0,
        targetSpeedKmh: scenario.vehicleStart.speedKmh,
        headingDeg: scenario.vehicleStart.headingDeg,
        width: 42,
        height: 22,
        safetyRadius: 28
      },
      roadBounds: JSON.parse(JSON.stringify(scenario.roadBounds)),
      obstacles: JSON.parse(JSON.stringify(scenario.obstacles)),
      plannedRoute: initialPlan.path,
      rejectedRoutes: initialPlan.rejectedRoutes || [],
      riskMetrics: initialRisk,
      metrics: {
        distanceTravelled: 0,
        replanningCount: 0,
        collisionCount: 0,
        minObstacleClearance: 999,
        avgComputationTimeMs: initialPlan.computationTimeMs || 4.2,
        tickCount: 0,
        runStartTime: null,
        runEndTime: null,
        totalRuns: (sim.metrics?.totalRuns || 1) + 1,
        successRate: 100
      },
      evaluation: null
    };

    const updated = await storageService.updateSimulation(id, updates);

    await storageService.addEvent(id, {
      type: 'SIMULATION_RESET',
      severity: 'INFO',
      message: 'Simulation reset to scenario initial state.'
    });

    return updated;
  }

  /**
   * Emergency Stop
   */
  async emergencyStop(id, reason = 'Operator triggered emergency stop override.') {
    const sim = await storageService.getSimulation(id);
    if (!sim) return null;

    const updates = {
      status: 'EMERGENCY_STOP',
      vehicleState: {
        ...sim.vehicleState,
        speedKmh: 0,
        vx: 0,
        vy: 0
      },
      metrics: {
        ...sim.metrics,
        runEndTime: new Date()
      }
    };

    const updated = await storageService.updateSimulation(id, updates);

    await storageService.addEvent(id, {
      type: 'EMERGENCY_STOP',
      severity: 'CRITICAL',
      message: `EMERGENCY STOP ACTIVATED: ${reason}. Vehicle instantly halted.`
    });

    return updated;
  }

  /**
   * Advance one simulation step (Tick)
   * Core autonomous control loop
   */
  async step(id) {
    const sim = await storageService.getSimulation(id);
    if (!sim) return null;

    // If not running, do not advance kinematics
    if (sim.status !== 'RUNNING') {
      return sim;
    }

    const dtSec = 0.2; // 200ms per tick
    const obstacles = sim.obstacles || [];
    const roadBounds = sim.roadBounds || {};
    const vehicle = { ...sim.vehicleState };
    const destination = sim.destination;
    const currentMetrics = { ...sim.metrics };

    currentMetrics.tickCount = (currentMetrics.tickCount || 0) + 1;

    // 1. Update dynamic obstacles positions
    const updatedObstacles = [];
    for (const obs of obstacles) {
      const updatedObs = { ...obs };
      if (obs.isDynamic && obs.active !== false) {
        updatedObs.x = Math.round((obs.x + (obs.vx || 0) * dtSec) * 10) / 10;
        updatedObs.y = Math.round((obs.y + (obs.vy || 0) * dtSec) * 10) / 10;

        // Pedestrian bounce / turn back on boundary
        if (obs.type === 'pedestrian') {
          if (updatedObs.y > (roadBounds.maxY || 330) + 10) {
            updatedObs.vy = -Math.abs(updatedObs.vy);
          } else if (updatedObs.y < (roadBounds.minY || 70) - 10) {
            updatedObs.vy = Math.abs(updatedObs.vy);
          }
        }

        // Oncoming motorcycle boundary loop or pass
        if (obs.type === 'motorcycle' && updatedObs.x < 30) {
          updatedObs.x = 950; // loop back for continuous stress-testing
        }
      }

      // 2. Motion Prediction for moving obstacle
      const predResult = motionPredictionService.predictObstacleTrajectory(updatedObs, 3.0);
      updatedObs.predictedTrajectory = predResult.trajectory;
      updatedObs.confidence = predResult.confidence;

      // Check path conflict against vehicle planned route
      const conflict = motionPredictionService.checkPathConflict(
        predResult.trajectory,
        sim.plannedRoute,
        vehicle.speedKmh
      );
      updatedObs.conflictData = conflict;

      updatedObstacles.push(updatedObs);
    }

    // 3. Collision Risk Assessment
    const riskAssessment = riskAssessmentService.assessRisk(
      vehicle,
      updatedObstacles,
      sim.plannedRoute,
      roadBounds
    );

    // 4. Adaptive Path Planning
    // Trigger replan if:
    // - Obstacle has path conflict
    // - Risk is MEDIUM or higher
    // - Every 4 ticks to adapt to changing dynamics
    let plannedRoute = sim.plannedRoute;
    let rejectedRoutes = sim.rejectedRoutes || [];
    let isPathBlocked = false;

    const shouldReplan = riskAssessment.riskScore > 25 || (currentMetrics.tickCount % 4 === 0);

    if (shouldReplan) {
      const planResult = pathPlanningService.planPath(
        { x: vehicle.x, y: vehicle.y },
        destination,
        updatedObstacles,
        roadBounds,
        sim.plannedRoute
      );

      plannedRoute = planResult.path;
      rejectedRoutes = planResult.rejectedRoutes || [];
      isPathBlocked = planResult.isBlocked;

      // Track computation time
      const prevAvg = currentMetrics.avgComputationTimeMs || 4.0;
      currentMetrics.avgComputationTimeMs = Number(((prevAvg * 0.9) + (planResult.computationTimeMs * 0.1)).toFixed(2));

      if (planResult.replanned) {
        currentMetrics.replanningCount = (currentMetrics.replanningCount || 0) + 1;
        await storageService.addEvent(id, {
          type: 'ROUTE_REPLANNED',
          severity: 'INFO',
          message: `Dynamic A* Replan #${currentMetrics.replanningCount}: Trajectory adapted with safe clearance around obstacles.`
        });
      }

      if (isPathBlocked) {
        await storageService.addEvent(id, {
          type: 'ROUTE_BLOCKED',
          severity: 'WARNING',
          message: 'Forward route blocked: No clearance available within road boundaries. Halting vehicle.'
        });
      }
    }

    // 5. Adaptive Speed Control
    const minClearance = riskAssessment.nearestDistance;
    if (minClearance < (currentMetrics.minObstacleClearance || 999)) {
      currentMetrics.minObstacleClearance = minClearance;
    }

    const speedResult = speedControlService.computeSpeed(
      vehicle,
      riskAssessment,
      isPathBlocked,
      minClearance,
      dtSec
    );

    const oldSpeed = vehicle.speedKmh;
    vehicle.speedKmh = speedResult.speedKmh;
    vehicle.targetSpeedKmh = speedResult.targetSpeedKmh;

    // Speed event logging if significant change
    if (oldSpeed >= 25 && vehicle.speedKmh < 15 && oldSpeed - vehicle.speedKmh > 10) {
      await storageService.addEvent(id, {
        type: 'SPEED_REDUCED',
        severity: 'WARNING',
        message: `Adaptive Deceleration: Speed reduced from ${oldSpeed} km/h to ${vehicle.speedKmh} km/h (${speedResult.statusExplanation}).`
      });
    }

    // 6. Kinematic Vehicle Movement along planned route
    if (vehicle.speedKmh > 0 && plannedRoute && plannedRoute.length > 1) {
      // Step distance in px: 1 km/h ~= 3.5 px/s
      const stepPx = (vehicle.speedKmh * 3.5) * dtSec;
      currentMetrics.distanceTravelled = Math.round((currentMetrics.distanceTravelled || 0) + stepPx);

      // Find waypoint to steer toward (pure pursuit lookahead)
      const lookaheadPx = Math.max(25, vehicle.speedKmh * 0.8);
      let targetWp = null;

      for (let i = 1; i < plannedRoute.length; i++) {
        const wp = plannedRoute[i];
        const dist = Math.hypot(wp.x - vehicle.x, wp.y - vehicle.y);
        if (dist >= lookaheadPx || i === plannedRoute.length - 1) {
          targetWp = wp;
          break;
        }
      }

      if (!targetWp) targetWp = plannedRoute[plannedRoute.length - 1];

      // Steer heading toward target waypoint
      const targetAngleRad = Math.atan2(targetWp.y - vehicle.y, targetWp.x - vehicle.x);
      const targetAngleDeg = (targetAngleRad * 180) / Math.PI;

      // Smooth heading change
      vehicle.headingDeg = Math.round(targetAngleDeg * 10) / 10;

      // Update position along heading
      vehicle.x = Math.round((vehicle.x + Math.cos(targetAngleRad) * stepPx) * 10) / 10;
      vehicle.y = Math.round((vehicle.y + Math.sin(targetAngleRad) * stepPx) * 10) / 10;
    }

    // 7. Check Destination Reached
    const distToGoal = Math.hypot(destination.x - vehicle.x, destination.y - vehicle.y);
    let nextStatus = sim.status;

    if (distToGoal <= (destination.radius || 30)) {
      nextStatus = 'COMPLETED';
      vehicle.speedKmh = 0;
      currentMetrics.runEndTime = new Date();

      await storageService.addEvent(id, {
        type: 'DESTINATION_REACHED',
        severity: 'INFO',
        message: `Goal reached! Autonomous vehicle navigated successfully to target destination in ${currentMetrics.tickCount} ticks.`
      });
    }

    // 8. Check Collisions
    for (const obs of updatedObstacles) {
      if (obs.active === false) continue;
      const collisionThreshold = (vehicle.safetyRadius || 24) * 0.8 + (obs.safetyRadius || 18) * 0.8;
      const d = Math.hypot(obs.x - vehicle.x, obs.y - vehicle.y);

      if (d < collisionThreshold) {
        currentMetrics.collisionCount = (currentMetrics.collisionCount || 0) + 1;
        await storageService.addEvent(id, {
          type: 'COLLISION_DETECTED',
          severity: 'CRITICAL',
          message: `COLLISION DETECTED with ${obs.label || obs.type} at coordinates (${Math.round(vehicle.x)}, ${Math.round(vehicle.y)})!`
        });
        break;
      }
    }

    // 9. Persist update in storage
    const updates = {
      status: nextStatus,
      vehicleState: vehicle,
      obstacles: updatedObstacles,
      plannedRoute,
      rejectedRoutes,
      riskMetrics: riskAssessment,
      metrics: currentMetrics
    };

    const updatedSim = await storageService.updateSimulation(id, updates);
    return updatedSim;
  }

  /**
   * Run evaluation on simulation
   */
  async evaluateSimulation(id) {
    const sim = await storageService.getSimulation(id);
    if (!sim) return null;

    const evaluation = metricsService.evaluateRun(sim);
    await storageService.updateSimulation(id, { evaluation });
    return evaluation;
  }
}

module.exports = new SimulationService();
