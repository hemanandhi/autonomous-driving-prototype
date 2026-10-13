/**
 * Adaptive Path Planning Service
 * 
 * Implements Grid-based A* (A-Star) search with dynamic obstacle avoidance,
 * clearance potential fields, Indian road boundary constraints, and path smoothing.
 */

class MinHeap {
  constructor() {
    this.heap = [];
  }
  push(node) {
    this.heap.push(node);
    this._bubbleUp(this.heap.length - 1);
  }
  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._sinkDown(0);
    }
    return top;
  }
  isEmpty() {
    return this.heap.length === 0;
  }
  _bubbleUp(idx) {
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      if (this.heap[idx].f < this.heap[parentIdx].f) {
        [this.heap[idx], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[idx]];
        idx = parentIdx;
      } else break;
    }
  }
  _sinkDown(idx) {
    const length = this.heap.length;
    while (true) {
      let left = 2 * idx + 1;
      let right = 2 * idx + 2;
      let smallest = idx;

      if (left < length && this.heap[left].f < this.heap[smallest].f) {
        smallest = left;
      }
      if (right < length && this.heap[right].f < this.heap[smallest].f) {
        smallest = right;
      }
      if (smallest !== idx) {
        [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
        idx = smallest;
      } else break;
    }
  }
}

class PathPlanningService {
  constructor() {
    this.CELL_SIZE = 10; // 10px per cell -> 100 x 40 grid for 1000x400 space
    this.GRID_W = 100;
    this.GRID_H = 40;
    this.VEHICLE_RADIUS = 16;
    this.CLEARANCE_MARGIN = 14; // Preferred extra safety buffer
  }

  /**
   * Plan path from current vehicle position to destination
   *
   * @param {Object} start { x, y }
   * @param {Object} goal { x, y }
   * @param {Array} obstacles List of active obstacles
   * @param {Object} roadBounds Road boundary definitions
   * @returns {Object} { success, path, rejectedRoutes, replanned, computationTimeMs, message }
   */
  planPath(start, goal, obstacles = [], roadBounds = {}, previousPath = null) {
    const startTime = performance.now();

    const startGx = Math.max(0, Math.min(this.GRID_W - 1, Math.floor(start.x / this.CELL_SIZE)));
    const startGy = Math.max(0, Math.min(this.GRID_H - 1, Math.floor(start.y / this.CELL_SIZE)));
    const goalGx = Math.max(0, Math.min(this.GRID_W - 1, Math.floor(goal.x / this.CELL_SIZE)));
    const goalGy = Math.max(0, Math.min(this.GRID_H - 1, Math.floor(goal.y / this.CELL_SIZE)));

    // 1. Build cost and drivability grid
    const { blockedGrid, costGrid } = this.buildEnvironmentGrid(obstacles, roadBounds);

    // Ensure start cell is drivable so planner isn't stuck if vehicle is slightly nudged
    blockedGrid[startGy][startGx] = false;

    // 2. Run A* search
    const astarResult = this.runAStar(startGx, startGy, goalGx, goalGy, blockedGrid, costGrid);
    const computationTimeMs = Number((performance.now() - startTime).toFixed(2));

    // 3. Generate rejected direct route for visualization if direct line crosses obstacle
    const rejectedRoutes = this.generateRejectedPaths(start, goal, obstacles, roadBounds);

    if (!astarResult.success) {
      return {
        success: false,
        path: previousPath || [{ x: start.x, y: start.y }],
        rejectedRoutes,
        replanned: false,
        isBlocked: true,
        computationTimeMs,
        message: 'No safe route found! Obstacles or road boundaries completely block drivable corridor.'
      };
    }

    // 4. Smooth and format waypoints
    const smoothPath = this.smoothPath(astarResult.pathPoints, start, goal, blockedGrid);

    // Determine if replanning occurred compared to previous path
    const wasReplanned = this.checkIfPathChanged(previousPath, smoothPath);

    return {
      success: true,
      path: smoothPath,
      rejectedRoutes,
      replanned: wasReplanned,
      isBlocked: false,
      computationTimeMs,
      message: wasReplanned ? 'Route dynamically replanned around obstacles.' : 'Safe path confirmed.'
    };
  }

