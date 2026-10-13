/**
 * Motion Prediction Service
 * 
 * Provides kinematic trajectory forecasting for dynamic road obstacles.
 * Computes predicted future coordinates over a time horizon, evaluates
 * potential intersection with the ego vehicle's planned path, and provides
 * uncertainty bounds based on obstacle characteristics.
 */

class MotionPredictionService {
  constructor() {
    this.defaultHorizonSec = 3.0; // 3 seconds forward prediction
    this.timeStepSec = 0.5; // sample every 0.5s
  }

  /**
   * Predict future trajectory for a single obstacle
   */
  predictObstacleTrajectory(obstacle, horizonSec = this.defaultHorizonSec) {
    const isDynamic = Boolean(obstacle.isDynamic && (obstacle.vx !== 0 || obstacle.vy !== 0));
    const trajectory = [];
    const steps = Math.round(horizonSec / this.timeStepSec);

    // Initial point at t=0
    trajectory.push({
      t: 0,
      x: obstacle.x,
      y: obstacle.y,
      uncertaintyRadius: obstacle.safetyRadius || 20
    });

    if (!isDynamic) {
      // Static obstacle remains at position
      for (let i = 1; i <= steps; i++) {
        const t = Number((i * this.timeStepSec).toFixed(1));
        trajectory.push({
          t,
          x: obstacle.x,
          y: obstacle.y,
          uncertaintyRadius: obstacle.safetyRadius || 20
        });
      }

      return {
        obstacleId: obstacle.id,
        isDynamic: false,
        trajectory,
        confidence: 0.99,
        baseUncertainty: 5
      };
    }

    // Dynamic obstacle kinematic prediction with type-based uncertainty growth
    let growthRate = 4.0; // px per second of uncertainty growth
    let baseConfidence = 0.85;

    switch (obstacle.type) {
      case 'pedestrian':
        // Pedestrians can abruptly halt or change direction
        growthRate = 6.0;
        baseConfidence = 0.70;
        break;
      case 'cow':
        // Animals have unpredictable drift on Indian roads
        growthRate = 7.5;
        baseConfidence = 0.60;
        break;
      case 'motorcycle':
        // Fast, high mobility, weaving
        growthRate = 5.0;
        baseConfidence = 0.80;
        break;
      case 'car':
        // Relatively constrained lane-following
        growthRate = 3.0;
        baseConfidence = 0.90;
        break;
      default:
        growthRate = 4.0;
        baseConfidence = 0.80;
    }

    for (let i = 1; i <= steps; i++) {
      const t = Number((i * this.timeStepSec).toFixed(1));
      // Kinematic linear projection: x(t) = x0 + vx * t
      // Note: In our simulation coordinate space, velocities are in px/sec
      const predX = obstacle.x + obstacle.vx * t;
      const predY = obstacle.y + obstacle.vy * t;
      const uncRadius = (obstacle.safetyRadius || 20) + (growthRate * t);

      trajectory.push({
        t,
        x: Math.round(predX * 10) / 10,
        y: Math.round(predY * 10) / 10,
        uncertaintyRadius: Math.round(uncRadius * 10) / 10
      });
    }

    return {
      obstacleId: obstacle.id,
      isDynamic: true,
      trajectory,
      confidence: baseConfidence,
      growthRate
    };
  }

  /**
   * Check for trajectory conflicts between predicted obstacle path and vehicle planned route
   */
  checkPathConflict(predictedTrajectory, vehicleRoute, vehicleSpeedKmh = 30) {
    if (!vehicleRoute || vehicleRoute.length === 0 || !predictedTrajectory || predictedTrajectory.length === 0) {
      return { hasConflict: false, timeToConflict: null, conflictPoint: null };
    }

    // Vehicle speed in px/sec: approx 1 km/h ~= 3.5 px/s in our canvas scale
    const pxPerSec = Math.max(15, vehicleSpeedKmh * 3.5);

    // Compute cumulative distances along vehicle route to estimate vehicle arrival time at each waypoint
    let cumulativeDist = 0;
    const routeWithArrivalTimes = [{ ...vehicleRoute[0], tArrival: 0 }];

    for (let i = 1; i < vehicleRoute.length; i++) {
      const p1 = vehicleRoute[i - 1];
      const p2 = vehicleRoute[i];
      const segDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      cumulativeDist += segDist;
      routeWithArrivalTimes.push({
        ...p2,
        tArrival: cumulativeDist / pxPerSec
      });
    }

    const CONFLICT_THRESHOLD_PX = 38; // Distance within which conflict occurs

    let closestConflict = null;
    let minTTC = Infinity;

    // Compare predicted obstacle positions at time t with vehicle position at that time
    for (const obsPoint of predictedTrajectory) {
      const t = obsPoint.t;
      if (t === 0) continue;

      // Find vehicle's interpolated position around time t
      const vehPoint = this.interpolateVehiclePosition(routeWithArrivalTimes, t);
      if (!vehPoint) continue;

      const dist = Math.hypot(obsPoint.x - vehPoint.x, obsPoint.y - vehPoint.y);
      const effectiveThreshold = CONFLICT_THRESHOLD_PX + (obsPoint.uncertaintyRadius ? obsPoint.uncertaintyRadius * 0.25 : 0);

      if (dist < effectiveThreshold) {
        if (t < minTTC) {
          minTTC = t;
          closestConflict = {
            hasConflict: true,
            timeToConflict: Number(t.toFixed(2)),
            conflictPoint: { x: Math.round(obsPoint.x), y: Math.round(obsPoint.y) },
            distanceAtConflict: Math.round(dist)
          };
        }
      }
    }

    if (closestConflict) {
      return closestConflict;
    }

    return {
      hasConflict: false,
      timeToConflict: null,
      conflictPoint: null
    };
  }

  /**
   * Helper to interpolate vehicle coordinates at given time along route
   */
  interpolateVehiclePosition(routeWithArrivalTimes, targetTime) {
    if (targetTime <= 0) return routeWithArrivalTimes[0];
    const last = routeWithArrivalTimes[routeWithArrivalTimes.length - 1];
    if (targetTime >= last.tArrival) return last;

    for (let i = 0; i < routeWithArrivalTimes.length - 1; i++) {
      const p1 = routeWithArrivalTimes[i];
      const p2 = routeWithArrivalTimes[i + 1];
      if (targetTime >= p1.tArrival && targetTime <= p2.tArrival) {
        const segDuration = p2.tArrival - p1.tArrival;
        const ratio = segDuration > 0 ? (targetTime - p1.tArrival) / segDuration : 0;
        return {
          x: p1.x + (p2.x - p1.x) * ratio,
          y: p1.y + (p2.y - p1.y) * ratio
        };
      }
    }
    return last;
  }
}

module.exports = new MotionPredictionService();
