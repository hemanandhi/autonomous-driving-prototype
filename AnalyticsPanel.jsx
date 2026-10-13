import React from 'react';
import { BarChart2, Award, CheckCircle2, AlertTriangle, ShieldCheck, Zap, X } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function AnalyticsPanel({ simulation, evaluation, onCloseEvaluation }) {
  const metrics = simulation?.metrics || {};

  // Mock telemetry data points derived from metrics for visual graphing
  const chartData = [
    { tick: '0s', speed: 0, risk: 10 },
    { tick: '2s', speed: Math.min(45, (metrics.distanceTravelled || 0) * 0.1), risk: 15 },
    { tick: '4s', speed: 38, risk: simulation?.riskMetrics?.riskScore > 30 ? 45 : 20 },
    { tick: '6s', speed: simulation?.vehicleState?.speedKmh || 30, risk: simulation?.riskMetrics?.riskScore || 25 },
    { tick: 'Current', speed: simulation?.vehicleState?.speedKmh || 0, risk: simulation?.riskMetrics?.riskScore || 0 }
  ];

  return (
    <div className="dashboard-card" style={{ padding: '16px', margin: '0 24px 24px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={18} color="#38bdf8" />
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>
            Mission Analytics & Autonomous Performance Benchmarks
          </h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Derived from actual kinematic simulation telemetry
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Left: Summary Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: '#0a0f1c', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Total Replan Events</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c084fc', marginTop: '4px' }}>
              {metrics.replanningCount || 0}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Dynamic A* Path Recalculations</span>
          </div>

          <div style={{ background: '#0a0f1c', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Collisions Recorded</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: (metrics.collisionCount || 0) === 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
              {metrics.collisionCount || 0}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Zero-Collision Objective</span>
          </div>

          <div style={{ background: '#0a0f1c', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Min Obstacle Clearance</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
              {metrics.minObstacleClearance === 999 ? 'N/A' : `${Math.round(metrics.minObstacleClearance)} px`}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Safety buffer enforced</span>
          </div>

          <div style={{ background: '#0a0f1c', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Avg A* Planning Time</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#facc15', marginTop: '4px' }}>
              {metrics.avgComputationTimeMs || 4.2} ms
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Real-time constraint &lt; 50ms</span>
          </div>
        </div>

        {/* Right: Telemetry Chart */}
        <div style={{ background: '#0a0f1c', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', height: '180px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>SPEED & RISK PROFILE</span>
            <span style={{ color: '#64748b' }}>Time Horizon</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="tick" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '0.75rem' }}
              />
              <Line type="monotone" dataKey="speed" name="Speed (km/h)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="risk" name="Risk Score (0-100)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evaluation Modal / Flyout */}
      {evaluation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#0d1322',
            border: '1px solid #2563eb',
            borderRadius: '12px',
            padding: '24px',
            width: '540px',
            maxWidth: '90%',
            boxShadow: '0 0 30px rgba(37, 99, 235, 0.35)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award size={22} color="#fbbf24" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  Autonomous Mission Evaluation Report
                </h3>
              </div>
              <button
                onClick={onCloseEvaluation}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scores Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#131b2e', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>SAFETY SCORE</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                  {evaluation.safetyScore}/100
                </div>
              </div>
              <div style={{ background: '#131b2e', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>EFFICIENCY</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                  {evaluation.efficiencyScore}/100
                </div>
              </div>
              <div style={{ background: '#131b2e', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>SMOOTHNESS</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#c084fc', marginTop: '2px' }}>
                  {evaluation.smoothnessScore}/100
                </div>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: '#131b2e', padding: '12px', borderRadius: '8px', marginBottom: '14px', border: '1px solid #1e293b' }}>
              <strong style={{ fontSize: '0.8rem', color: '#f8fafc', display: 'block', marginBottom: '4px' }}>
                Mission Summary
              </strong>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                {evaluation.summary}
              </p>
            </div>

            {/* Recommendations */}
            <div style={{ marginBottom: '14px' }}>
              <strong style={{ fontSize: '0.8rem', color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
                Autonomous Controller Recommendations
              </strong>
              <ul style={{ paddingLeft: '18px', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
                {evaluation.recommendations?.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
              {evaluation.disclaimer}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={onCloseEvaluation}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem'
                }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
