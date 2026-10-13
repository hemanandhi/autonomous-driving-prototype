const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const app = require('../app');
const pathPlanningService = require('../src/services/pathPlanningService');
const riskAssessmentService = require('../src/services/riskAssessmentService');
const motionPredictionService = require('../src/services/motionPredictionService');
const speedControlService = require('../src/services/speedControlService');
const simulationService = require('../src/services/simulationService');
const demoStore = require('../src/utils/demoStore');

let server;
let baseUrl;

before(async () => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
});

describe('1. Health and Demo Storage Verification', () => {
  test('GET /api/health returns healthy status and active storage mode', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.problemStatementId, 'SIH26037');
    assert.ok(data.database);
    assert.ok(data.database.activeMode);
  });

  test('Demo store keeps records in memory and supports CRUD operations', () => {
    demoStore.clear();
    const testSim = demoStore.createSimulation({
      scenarioId: 'test-scenario',
      scenarioName: 'Test Scenario',
      status: 'IDLE'
    });
    assert.ok(testSim._id);
    const fetched = demoStore.getSimulation(testSim._id);
    assert.equal(fetched.scenarioName, 'Test Scenario');

    const updated = demoStore.updateSimulation(testSim._id, { status: 'RUNNING' });
    assert.equal(updated.status, 'RUNNING');

    const deleted = demoStore.deleteSimulation(testSim._id);
    assert.equal(deleted, true);
    assert.equal(demoStore.getSimulation(testSim._id), null);
  });
});

describe('2. Algorithmic Capabilities: Risk Scoring & A* Path Planning', () => {
  test('Collision-Risk Assessment calculates scaled 0-100 score correctly', () => {
    const vehicle = { x: 100, y: 200, speedKmh: 40, safetyRadius: 20 };
    const closeObstacle = {
      id: 'obs_test_close',
      type: 'motorcycle',
      x: 140, // 40px ahead
      y: 200,
      vx: -20,
      vy: 0,
      safetyRadius: 20,
      isDynamic: true
    };

    const riskClose = riskAssessmentService.assessRisk(vehicle, [closeObstacle]);
    assert.ok(riskClose.riskScore >= 60, `Expected high risk, got ${riskClose.riskScore}`);
    assert.ok(['HIGH', 'CRITICAL'].includes(riskClose.riskLevel));
    assert.ok(riskClose.explanation.length > 10);

    // Far away obstacle should have low risk
    const farObstacle = {
      id: 'obs_test_far',
      type: 'car',
      x: 800,
      y: 90,
      vx: 0,
      vy: 0,
      safetyRadius: 20,
      isDynamic: false
    };
    const riskFar = riskAssessmentService.assessRisk(vehicle, [farObstacle]);
    assert.ok(riskFar.riskScore <= 25, `Expected low risk, got ${riskFar.riskScore}`);
    assert.equal(riskFar.riskLevel, 'LOW');
  });

  test('A* Path Planning finds a valid collision-free path around an obstacle', () => {
    const start = { x: 50, y: 200 };
    const goal = { x: 400, y: 200 };
    const roadBounds = { minX: 0, maxX: 1000, minY: 70, maxY: 330, isNarrow: false };

    // Obstacle directly in the center path
    const obstacleInCenter = {
      id: 'center_block',
      type: 'car',
      x: 200,
      y: 200,
      safetyRadius: 30,
      active: true
    };

    const result = pathPlanningService.planPath(start, goal, [obstacleInCenter], roadBounds);
    assert.equal(result.success, true);
    assert.ok(result.path.length > 2);

    // Check that path points deviate laterally around the obstacle at x=200
    const midWaypoints = result.path.filter(p => Math.abs(p.x - 200) < 40);
    assert.ok(midWaypoints.length > 0);
    const deviations = midWaypoints.map(p => Math.abs(p.y - 200));
    assert.ok(Math.max(...deviations) >= 20, 'Expected path to deviate laterally around obstacle');
  });

  test('Path Planning reports blocked when road corridor is completely obstructed', () => {
    const start = { x: 50, y: 200 };
    const goal = { x: 400, y: 200 };
    // Very narrow road
    const roadBounds = { minX: 0, maxX: 1000, minY: 170, maxY: 230, isNarrow: false };
    // Huge obstacle taking the entire width
    const massiveObstacle = {
      id: 'wall',
      type: 'barrier',
      x: 200,
      y: 200,
      safetyRadius: 60,
      active: true
    };

    const result = pathPlanningService.planPath(start, goal, [massiveObstacle], roadBounds);
    assert.equal(result.isBlocked, true);
  });

  test('Speed control service brings vehicle to emergency halt on critical risk or blockage', () => {
    const vehicle = { speedKmh: 45 };
    const criticalRisk = { riskScore: 92, riskLevel: 'CRITICAL' };

    const speedResult = speedControlService.computeSpeed(vehicle, criticalRisk, false, 15);
    assert.equal(speedResult.targetSpeedKmh, 0);
    assert.equal(speedResult.shouldHalt, true);
  });
});

