/**
 * Collision-Risk Assessment Service
 *
 * Implements a multi-factor risk scoring algorithm (0-100) evaluated across:
 * 1. Euclidean distance to ego vehicle
 * 2. Relative velocity / approach rate
 * 3. Time-to-Collision (TTC)
 * 4. Predicted path conflict & intersection horizon
 * 5. Road clearance / lateral confinement
 * 6. Obstacle motion uncertainty
 */

class RiskAssessmentService {
  constructor() {
    this.THRESHOLDS = {
      LOW: 25,
      MEDIUM: 60,
      HIGH: 85,
      CRITICAL: 100
    };
  }

  /**
   * Evaluate aggregate and per-obstacle collision risks
   *
   * @param {Object} vehicle - Vehicle state { x, y, vx, vy, speedKmh, headingDeg, safetyRadius }
   * @param {Array} obstacles - List of obstacles with predictions
   * @param {Array} plannedRoute - Waypoints of planned vehicle path
   * @param {Object} roadBounds - Road boundary constraints
   * @returns {Object} Comprehensive risk assessment
   */
  assessRisk(vehicle, obstacles = [], plannedRoute = [], roadBounds = {}) {
    if (!obstacles || obstacles.length === 0) {
      return {
        riskScore: 0,
        riskLevel: 'LOW',
        highestRiskObstacleId: null,
        highestRiskObstacleType: null,
        explanation: 'Path clear: No obstacles detected within sensor range.',
        timeToCollision: null,
        nearestDistance: 999,
        obstacleRisks: []
      };
    }

    let maxRisk = 0;
    let primaryObstacle = null;
    let minDistance = Infinity;
    let minTTC = null;
    const obstacleRisks = [];

    for (const obs of obstacles) {
      if (obs.active === false) continue;

      const assessment = this.evaluateSingleObstacle(vehicle, obs, plannedRoute, roadBounds);
      obstacleRisks.push(assessment);

      if (assessment.distance < minDistance) {
        minDistance = assessment.distance;
      }

      if (assessment.ttc !== null && (minTTC === null || assessment.ttc < minTTC)) {
        minTTC = assessment.ttc;
      }

      if (assessment.riskScore > maxRisk) {
        maxRisk = assessment.riskScore;
        primaryObstacle = assessment;
      }
    }

    const clampedRisk = Math.min(100, Math.max(0, Math.round(maxRisk)));
    const riskLevel = this.determineRiskLevel(clampedRisk);
    const explanation = this.generateExplanation(clampedRisk, riskLevel, primaryObstacle);

    return {
      riskScore: clampedRisk,
      riskLevel,
      highestRiskObstacleId: primaryObstacle ? primaryObstacle.obstacleId : null,
      highestRiskObstacleType: primaryObstacle ? primaryObstacle.type : null,
      explanation,
      timeToCollision: minTTC,
      nearestDistance: Math.round(minDistance === Infinity ? 999 : minDistance),
      obstacleRisks
    };
  }

