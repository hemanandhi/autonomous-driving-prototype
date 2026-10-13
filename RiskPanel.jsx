import React from 'react';
import { ShieldAlert, AlertTriangle, Activity, Compass, Info } from 'lucide-react';

export default function RiskPanel({ riskMetrics }) {
  const risk = riskMetrics || {
    riskScore: 0,
    riskLevel: 'LOW',
    highestRiskObstacleId: null,
    explanation: 'Corridor clear: Safe passage.',
    timeToCollision: null,
    nearestDistance: 999
  };

  const getLevelStyle = (level) => {
    switch (level) {
      case 'CRITICAL': return { color: '#ef4444', label: 'CRITICAL HAZARD' };
      case 'HIGH': return { color: '#f97316', label: 'HIGH RISK' };
      case 'MEDIUM': return { color: '#eab308', label: 'ELEVATED CAUTION' };
      default: return { color: '#10b981', label: 'LOW / CLEAR' };
    }
  };

  const levelStyle = getLevelStyle(risk.riskLevel);

  return (
    <div className="dashboard-card" style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={17} color={levelStyle.color} />
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>
            Multi-Factor Risk Assessment
          </h3>
        </div>
        <span style={{
          fontSize: '0.74rem',
          fontWeight: 800,
          color: levelStyle.color,
          letterSpacing: '0.04em'
        }}>
          {levelStyle.label}
        </span>
      </div>

      {/* Primary Risk Gauge Display */}
      <div style={{
        background: '#0a0f1c',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '14px',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>AGGREGATE THREAT INDEX</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: levelStyle.color, fontFamily: 'JetBrains Mono, monospace' }}>
            {risk.riskScore} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ 100</span>
          </span>
        </div>

        {/* Multi-segment risk threshold bar */}
        <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginTop: '10px', gap: '2px' }}>
          <div style={{ flex: 25, background: '#10b981', opacity: risk.riskScore <= 25 ? 1 : 0.4 }} title="0-25: Low" />
          <div style={{ flex: 35, background: '#eab308', opacity: risk.riskScore > 25 && risk.riskScore <= 60 ? 1 : 0.4 }} title="26-60: Medium" />
          <div style={{ flex: 25, background: '#f97316', opacity: risk.riskScore > 60 && risk.riskScore <= 85 ? 1 : 0.4 }} title="61-85: High" />
          <div style={{ flex: 15, background: '#ef4444', opacity: risk.riskScore > 85 ? 1 : 0.4 }} title="86-100: Critical" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>
          <span>LOW (0-25)</span>
          <span>MED (26-60)</span>
          <span>HIGH (61-85)</span>
          <span>CRIT (86+)</span>
        </div>
      </div>

      {/* Diagnostic Explanation Banner */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.5)',
        borderLeft: `3px solid ${levelStyle.color}`,
        borderRadius: '4px',
        padding: '10px 12px',
        marginBottom: '12px',
        fontSize: '0.78rem',
        color: '#e2e8f0',
        lineHeight: 1.4
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <Info size={13} color={levelStyle.color} />
          <strong style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8' }}>
            Real-Time Assessment Diagnostic:
          </strong>
        </div>
        {risk.explanation}
      </div>

      {/* Threat Factors Breakdown */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
          <span style={{ color: '#94a3b8' }}>Nearest Hazard Distance:</span>
          <strong style={{ color: '#f8fafc' }}>{risk.nearestDistance === 999 ? 'Clear (>260u)' : `${risk.nearestDistance} units`}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
          <span style={{ color: '#94a3b8' }}>Estimated Time to Collision (TTC):</span>
          <strong style={{ color: risk.timeToCollision && risk.timeToCollision < 2 ? '#ef4444' : '#f8fafc' }}>
            {risk.timeToCollision !== null ? `${risk.timeToCollision}s` : 'Safe / Non-closing'}
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
          <span style={{ color: '#94a3b8' }}>Target Threat ID:</span>
          <strong style={{ color: '#38bdf8' }}>{risk.highestRiskObstacleId || 'None'}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span style={{ color: '#94a3b8' }}>Speed Control State:</span>
          <strong style={{ color: levelStyle.color }}>
            {risk.riskLevel === 'CRITICAL' ? 'Full Stop Mandatory' : risk.riskLevel === 'HIGH' ? 'Braking / Creep' : 'Target Cruising'}
          </strong>
        </div>
      </div>
    </div>
  );
}