  /**
   * Discretize environment into blocked cells and proximity penalty costs
   */
  buildEnvironmentGrid(obstacles, roadBounds) {
    const blockedGrid = Array.from({ length: this.GRID_H }, () => Array(this.GRID_W).fill(false));
    const costGrid = Array.from({ length: this.GRID_H }, () => Array(this.GRID_W).fill(0));

    const defaultMinY = roadBounds.minY || 60;
    const defaultMaxY = roadBounds.maxY || 340;
    const isNarrow = Boolean(roadBounds.isNarrow);
    const narrowStart = roadBounds.narrowSection?.startX || 350;
    const narrowEnd = roadBounds.narrowSection?.endX || 650;
    const narrowMinY = roadBounds.narrowSection?.minY || 110;
    const narrowMaxY = roadBounds.narrowSection?.maxY || 290;

    // 1. Road Boundary Constraints
    for (let gy = 0; gy < this.GRID_H; gy++) {
      for (let gx = 0; gx < this.GRID_W; gx++) {
        const worldX = gx * this.CELL_SIZE + this.CELL_SIZE / 2;
        const worldY = gy * this.CELL_SIZE + this.CELL_SIZE / 2;

        let effectiveMinY = defaultMinY;
        let effectiveMaxY = defaultMaxY;

        // Check if inside narrow section
        if (isNarrow && worldX >= narrowStart && worldX <= narrowEnd) {
          effectiveMinY = narrowMinY;
          effectiveMaxY = narrowMaxY;
        }

        // Outside road boundaries
        if (worldY < effectiveMinY + this.VEHICLE_RADIUS || worldY > effectiveMaxY - this.VEHICLE_RADIUS) {
          blockedGrid[gy][gx] = true;
        } else {
          // Boundary proximity penalty (stay away from ditches/curbs)
          const distToCurb = Math.min(worldY - effectiveMinY, effectiveMaxY - worldY);
          if (distToCurb < 35) {
            costGrid[gy][gx] += Math.round((35 - distToCurb) * 2);
          }
        }
      }
    }

    // 2. Obstacles and Clearance Potential Field
    for (const obs of obstacles) {
      if (obs.active === false) continue;

      const obsX = obs.x;
      const obsY = obs.y;
      const hardRadius = (obs.safetyRadius || 18) + this.VEHICLE_RADIUS;
      const softRadius = hardRadius + this.CLEARANCE_MARGIN + 30; // Clearance cushion

      const minGx = Math.max(0, Math.floor((obsX - softRadius) / this.CELL_SIZE));
      const maxGx = Math.min(this.GRID_W - 1, Math.ceil((obsX + softRadius) / this.CELL_SIZE));
      const minGy = Math.max(0, Math.floor((obsY - softRadius) / this.CELL_SIZE));
      const maxGy = Math.min(this.GRID_H - 1, Math.ceil((obsY + softRadius) / this.CELL_SIZE));

      for (let gy = minGy; gy <= maxGy; gy++) {
        for (let gx = minGx; gx <= maxGx; gx++) {
          const worldX = gx * this.CELL_SIZE + this.CELL_SIZE / 2;
          const worldY = gy * this.CELL_SIZE + this.CELL_SIZE / 2;
          const dist = Math.hypot(worldX - obsX, worldY - obsY);

          if (dist <= hardRadius) {
            blockedGrid[gy][gx] = true;
          } else if (dist <= softRadius && !blockedGrid[gy][gx]) {
            // Decaying clearance penalty: prioritize paths with wide clearance
            const penalty = Math.round(150 * ((softRadius - dist) / (softRadius - hardRadius)));
            costGrid[gy][gx] += penalty;
          }
        }
      }

      // Dynamic obstacle predicted footprint cost
      if (obs.isDynamic && obs.predictedTrajectory && obs.predictedTrajectory.length > 0) {
        for (const pt of obs.predictedTrajectory) {
          if (pt.t === 0) continue;
          const predHardR = (obs.safetyRadius || 16) + this.VEHICLE_RADIUS * 0.8;
          const pMinGx = Math.max(0, Math.floor((pt.x - predHardR) / this.CELL_SIZE));
          const pMaxGx = Math.min(this.GRID_W - 1, Math.ceil((pt.x + predHardR) / this.CELL_SIZE));
          const pMinGy = Math.max(0, Math.floor((pt.y - predHardR) / this.CELL_SIZE));
          const pMaxGy = Math.min(this.GRID_H - 1, Math.ceil((pt.y + predHardR) / this.CELL_SIZE));

          for (let gy = pMinGy; gy <= pMaxGy; gy++) {
            for (let gx = pMinGx; gx <= pMaxGx; gx++) {
              if (!blockedGrid[gy][gx]) {
                // High dynamic hazard penalty
                costGrid[gy][gx] += Math.round(90 / (pt.t + 0.5));
              }
            }
          }
        }
      }
    }

    return { blockedGrid, costGrid };
  }

