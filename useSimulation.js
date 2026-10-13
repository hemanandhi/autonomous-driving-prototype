import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

export function useSimulation() {
  const [simulation, setSimulation] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [events, setEvents] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [backendHealth, setBackendHealth] = useState({
    connected: false,
    storageMode: 'unknown',
    storageModeLabel: 'Checking...',
    warning: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Visualization toggles
  const [showRiskMap, setShowRiskMap] = useState(true);
  const [showPredictions, setShowPredictions] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);

  // Tick interval control
  const isSteppingRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const simulationRef = useRef(null);
  simulationRef.current = simulation;

  // 1. Health check & Initial Load
  const checkConnection = useCallback(async () => {
    try {
      const health = await api.checkHealth();
      setBackendHealth({
        connected: true,
        storageMode: health.database?.activeMode || 'demo',
        storageModeLabel: health.database?.label || 'In-Memory Demo',
        warning: health.database?.warning || null
      });
      setError(null);
      consecutiveErrorsRef.current = 0;
      return true;
    } catch (err) {
      setBackendHealth({
        connected: false,
        storageMode: 'offline',
        storageModeLabel: 'Backend Offline',
        warning: 'Cannot connect to backend server. Make sure port 5000 is running.'
      });
      setError(err.message);
      return false;
    }
  }, []);

  // 2. Load Scenarios and initialize default simulation
  const initialize = useCallback(async () => {
    setLoading(true);
    const isOnline = await checkConnection();
    if (!isOnline) {
      setLoading(false);
      return;
    }

    try {
      const scenRes = await api.getScenarios();
      setScenarios(scenRes.scenarios || []);

      // Create initial simulation session
      const newSimRes = await api.createSimulation('normal-road');
      const sim = newSimRes.simulation;
      setSimulation(sim);

      // Fetch initial events
      const evtRes = await api.getEvents(sim.id || sim._id);
      setEvents(evtRes.events || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [checkConnection]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Periodic health check
  useEffect(() => {
    const healthTimer = setInterval(() => {
      checkConnection();
    }, 10000);
    return () => clearInterval(healthTimer);
  }, [checkConnection]);

  // 3. Simulation Step Runner (Ticks at 180ms when status === 'RUNNING')
  useEffect(() => {
    let timer = null;
    const sim = simulation;
    const isRunning = sim && sim.status === 'RUNNING';

    if (isRunning) {
      timer = setInterval(async () => {
        const currentSim = simulationRef.current;
        if (!currentSim || currentSim.status !== 'RUNNING' || isSteppingRef.current) {
          return;
        }

        isSteppingRef.current = true;
        try {
          const simId = currentSim.id || currentSim._id;
          const stepRes = await api.stepSimulation(simId);

          if (stepRes.success && stepRes.simulation) {
            setSimulation(stepRes.simulation);
            consecutiveErrorsRef.current = 0;

            // Fetch events every 3 ticks
            if ((stepRes.simulation.metrics?.tickCount || 0) % 3 === 0) {
              const evtRes = await api.getEvents(simId, 25);
              setEvents(evtRes.events || []);
            }
          }
        } catch (err) {
          consecutiveErrorsRef.current += 1;
          console.warn('[Simulation Step] Ticking failed:', err.message);

          if (consecutiveErrorsRef.current > 4) {
            setError('Connection lost with backend while simulation was running. Halting ticker.');
            checkConnection();
          }
        } finally {
          isSteppingRef.current = false;
        }
      }, 180);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [simulation?.status, checkConnection]);

  // 4. Action Handlers
  const handleScenarioChange = async (scenarioId) => {
    try {
      setLoading(true);
      const res = await api.createSimulation(scenarioId);
      const newSim = res.simulation;
      setSimulation(newSim);
      setEvaluation(null);

      const evtRes = await api.getEvents(newSim.id || newSim._id);
      setEvents(evtRes.events || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!simulation) return;
    try {
      const res = await api.startSimulation(simulation.id || simulation._id);
      setSimulation(res.simulation);
      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePause = async () => {
    if (!simulation) return;
    try {
      const res = await api.pauseSimulation(simulation.id || simulation._id);
      setSimulation(res.simulation);
      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResume = async () => {
    if (!simulation) return;
    try {
      const res = await api.resumeSimulation(simulation.id || simulation._id);
      setSimulation(res.simulation);
      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = async () => {
    if (!simulation) return;
    try {
      const res = await api.resetSimulation(simulation.id || simulation._id);
      setSimulation(res.simulation);
      setEvaluation(null);
      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStep = async () => {
    if (!simulation || isSteppingRef.current) return;
    isSteppingRef.current = true;
    try {
      // Temporarily mark status running if needed or step directly
      const res = await api.stepSimulation(simulation.id || simulation._id);
      setSimulation(res.simulation);
      fetchEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      isSteppingRef.current = false;
    }
  };

  const handleEmergencyStop = async () => {
    if (!simulation) return;
    try {
      const res = await api.emergencyStop(
        simulation.id || simulation._id,
        'Manual Emergency Stop triggered via dashboard operator control'
      );
      setSimulation(res.simulation);
      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddObstacle = async (obstacleData) => {
    if (!simulation) return;
    try {
      await api.addObstacle(simulation.id || simulation._id, obstacleData);
      const stateRes = await api.getSimulation(simulation.id || simulation._id);
      setSimulation(stateRes.simulation);
      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteObstacle = async (obstacleId) => {
    if (!simulation) return;
    try {
      await api.deleteObstacle(simulation.id || simulation._id, obstacleId);
      const stateRes = await api.getSimulation(simulation.id || simulation._id);
      setSimulation(stateRes.simulation);
      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRunEvaluation = async () => {
    if (!simulation) return;
    try {
      const res = await api.evaluateSimulation(simulation.id || simulation._id);
      setEvaluation(res.evaluation);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchEvents = async () => {
    if (!simulation) return;
    try {
      const evtRes = await api.getEvents(simulation.id || simulation._id, 30);
      setEvents(evtRes.events || []);
    } catch (e) {
      console.warn('Failed to load events:', e.message);
    }
  };

  return {
    simulation,
    scenarios,
    events,
    evaluation,
    backendHealth,
    loading,
    error,
    showRiskMap,
    setShowRiskMap,
    showPredictions,
    setShowPredictions,
    showBoundaries,
    setShowBoundaries,
    checkConnection,
    handleScenarioChange,
    handleStart,
    handlePause,
    handleResume,
    handleReset,
    handleStep,
    handleEmergencyStop,
    handleAddObstacle,
    handleDeleteObstacle,
    handleRunEvaluation,
    setEvaluation
  };
}
