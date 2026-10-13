import React, { useState } from 'react';
import Header from './components/Header';
import ConnectionStatus from './components/ConnectionStatus';
import MetricCards from './components/MetricCards';
import ScenarioSelector from './components/ScenarioSelector';
import SimulationControls from './components/SimulationControls';
import RoadSimulation from './components/RoadSimulation';
import ObstaclePanel from './components/ObstaclePanel';
import RiskPanel from './components/RiskPanel';
import EventLog from './components/EventLog';
import AnalyticsPanel from './components/AnalyticsPanel';
import { useSimulation } from './hooks/useSimulation';

export default function App() {
  const {
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
  } = useSimulation();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [clickCoords, setClickCoords] = useState(null);

  // When user clicks canvas to place an obstacle
  const handleCanvasClick = (x, y) => {
    setClickCoords({ x, y });
    setIsAddModalOpen(true);
  };

  const handleAddWithCoords = (obstacleData) => {
    const finalData = clickCoords
      ? { ...obstacleData, x: clickCoords.x, y: clickCoords.y }
      : obstacleData;
    handleAddObstacle(finalData);
    setClickCoords(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* 1. Header with Problem Statement & Connectivity */}
      <Header
        backendHealth={backendHealth}
        simulationStatus={simulation?.status || 'IDLE'}
      />

      {/* 2. Connection Warning & Mode Notice Banner */}
      <ConnectionStatus
        backendHealth={backendHealth}
        onRetry={checkConnection}
        error={error}
      />

      <main style={{ flex: 1, paddingBottom: '32px' }}>
        {/* 3. Real-Time Telemetry Metric Cards */}
        <MetricCards simulation={simulation} />

        {/* 4. Scenario Selector */}
        <ScenarioSelector
          scenarios={scenarios}
          activeScenarioId={simulation?.scenarioId}
          onSelectScenario={handleScenarioChange}
          disabled={!backendHealth.connected}
        />

        {/* 5. Execution Controls & Layer Toggles */}
        <SimulationControls
          status={simulation?.status || 'IDLE'}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onReset={handleReset}
          onStep={handleStep}
          onEmergencyStop={handleEmergencyStop}
          onOpenAddModal={() => { setClickCoords(null); setIsAddModalOpen(true); }}
          onRunEvaluation={handleRunEvaluation}
          showRiskMap={showRiskMap}
          setShowRiskMap={setShowRiskMap}
          showPredictions={showPredictions}
          setShowPredictions={setShowPredictions}
          showBoundaries={showBoundaries}
          setShowBoundaries={setShowBoundaries}
          disabled={!backendHealth.connected}
        />

        {/* 6. Central Interactive Road Simulation Canvas */}
        <RoadSimulation
          simulation={simulation}
          showRiskMap={showRiskMap}
          showPredictions={showPredictions}
          showBoundaries={showBoundaries}
          onCanvasClick={handleCanvasClick}
        />

        {/* 7. Split Diagnostic Section: Obstacles & Risk Assessment */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '16px',
          margin: '0 24px 16px 24px'
        }}>
          <ObstaclePanel
            obstacles={simulation?.obstacles || []}
            onAddObstacle={handleAddWithCoords}
            onDeleteObstacle={handleDeleteObstacle}
            isAddModalOpen={isAddModalOpen}
            setIsAddModalOpen={setIsAddModalOpen}
            vehiclePosition={simulation?.vehicleState}
          />

          <RiskPanel riskMetrics={simulation?.riskMetrics} />
        </div>

        {/* 8. Event Log Stream */}
        <div style={{ margin: '0 24px 16px 24px' }}>
          <EventLog events={events} />
        </div>

        {/* 9. Mission Analytics & Evaluation */}
        <AnalyticsPanel
          simulation={simulation}
          evaluation={evaluation}
          onCloseEvaluation={() => setEvaluation(null)}
        />
      </main>
    </div>
  );
}
