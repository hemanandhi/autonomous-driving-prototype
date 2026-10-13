import React from 'react';
import { AlertTriangle, RefreshCw, Info } from 'lucide-react';

export default function ConnectionStatus({ backendHealth, onRetry, error }) {
  if (!backendHealth.connected) {
    return (
      <div style={{
        background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.25) 100%)',
        borderBottom: '1px solid #ef4444',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        color: '#fecaca'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} color="#ef4444" />
          <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>
            <strong>Backend Connection Disconnected:</strong> {error || 'Unable to communicate with simulation server at http://localhost:5000/api.'}
          </span>
        </div>
        <button
          onClick={onRetry}
          style={{
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  // If connected in demo mode, show non-intrusive reminder
  if (backendHealth.storageMode === 'demo') {
    return (
      <div style={{
        background: 'rgba(245, 158, 11, 0.08)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
        padding: '6px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        color: '#fbbf24'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={14} color="#f59e0b" />
          <span>
            <strong>Temporary In-Memory Demo Mode:</strong> MongoDB is not connected. All simulation sessions and events are kept in RAM and will reset when the server restarts.
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#d97706', fontFamily: 'monospace' }}>
          STORAGE_MODE=auto (demo active)
        </span>
      </div>
    );
  }

  return null;
}
