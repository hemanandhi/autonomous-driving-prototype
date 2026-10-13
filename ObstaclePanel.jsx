import React, { useState } from 'react';
import { ShieldAlert, Trash2, Plus, AlertCircle, Compass } from 'lucide-react';

export default function ObstaclePanel({
  obstacles,
  onAddObstacle,
  onDeleteObstacle,
  isAddModalOpen,
  setIsAddModalOpen,
  vehiclePosition
}) {
  const [formData, setFormData] = useState({
    type: 'cow',
    label: 'Stray Cow on Roadway',
    x: 450,
    y: 200,
    vx: 0,
    vy: 0,
    safetyRadius: 24
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddObstacle({
      ...formData,
      x: Number(formData.x),
      y: Number(formData.y),
      vx: Number(formData.vx),
      vy: Number(formData.vy),
      safetyRadius: Number(formData.safetyRadius),
      isDynamic: Number(formData.vx) !== 0 || Number(formData.vy) !== 0
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="dashboard-card" style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={17} color="#fbbf24" />
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>
            Detected Roadway Obstacles ({obstacles.length})
          </h3>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.74rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Obstacles List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px' }}>
        {obstacles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748b', fontSize: '0.8rem' }}>
            No active obstacles in sensor range. Road corridor clear.
          </div>
        ) : (
          obstacles.map((obs) => {
            const dist = vehiclePosition
              ? Math.round(Math.hypot(obs.x - vehiclePosition.x, obs.y - vehiclePosition.y))
              : null;
            const hasConflict = obs.conflictData?.hasConflict;

            return (
              <div
                key={obs.id}
                style={{
                  background: '#0a0f1c',
                  border: `1px solid ${hasConflict ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)'}`,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: '#f8fafc' }}>{obs.label || obs.type}</strong>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: '#1e293b',
                      color: '#94a3b8',
                      textTransform: 'uppercase'
                    }}>
                      {obs.type}
                    </span>
                    {hasConflict && (
                      <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 700 }}>
                        PATH CONFLICT
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#94a3b8', marginTop: '3px', fontSize: '0.72rem', display: 'flex', gap: '10px' }}>
                    <span>Pos: ({Math.round(obs.x)}, {Math.round(obs.y)})</span>
                    <span>Vel: ({obs.vx || 0}, {obs.vy || 0}) px/s</span>
                    {dist !== null && <span>Dist: <strong style={{ color: '#38bdf8' }}>{dist}u</strong></span>}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteObstacle(obs.id)}
                  title="Remove obstacle"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Obstacle Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '20px',
            width: '380px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
              Add Roadway Obstacle
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Obstacle Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, label: `${e.target.value.toUpperCase()} Hazard` })}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}
                >
                  <option value="cow">Stray Cow (Livestock)</option>
                  <option value="motorcycle">Oncoming Motorcycle</option>
                  <option value="pedestrian">Pedestrian Crossing</option>
                  <option value="pothole">Monsoon Pothole</option>
                  <option value="car">Parked Car / Auto</option>
                  <option value="barrier">Roadwork Barrier</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>X Coordinate (0-1000)</label>
                  <input
                    type="number"
                    value={formData.x}
                    onChange={(e) => setFormData({ ...formData, x: e.target.value })}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Y Coordinate (70-330)</label>
                  <input
                    type="number"
                    value={formData.y}
                    onChange={(e) => setFormData({ ...formData, y: e.target.value })}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Vx (px/sec)</label>
                  <input
                    type="number"
                    value={formData.vx}
                    onChange={(e) => setFormData({ ...formData, vx: e.target.value })}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Vy (px/sec)</label>
                  <input
                    type="number"
                    value={formData.vy}
                    onChange={(e) => setFormData({ ...formData, vy: e.target.value })}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  Place Obstacle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
