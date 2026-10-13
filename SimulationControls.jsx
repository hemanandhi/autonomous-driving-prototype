import React, { useState } from 'react';
import { Play, Pause, RotateCcw, StepForward, AlertOctagon, PlusCircle, Eye, EyeOff, BarChart2, Shield } from 'lucide-react';

export default function SimulationControls({
  status,
  onStart,
  onPause,
  onResume,
  onReset,
  onStep,
  onEmergencyStop,
  onOpenAddModal,
  onRunEvaluation,
  showRiskMap,
  setShowRiskMap,
  showPredictions,
  setShowPredictions,
  showBoundaries,
  setShowBoundaries,
  disabled
}) {
  const isRunning = status === 'RUNNING';
  const isPaused = status === 'PAUSED';
  const isEmergency = status === 'EMERGENCY_STOP';

  return (
    <div className="dashboard-card" style={{
      padding: '12px 20px',
      margin: '0 24px 16px 24px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px'
    }}>
      {/* Primary Execution Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {!isRunning ? (
          <button
            onClick={isPaused ? onResume : onStart}
            disabled={disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#10b981',
              color: '#022c22',
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.84rem'
            }}
          >
            <Play size={16} fill="#022c22" />
            {isPaused ? 'Resume' : 'Start Simulation'}
          </button>
        ) : (
          <button
            onClick={onPause}
            disabled={disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f59e0b',
              color: '#451a03',
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.84rem'
            }}
          >
            <Pause size={16} fill="#451a03" />
            Pause
          </button>
        )}

        <button
          onClick={onStep}
          disabled={isRunning || disabled}
          title="Advance single tick manually"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#1e293b',
            color: '#94a3b8',
            fontWeight: 600,
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            fontSize: '0.82rem'
          }}
        >
          <StepForward size={14} /> Step
        </button>

        <button
          onClick={onReset}
          disabled={disabled}
          title="Reset to scenario initial state"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#1e293b',
            color: '#e2e8f0',
            fontWeight: 600,
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            fontSize: '0.82rem'
          }}
        >
          <RotateCcw size={14} /> Reset
        </button>

        {/* Emergency Stop Button */}
        <button
          onClick={onEmergencyStop}
          disabled={isEmergency || disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: isEmergency ? '#7f1d1d' : '#ef4444',
            color: '#fff',
            fontWeight: 800,
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.84rem',
            boxShadow: isEmergency ? 'none' : '0 0 12px rgba(239, 68, 68, 0.45)'
          }}
        >
          <AlertOctagon size={16} />
          EMERGENCY STOP
        </button>

        <button
          onClick={onOpenAddModal}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 600,
            padding: '8px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.82rem'
          }}
        >
          <PlusCircle size={15} /> Add Obstacle
        </button>
      </div>

      {/* Layer Toggles & Evaluation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowRiskMap(!showRiskMap)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: showRiskMap ? 'rgba(245, 158, 11, 0.15)' : '#0d1322',
            color: showRiskMap ? '#fbbf24' : '#64748b',
            border: `1px solid ${showRiskMap ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-color)'}`,
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: 600
          }}
        >
          <Shield size={13} /> Risk Map {showRiskMap ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={() => setShowPredictions(!showPredictions)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: showPredictions ? 'rgba(6, 182, 212, 0.15)' : '#0d1322',
            color: showPredictions ? '#22d3ee' : '#64748b',
            border: `1px solid ${showPredictions ? 'rgba(6, 182, 212, 0.4)' : 'var(--border-color)'}`,
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: 600
          }}
        >
          <Eye size={13} /> Trajectories {showPredictions ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={onRunEvaluation}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            color: '#fff',
            fontWeight: 700,
            padding: '7px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.82rem',
            boxShadow: '0 0 10px rgba(124, 58, 237, 0.3)'
          }}
        >
          <BarChart2 size={15} /> Run Evaluation
        </button>
      </div>
    </div>
  );
}
