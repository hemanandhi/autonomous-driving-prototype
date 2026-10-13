import React from 'react';
import { ListFilter, Info, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function EventLog({ events = [] }) {
  const getSeverityIcon = (sev) => {
    switch (sev) {
      case 'CRITICAL':
      case 'DANGER':
        return <AlertOctagon size={14} color="#ef4444" />;
      case 'WARNING':
        return <AlertTriangle size={14} color="#f59e0b" />;
      default:
        return <Info size={14} color="#3b82f6" />;
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="status-pill pill-red" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>CRITICAL</span>;
      case 'WARNING':
        return <span className="status-pill pill-amber" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>WARNING</span>;
      default:
        return <span className="status-pill pill-blue" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>INFO</span>;
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="dashboard-card" style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListFilter size={17} color="#60a5fa" />
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>
            Live Telemetry & Navigation Events ({events.length})
          </h3>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
          De-duplicated Log Stream
        </span>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        maxHeight: '260px'
      }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748b', fontSize: '0.8rem' }}>
            No events recorded yet. Start simulation to observe telemetry events.
          </div>
        ) : (
          events.map((evt, idx) => (
            <div
              key={evt.id || idx}
              style={{
                background: '#0a0f1c',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '0.78rem'
              }}
            >
              <div style={{ marginTop: '2px' }}>
                {getSeverityIcon(evt.severity)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  {getSeverityBadge(evt.severity)}
                  <span style={{ color: '#64748b', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                    {formatTime(evt.timestamp || evt.createdAt)}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>
                    {evt.type}
                  </span>
                </div>
                <div style={{ color: '#e2e8f0', lineHeight: 1.35 }}>
                  {evt.message}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
