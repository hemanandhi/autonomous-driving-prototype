import React from 'react';
import { Shield, Zap, Database, AlertTriangle, Radio } from 'lucide-react';

export default function Header({ backendHealth, simulationStatus }) {
  const isMongo = backendHealth.storageMode === 'mongodb';
  const isOnline = backendHealth.connected;

  const getStatusBadge = () => {
    switch (simulationStatus) {
      case 'RUNNING':
        return <span className="status-pill pill-green"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>RUNNING</span>;
      case 'PAUSED':
        return <span className="status-pill pill-amber">PAUSED</span>;
      case 'EMERGENCY_STOP':
        return <span className="status-pill pill-red animate-ping-danger">EMERGENCY STOP</span>;
      case 'COMPLETED':
        return <span className="status-pill pill-blue">COMPLETED</span>;
      default:
        return <span className="status-pill" style={{ background: 'rgba(100,116,139,0.2)', color: '#94a3b8' }}>IDLE</span>;
    }
  };

  return (
    <header style={{
      background: 'linear-gradient(180deg, #0d1424 0%, #080c16 100%)',
      borderBottom: '1px solid var(--border-color)',
      padding: '16px 24px',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)'
        }}>
          <Shield size={24} color="#60a5fa" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              Adaptive Path Planning & Collision Avoidance
            </h1>
            <span style={{
              background: '#1e293b',
              color: '#38bdf8',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              border: '1px solid #0284c7'
            }}>
              SIH 2026: SIH26037
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>
            Unstructured Indian Road Environment • Autonomous Vehicle Prototype
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Connection status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: '#101726',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem'
        }}>
          <Radio size={14} color={isOnline ? '#10b981' : '#ef4444'} />
          <span style={{ color: '#94a3b8' }}>API:</span>
          <span style={{ fontWeight: 600, color: isOnline ? '#34d399' : '#f87171' }}>
            {isOnline ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Database Mode */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: isMongo ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          borderRadius: '8px',
          border: `1px solid ${isMongo ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          fontSize: '0.8rem'
        }} title={backendHealth.warning || 'Database status'}>
          <Database size={14} color={isMongo ? '#10b981' : '#f59e0b'} />
          <span style={{ color: '#cbd5e1' }}>Storage:</span>
          <span style={{ fontWeight: 600, color: isMongo ? '#34d399' : '#fbbf24' }}>
            {backendHealth.storageModeLabel}
          </span>
        </div>

        {/* Simulation status */}
        {getStatusBadge()}
      </div>
    </header>
  );
}