  /**
   * Run 8-connected A* search
   */
  runAStar(startGx, startGy, goalGx, goalGy, blockedGrid, costGrid) {
    const openSet = new MinHeap();
    const gScore = Array.from({ length: this.GRID_H }, () => Array(this.GRID_W).fill(Infinity));
    const cameFrom = Array.from({ length: this.GRID_H }, () => Array(this.GRID_W).fill(null));
    const inClosed = Array.from({ length: this.GRID_H }, () => Array(this.GRID_W).fill(false));

    gScore[startGy][startGx] = 0;
    const startH = this.heuristic(startGx, startGy, goalGx, goalGy);
    openSet.push({ gx: startGx, gy: startGy, f: startH, g: 0 });

    const dx = [1, -1, 0, 0, 1, 1, -1, -1];
    const dy = [0, 0, 1, -1, 1, -1, 1, -1];
    const stepCost = [10, 10, 10, 10, 14.14, 14.14, 14.14, 14.14];

    while (!openSet.isEmpty()) {
      const current = openSet.pop();
      const { gx, gy } = current;

      if (gx === goalGx && gy === goalGy) {
        // Reconstruct path
        const pathPoints = [];
        let curr = { gx, gy };
        while (curr) {
          pathPoints.unshift({
            x: curr.gx * this.CELL_SIZE + this.CELL_SIZE / 2,
            y: curr.gy * this.CELL_SIZE + this.CELL_SIZE / 2
          });
          curr = cameFrom[curr.gy][curr.gx];
        }
        return { success: true, pathPoints };
      }

      if (inClosed[gy][gx]) continue;
      inClosed[gy][gx] = true;

      for (let i = 0; i < 8; i++) {
        const nx = gx + dx[i];
        const ny = gy + dy[i];

        if (nx < 0 || nx >= this.GRID_W || ny < 0 || ny >= this.GRID_H) continue;
        if (blockedGrid[ny][nx] || inClosed[ny][nx]) continue;

        // Diagonal corner cutting prevention
        if (i >= 4) {
          if (blockedGrid[gy][nx] || blockedGrid[ny][gx]) continue;
        }

        const tentativeG = gScore[gy][gx] + stepCost[i] + (costGrid[ny][nx] || 0);

        if (tentativeG < gScore[ny][nx]) {
          cameFrom[ny][nx] = { gx, gy };
          gScore[ny][nx] = tentativeG;
          const f = tentativeG + this.heuristic(nx, ny, goalGx, goalGy);
          openSet.push({ gx: nx, gy: ny, f, g: tentativeG });
        }
      }
    }

    return { success: false, pathPoints: [] };
  }

  heuristic(x1, y1, x2, y2) {
    // Octile distance heuristic scaled by 10
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return (10 * (dx + dy) + (14.14 - 20) * Math.min(dx, dy));
  }

  /**
   * Smooth raw A* path by simplifying and adding vehicle start/goal exact points
   */
  smoothPath(pathPoints, exactStart, exactGoal, blockedGrid) {
    if (!pathPoints || pathPoints.length === 0) {
      return [{ x: exactStart.x, y: exactStart.y }, { x: exactGoal.x, y: exactGoal.y }];
    }

    const smoothed = [{ x: exactStart.x, y: exactStart.y }];
    const step = Math.max(1, Math.floor(pathPoints.length / 15)); // 12-16 representative waypoints

    for (let i = 1; i < pathPoints.length - 1; i += step) {
      smoothed.push(pathPoints[i]);
    }

    smoothed.push({ x: exactGoal.x, y: exactGoal.y });
    return smoothed;
  }

  /**
   * Generate rejected / blocked candidate routes to visualize in UI
   */
  generateRejectedPaths(start, goal, obstacles, roadBounds) {
    const rejected = [];
    // Direct straight line candidate
    let isStraightBlocked = false;
    const directSamples = 20;

    for (let i = 1; i < directSamples; i++) {
      const ratio = i / directSamples;
      const sx = start.x + (goal.x - start.x) * ratio;
      const sy = start.y + (goal.y - start.y) * ratio;

      for (const obs of obstacles) {
        if (obs.active === false) continue;
        if (Math.hypot(sx - obs.x, sy - obs.y) < (obs.safetyRadius || 20) + this.VEHICLE_RADIUS) {
          isStraightBlocked = true;
          break;
        }
      }
      if (isStraightBlocked) break;
    }

    if (isStraightBlocked) {
      rejected.push([
        { x: start.x, y: start.y },
        { x: (start.x + goal.x) / 2, y: (start.y + goal.y) / 2 },
        { x: goal.x, y: goal.y }
      ]);
    }

    return rejected;
  }

  checkIfPathChanged(prevPath, newPath) {
    if (!prevPath || prevPath.length < 2 || !newPath || newPath.length < 2) return false;
    // Check lateral deviation at midpoint
    const midIdxPrev = Math.floor(prevPath.length / 2);
    const midIdxNew = Math.floor(newPath.length / 2);
    const dy = Math.abs(prevPath[midIdxPrev].y - newPath[midIdxNew].y);
    return dy > 12; // replanned if deviated more than 12px
  }
}

module.exports = new PathPlanningService();
