import React from 'react';
import { Layers, ShieldCheck, Bike, User, AlertOctagon, GitMerge, Zap } from 'lucide-react';

const SCENARIO_ICONS = {
  'normal-road': ShieldCheck,
  'oncoming-motorcycle': Bike,
  'pedestrian-crossing': User,
  'pothole-narrow': AlertOctagon,
  'multiple-obstacles': GitMerge,
  'dynamic-traffic': Zap
};

export default function ScenarioSelector({ scenarios, activeScenarioId, onSelectScenario, disabled }) {
  return (
    <div className="dashboard-card" style={{ padding: '16px 20px', margin: '16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Layers size={18} color="#3b82f6" />
        <h2 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          Select Road Environment Scenario
        </h2>
        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 'auto' }}>
          6 Pre-configured Benchmarks
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '10px'
      }}>
        {scenarios.map((scen) => {
          const isActive = scen.id === activeScenarioId;
          const Icon = SCENARIO_ICONS[scen.id] || Layers;

          return (
            <button
              key={scen.id}
              onClick={() => onSelectScenario(scen.id)}
              disabled={disabled}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: isActive ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(30, 58, 138, 0.4) 100%)' : '#0d1322',
                border: isActive ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                textAlign: 'left',
                color: '#f8fafc',
                cursor: disabled ? 'not-allowed' : 'pointer',
                boxShadow: isActive ? '0 0 14px rgba(59, 130, 246, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                marginTop: '2px',
                padding: '6px',
                borderRadius: '6px',
                background: isActive ? '#2563eb' : '#1e293b',
                color: isActive ? '#fff' : '#94a3b8'
              }}>
                <Icon size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: isActive ? '#60a5fa' : '#e2e8f0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {scen.name.split(' (')[0]}
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#1e293b',
                    color: '#94a3b8',
                    fontFamily: 'monospace'
                  }}>
                    {scen.obstacleCount} obs
                  </span>
                </div>
                <p style={{
                  fontSize: '0.74rem',
                  color: '#94a3b8',
                  marginTop: '4px',
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {scen.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