describe('3. REST API Endpoints: Simulation Lifecycle & Obstacles', () => {
  let createdSimId;

  test('POST /api/simulations creates a new simulation session', async () => {
    const res = await fetch(`${baseUrl}/api/simulations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: 'oncoming-motorcycle' })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.simulation);
    createdSimId = data.simulation.id || data.simulation._id;
    assert.ok(createdSimId);
  });

  test('GET /api/simulations returns session list including created session', async () => {
    const res = await fetch(`${baseUrl}/api/simulations`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.simulations));
    assert.ok(data.simulations.some(s => (s.id || s._id) === createdSimId));
  });

  test('POST /api/simulations/:id/start starts simulation', async () => {
    const res = await fetch(`${baseUrl}/api/simulations/${createdSimId}/start`, { method: 'POST' });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.simulation.status, 'RUNNING');
  });

  test('POST /api/simulations/:id/step advances simulation state', async () => {
    const res = await fetch(`${baseUrl}/api/simulations/${createdSimId}/step`, { method: 'POST' });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.simulation.metrics.tickCount >= 1);
  });

  test('POST /api/simulations/:id/pause pauses simulation', async () => {
    const res = await fetch(`${baseUrl}/api/simulations/${createdSimId}/pause`, { method: 'POST' });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.simulation.status, 'PAUSED');
  });

  test('POST /api/simulations/:id/obstacles adds a new obstacle dynamically', async () => {
    const res = await fetch(`${baseUrl}/api/simulations/${createdSimId}/obstacles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'cow',
        label: 'Stray Cow on Roadway',
        x: 350,
        y: 200,
        safetyRadius: 25
      })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.obstacle.id);
  });

  test('DELETE /api/simulations/:id/obstacles/:obstacleId removes an obstacle', async () => {
    // Get obstacles first
    const listRes = await fetch(`${baseUrl}/api/simulations/${createdSimId}/obstacles`);
    const listData = await listRes.json();
    const targetObs = listData.obstacles[0];
    assert.ok(targetObs);

    const delRes = await fetch(`${baseUrl}/api/simulations/${createdSimId}/obstacles/${targetObs.id}`, {
      method: 'DELETE'
    });
    assert.equal(delRes.status, 200);
  });

  test('POST /api/simulations/:id/emergency-stop halts vehicle immediately', async () => {
    const res = await fetch(`${baseUrl}/api/simulations/${createdSimId}/emergency-stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Obstacle sensor triggered test emergency stop' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.simulation.status, 'EMERGENCY_STOP');
    assert.equal(data.simulation.vehicleState.speedKmh, 0);
  });

  test('POST /api/simulations/:id/evaluate generates comprehensive analytics summary', async () => {
    const res = await fetch(`${baseUrl}/api/simulations/${createdSimId}/evaluate`, { method: 'POST' });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.evaluation.safetyScore !== undefined);
    assert.ok(Array.isArray(data.evaluation.recommendations));
  });

  test('GET /api/simulations/:id/events retrieves chronological event log', async () => {
    const res = await fetch(`${baseUrl}/api/simulations/${createdSimId}/events`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.events.length > 0);
  });
});
