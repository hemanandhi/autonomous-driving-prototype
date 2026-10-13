/**
 * Centralized API Service for Autonomous Driving Dashboard
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || `HTTP error ${response.status}: ${response.statusText}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      const connError = new Error('Cannot connect to backend server. Ensure backend is running on port 5000.');
      connError.isNetworkError = true;
      throw connError;
    }
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Scenarios & Lifecycle
  getScenarios: () => request('/simulations/scenarios'),
  createSimulation: (scenarioId) => request('/simulations', {
    method: 'POST',
    body: JSON.stringify({ scenarioId })
  }),
  listSimulations: () => request('/simulations'),
  getSimulation: (id) => request(`/simulations/${id}`),
  getSimulationState: (id) => request(`/simulations/${id}/state`),

  startSimulation: (id) => request(`/simulations/${id}/start`, { method: 'POST' }),
  pauseSimulation: (id) => request(`/simulations/${id}/pause`, { method: 'POST' }),
  resumeSimulation: (id) => request(`/simulations/${id}/resume`, { method: 'POST' }),
  resetSimulation: (id) => request(`/simulations/${id}/reset`, { method: 'POST' }),
  stepSimulation: (id) => request(`/simulations/${id}/step`, { method: 'POST' }),
  emergencyStop: (id, reason) => request(`/simulations/${id}/emergency-stop`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),
  evaluateSimulation: (id) => request(`/simulations/${id}/evaluate`, { method: 'POST' }),

  // Obstacles
  getObstacles: (id) => request(`/simulations/${id}/obstacles`),
  addObstacle: (id, obstacleData) => request(`/simulations/${id}/obstacles`, {
    method: 'POST',
    body: JSON.stringify(obstacleData)
  }),
  updateObstacle: (id, obstacleId, updates) => request(`/simulations/${id}/obstacles/${obstacleId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }),
  deleteObstacle: (id, obstacleId) => request(`/simulations/${id}/obstacles/${obstacleId}`, {
    method: 'DELETE'
  }),

  // Events & Analytics
  getEvents: (id, limit = 50) => request(`/simulations/${id}/events?limit=${limit}`),
  getAnalytics: (id) => request(`/simulations/${id}/analytics`),
  getGlobalAnalytics: () => request('/analytics/summary')
};

export default api;
