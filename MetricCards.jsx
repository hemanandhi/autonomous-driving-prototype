import React from 'react';
import { Gauge, ShieldAlert, GitFork, Navigation, Flag, Ruler } from 'lucide-react';

export default function MetricCards({ simulation }) {
  const vehicle = simulation?.vehicleState || { speedKmh: 0, x: 0, y: 0 };
  const risk = simulation?.riskMetrics || { riskScore: 0, riskLevel: 'LOW', nearestDistance: 999 };
  const metrics = simulation?.metrics || { distanceTravelled: 0, replanningCount: 0 };
  const destination = simulation?.destination || { x: 920, y: 200 };

  const distToGoal = Math.round(Math.hypot(destination.x - vehicle.x, destination.y - vehicle.y));

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return { text: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' };
      case 'HIGH': return { text: '#fb923c', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)' };
      case 'MEDIUM': return { text: '#facc15', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)' };
      default: return { text: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' };
    }
  };

  const riskTheme = getRiskColor(risk.riskLevel);

  const getNavStatus = () => {
    if (simulation?.status === 'EMERGENCY_STOP') return { label: 'EMERGENCY STOPPED', color: '#ef4444' };
    if (simulation?.status === 'COMPLETED') return { label: 'GOAL REACHED', color: '#38bdf8' };
    if (simulation?.status === 'PAUSED') return { label: 'PAUSED', color: '#f59e0b' };
    if (vehicle.speedKmh === 0) return { label: 'HOLDING (0 km/h)', color: '#94a3b8' };
    if (risk.riskLevel === 'HIGH') return { label: 'DECELERATING / EVADING', color: '#f97316' };
    if (risk.riskLevel === 'MEDIUM') return { label: 'CAUTION TRACKING', color: '#facc15' };
    return { label: 'CRUISING NOMINAL', color: '#10b981' };
  };

  const navStatus = getNavStatus();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '14px',
      padding: '16px 24px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)'
    }}>
      {/* 1. Vehicle Speed */}
      <div className="dashboard-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
          <span>VEHICLE SPEED</span>
          <Gauge size={16} color="#60a5fa" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
            {vehicle.speedKmh}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>km/h</span>
        </div>
        <div style={{ width: '100%', height: '4px', background: '#1e293b', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(100, (vehicle.speedKmh / 50) * 100)}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
            transition: 'width 0.2s ease'
          }} />
        </div>
      </div>

      {/* 2. Collision Risk Score */}
      <div className="dashboard-card" style={{
        padding: '14px 16px',
        border: `1px solid ${riskTheme.border}`,
        background: riskTheme.bg
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
          <span>COLLISION RISK</span>
          <ShieldAlert size={16} color={riskTheme.text} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: riskTheme.text, fontFamily: 'JetBrains Mono, monospace' }}>
              {risk.riskScore}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ 100</span>
          </div>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '4px',
            background: riskTheme.border,
            color: riskTheme.text
          }}>
            {risk.riskLevel}
          </span>
        </div>
        <div style={{ width: '100%', height: '4px', background: '#1e293b', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
          <div style={{
            width: `${risk.riskScore}%`,
            height: '100%',
            background: risk.riskScore > 60 ? '#ef4444' : risk.riskScore > 25 ? '#f59e0b' : '#10b981',
            transition: 'width 0.2s ease'
          }} />
        </div>
      </div>

      {/* 3. Nearest Obstacle Distance */}
      <div className="dashboard-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
          <span>OBSTACLE PROXIMITY</span>
          <Ruler size={16} color="#fbbf24" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
          <span style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: risk.nearestDistance < 50 ? '#f87171' : risk.nearestDistance < 120 ? '#fbbf24' : '#f8fafc',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            {risk.nearestDistance === 999 ? '∞' : risk.nearestDistance}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>units</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>
          Min Recorded: <strong style={{ color: '#cbd5e1' }}>{metrics.minObstacleClearance === 999 ? 'N/A' : `${Math.round(metrics.minObstacleClearance)}u`}</strong>
        </div>
      </div>

      {/* 4. Navigation Status */}
      <div className="dashboard-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
          <span>NAVIGATION STATUS</span>
          <Navigation size={16} color={navStatus.color} />
        </div>
        <div style={{ marginTop: '10px' }}>
          <span style={{
            fontSize: '0.9rem',
            fontWeight: 800,
            color: navStatus.color,
            display: 'block',
            letterSpacing: '0.02em'
          }}>
            {navStatus.label}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
            Heading: {Math.round(vehicle.headingDeg || 0)}° • Pure Pursuit
          </span>
        </div>
      </div>

      {/* 5. Replanning Count */}
      <div className="dashboard-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
          <span>DYNAMIC REPLANS</span>
          <GitFork size={16} color="#a855f7" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c084fc', fontFamily: 'JetBrains Mono, monospace' }}>
            {metrics.replanningCount || 0}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>times</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>
          A* Computation: <strong style={{ color: '#cbd5e1' }}>{metrics.avgComputationTimeMs || 4.2}ms</strong>
        </div>
      </div>

      {/* 6. Distance Travelled & Goal */}
      <div className="dashboard-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
          <span>DESTINATION RANGE</span>
          <Flag size={16} color="#10b981" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
            {distToGoal}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>units remaining</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>
          Travelled: <strong style={{ color: '#38bdf8' }}>{Math.round(metrics.distanceTravelled || 0)}u</strong>
        </div>
      </div>
    </div>
  );
}