  /**
   * Evaluate collision risk for a single obstacle
   */
  evaluateSingleObstacle(vehicle, obs, plannedRoute, roadBounds) {
    const dx = obs.x - vehicle.x;
    const dy = obs.y - vehicle.y;
    const distance = Math.hypot(dx, dy);

    // Relative velocity: vehicle moving predominantly +x
    const vehVx = (vehicle.speedKmh || 0) * 0.97; // scaled
    const vehVy = 0;
    const relVx = vehVx - (obs.vx || 0);
    const relVy = vehVy - (obs.vy || 0);
    const closingSpeed = (dx * relVx + dy * relVy) / (distance || 1);

    // 1. Proximity component (0 - 35 points)
    // Sensor range = 260px; dangerous under 80px
    let proximityScore = 0;
    if (distance < 50) {
      proximityScore = 35;
    } else if (distance < 260) {
      proximityScore = 35 * Math.pow((260 - distance) / 210, 1.5);
    }

    // 2. Time to Collision (TTC) component (0 - 35 points)
    let ttcScore = 0;
    let ttc = null;
    if (closingSpeed > 2 && distance < 300) {
      ttc = Number((distance / (closingSpeed * 3.5)).toFixed(2));
      if (ttc < 0.8) {
        ttcScore = 35;
      } else if (ttc < 3.0) {
        ttcScore = 35 * ((3.0 - ttc) / 2.2);
      } else if (ttc < 5.0) {
        ttcScore = 10 * ((5.0 - ttc) / 2.0);
      }
    }

    // 3. Path Conflict component (0 - 20 points)
    let pathConflictScore = 0;
    const conflict = obs.conflictData || {};
    if (conflict.hasConflict) {
      if (conflict.timeToConflict && conflict.timeToConflict < 1.5) {
        pathConflictScore = 20;
      } else if (conflict.timeToConflict && conflict.timeToConflict < 3.0) {
        pathConflictScore = 15;
      } else {
        pathConflictScore = 10;
      }
    } else {
      // Check lateral distance to ego vehicle's planned heading
      const lateralDist = Math.abs(obs.y - vehicle.y);
      if (dx > 0 && dx < 180 && lateralDist < 30) {
        pathConflictScore = 12; // directly in lane ahead
      }
    }

    // 4. Road Confinement / Bottleneck Multiplier (1.0 to 1.3x)
    let roadConfinementFactor = 1.0;
    if (roadBounds.isNarrow && obs.x >= (roadBounds.narrowSection?.startX || 350) && obs.x <= (roadBounds.narrowSection?.endX || 650)) {
      roadConfinementFactor = 1.25; // Less evasive room on narrow Indian roads
    }

    // 5. Special obstacle type severity
    let typeModifier = 0;
    if (obs.type === 'pedestrian') {
      typeModifier = 5; // Human vulnerability priority
    } else if (obs.type === 'cow') {
      typeModifier = 4; // High mass & unpredictable behavior
    } else if (obs.type === 'pothole') {
      // Potholes don't hit the vehicle, the vehicle hits them; severity based on direct lane alignment
      const inLane = Math.abs(obs.y - vehicle.y) < 20;
      if (inLane && distance < 120) {
        typeModifier = 8;
      } else {
        proximityScore *= 0.6; // potholes on roadside aren't critical
      }
    }

    const rawScore = (proximityScore + ttcScore + pathConflictScore + typeModifier) * roadConfinementFactor;
    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    return {
      obstacleId: obs.id,
      label: obs.label || obs.type,
      type: obs.type,
      distance: Math.round(distance),
      closingSpeed: Math.round(closingSpeed * 10) / 10,
      ttc,
      hasPathConflict: Boolean(conflict.hasConflict),
      riskScore: finalScore,
      riskLevel: this.determineRiskLevel(finalScore),
      factors: {
        proximityScore: Math.round(proximityScore),
        ttcScore: Math.round(ttcScore),
        pathConflictScore: Math.round(pathConflictScore),
        confinementMultiplier: roadConfinementFactor
      }
    };
  }

  determineRiskLevel(score) {
    if (score <= this.THRESHOLDS.LOW) return 'LOW';
    if (score <= this.THRESHOLDS.MEDIUM) return 'MEDIUM';
    if (score <= this.THRESHOLDS.HIGH) return 'HIGH';
    return 'CRITICAL';
  }

  generateExplanation(score, level, primaryObstacle) {
    if (!primaryObstacle || score <= 10) {
      return 'Nominal condition: Safe forward passage with open clearance.';
    }

    const type = primaryObstacle.type || 'obstacle';
    const dist = primaryObstacle.distance;
    const ttc = primaryObstacle.ttc ? ` (TTC: ${primaryObstacle.ttc}s)` : '';

    switch (level) {
      case 'CRITICAL':
        return `CRITICAL (${score}/100): Imminent collision threat with ${type} at ${dist}px${ttc}. Emergency brake / full stop mandatory.`;
      case 'HIGH':
        return `HIGH RISK (${score}/100): ${type.toUpperCase()} closing in active path at ${dist}px${ttc}. Decelerating vehicle and executing dynamic replan.`;
      case 'MEDIUM':
        return `CAUTION (${score}/100): Detected ${type} ahead at ${dist}px. Adjusting speed and maintaining lateral safety margin.`;
      case 'LOW':
      default:
        return `LOW RISK (${score}/100): ${type} detected at safe distance (${dist}px). Standard lane tracking active.`;
    }
  }
}

module.exports = new RiskAssessmentService();
