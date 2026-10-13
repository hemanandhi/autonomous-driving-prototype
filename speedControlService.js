/**
 * Adaptive Speed Control & Emergency Stop Service
 *
 * Dynamically modulates longitudinal velocity based on real-time risk scores,
 * proximity clearances, road geometry, and emergency overrides.
 */

class SpeedControlService {
  constructor() {
    this.DEFAULT_CRUISE_SPEED = 45; // km/h
    this.MAX_ACCELERATION = 8; // km/h per second
    this.MAX_DECELERATION = 18; // km/h per second
    this.MIN_CLEARANCE_LIMIT = 24; // Minimum allowed clearance in px
  }

  /**
   * Calculate target velocity and next step speed
   *
   * @param {Object} vehicle Current vehicle state
   * @param {Object} riskAssessment Evaluated risk assessment
   * @param {Boolean} isPathBlocked Whether A* planner found path blocked
   * @param {Number} minClearance Distance to nearest active obstacle
   * @param {Number} dtSec Delta time in seconds (default 0.2s per tick)
   * @returns {Object} { speedKmh, targetSpeedKmh, statusExplanation, shouldHalt }
   */
  computeSpeed(vehicle, riskAssessment, isPathBlocked, minClearance, dtSec = 0.2) {
    const currentSpeed = vehicle.speedKmh || 0;
    const riskScore = riskAssessment.riskScore || 0;
    const riskLevel = riskAssessment.riskLevel || 'LOW';

    let targetSpeed = this.DEFAULT_CRUISE_SPEED;
    let shouldHalt = false;
    let explanation = 'Cruising at nominal speed.';

    // Check emergency conditions first
    if (isPathBlocked) {
      targetSpeed = 0;
      shouldHalt = true;
      explanation = 'Vehicle stopped: Forward corridor blocked by obstacles/curbs.';
    } else if (riskLevel === 'CRITICAL' || riskScore >= 86) {
      targetSpeed = 0;
      shouldHalt = true;
      explanation = `Safety stop: Critical collision risk (${riskScore}/100) detected.`;
    } else if (minClearance < this.MIN_CLEARANCE_LIMIT) {
      targetSpeed = 0;
      shouldHalt = true;
      explanation = `Safety stop: Obstacle clearance (${minClearance}px) below critical threshold (${this.MIN_CLEARANCE_LIMIT}px).`;
    } else if (riskLevel === 'HIGH' || riskScore >= 61) {
      targetSpeed = 12; // Creep forward / heavy braking
      explanation = `Caution crawl: High risk (${riskScore}/100), navigating obstacle bypass.`;
    } else if (riskLevel === 'MEDIUM' || riskScore >= 26) {
      targetSpeed = 26; // Moderate deceleration
      explanation = `Controlled slowdown: Approaching hazard (${riskScore}/100).`;
    } else {
      // Clear path
      targetSpeed = this.DEFAULT_CRUISE_SPEED;
      explanation = 'Nominal driving: Safe conditions, maintaining cruise speed.';
    }

    // Apply acceleration/deceleration smoothing
    let nextSpeed = currentSpeed;
    if (nextSpeed < targetSpeed) {
      nextSpeed = Math.min(targetSpeed, nextSpeed + this.MAX_ACCELERATION * dtSec * 3);
    } else if (nextSpeed > targetSpeed) {
      nextSpeed = Math.max(targetSpeed, nextSpeed - this.MAX_DECELERATION * dtSec * 3);
    }

    return {
      speedKmh: Math.max(0, Math.round(nextSpeed * 10) / 10),
      targetSpeedKmh: targetSpeed,
      statusExplanation: explanation,
      shouldHalt
    };
  }
}

module.exports = new SpeedControlService();
