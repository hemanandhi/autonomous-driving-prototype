import React, { useRef } from 'react';
import { Target, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function RoadSimulation({
  simulation,
  showRiskMap,
  showPredictions,
  showBoundaries,
  onCanvasClick
}) {
  const svgRef = useRef(null);

  const vehicle = simulation?.vehicleState || { x: 60, y: 200, headingDeg: 0, speedKmh: 0, width: 42, height: 22 };
  const destination = simulation?.destination || { x: 920, y: 200, radius: 30 };
  const roadBounds = simulation?.roadBounds || { minX: 0, maxX: 1000, minY: 70, maxY: 330, isNarrow: false };
  const obstacles = simulation?.obstacles || [];
  const plannedRoute = simulation?.plannedRoute || [];
  const rejectedRoutes = simulation?.rejectedRoutes || [];

  const handleSvgClick = (e) => {
    if (!svgRef.current || !onCanvasClick) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 1000 / rect.width;
    const scaleY = 400 / rect.height;
    const clickX = Math.round((e.clientX - rect.left) * scaleX);
    const clickY = Math.round((e.clientY - rect.top) * scaleY);

    if (clickX >= 0 && clickX <= 1000 && clickY >= 0 && clickY <= 400) {
      onCanvasClick(clickX, clickY);
    }
  };

  // Convert planned route waypoints into SVG path string
  const plannedPathD = plannedRoute.length > 0
    ? plannedRoute.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
    : '';

  // Render individual obstacle based on type
  const renderObstacle = (obs) => {
    const { id, type, x, y, width = 24, height = 24, safetyRadius = 24, isDynamic, predictedTrajectory } = obs;

    return (
      <g key={id} id={`obs-${id}`}>
        {/* Risk / Potential field halo */}
        {showRiskMap && (
          <circle
            cx={x}
            cy={y}
            r={safetyRadius + 18}
            fill={type === 'pothole' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.15)'}
            stroke={type === 'pothole' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.4)'}
            strokeDasharray="3 3"
          />
        )}

        {/* Dynamic Trajectory predictions */}
        {showPredictions && isDynamic && predictedTrajectory && predictedTrajectory.length > 1 && (
          <g>
            <polyline
              points={predictedTrajectory.map(pt => `${pt.x},${pt.y}`).join(' ')}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {predictedTrajectory.slice(1).map((pt, idx) => (
              <g key={idx}>
                <circle cx={pt.x} cy={pt.y} r="3" fill="#22d3ee" />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={Math.min(22, (pt.uncertaintyRadius || 15) * 0.5)}
                  fill="none"
                  stroke="rgba(6, 182, 212, 0.25)"
                />
                <text
                  x={pt.x + 4}
                  y={pt.y - 4}
                  fill="#67e8f9"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  +{pt.t}s
                </text>
              </g>
            ))}
          </g>
        )}

        {/* Specific Object Renderers */}
        {type === 'motorcycle' && (
          <g transform={`translate(${x}, ${y})`}>
            {/* Wheels */}
            <rect x="-14" y="-3" width="6" height="6" rx="2" fill="#1e293b" />
            <rect x="8" y="-3" width="6" height="6" rx="2" fill="#1e293b" />
            {/* Motorcycle Body */}
            <rect x="-12" y="-4" width="24" height="8" rx="4" fill="#ef4444" stroke="#fca5a5" strokeWidth="1" />
            {/* Rider Helmet */}
            <circle cx="-1" cy="0" r="5" fill="#f8fafc" stroke="#334155" strokeWidth="1" />
            {/* Headlight beam (pointing left since it's oncoming) */}
            <polygon points="-14,0 -40,-12 -40,12" fill="rgba(254, 240, 138, 0.25)" />
            <text x="0" y="-10" textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="bold">MOTO</text>
          </g>
        )}

        {type === 'pedestrian' && (
          <g transform={`translate(${x}, ${y})`}>
            {/* Pedestrian Body & Head */}
            <circle cx="0" cy="0" r="6" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
            {/* Shoulders */}
            <line x1="-6" y1="0" x2="6" y2="0" stroke="#bae6fd" strokeWidth="3" strokeLinecap="round" />
            <text x="0" y="-9" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">PEDESTRIAN</text>
          </g>
        )}

        {type === 'cow' && (
          <g transform={`translate(${x}, ${y})`}>
            {/* Cow Body */}
            <ellipse cx="0" cy="0" rx="16" ry="10" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
            {/* Cow Head */}
            <circle cx="14" cy="-2" r="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
            {/* Horns */}
            <path d="M 16 -7 Q 19 -11 16 -13" fill="none" stroke="#713f12" strokeWidth="2" strokeLinecap="round" />
            <path d="M 13 -7 Q 14 -11 11 -13" fill="none" stroke="#713f12" strokeWidth="2" strokeLinecap="round" />
            {/* Cow Spots */}
            <ellipse cx="-4" cy="-2" rx="4" ry="3" fill="#854d0e" />
            <ellipse cx="6" cy="3" rx="3" ry="2" fill="#854d0e" />
            <text x="0" y="-14" textAnchor="middle" fill="#fef08a" fontSize="8" fontWeight="bold">COW (LIVESTOCK)</text>
          </g>
        )}

        {type === 'pothole' && (
          <g transform={`translate(${x}, ${y})`}>
            {/* Outer irregular crater ring */}
            <ellipse cx="0" cy="0" rx="18" ry="12" fill="#080c14" stroke="#78350f" strokeWidth="2" />
            {/* Deep center crater */}
            <ellipse cx="2" cy="1" rx="11" ry="7" fill="#020408" />
            {/* Crack lines */}
            <path d="M -18 0 L -24 -4 M 18 2 L 25 5 M 0 -12 L 2 -18" stroke="#451a03" strokeWidth="1.5" strokeLinecap="round" />
            <text x="0" y="-15" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="bold">POTHOLE</text>
          </g>
        )}

        {type === 'car' && (
          <g transform={`translate(${x}, ${y})`}>
            {/* Wheels */}
            <rect x="-18" y="-12" width="8" height="4" rx="1" fill="#0f172a" />
            <rect x="10" y="-12" width="8" height="4" rx="1" fill="#0f172a" />
            <rect x="-18" y="8" width="8" height="4" rx="1" fill="#0f172a" />
            <rect x="10" y="8" width="8" height="4" rx="1" fill="#0f172a" />
            {/* Car Body */}
            <rect x="-20" y="-10" width="40" height="20" rx="5" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.5" />
            {/* Windshield */}
            <polygon points="-8,-8 10,-8 6,8 -8,8" fill="#1e293b" />
            <text x="0" y="-14" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">AUTO / CAR</text>
          </g>
        )}

        {type === 'barrier' && (
          <g transform={`translate(${x}, ${y})`}>
            <rect x="-24" y="-8" width="48" height="16" fill="#dc2626" stroke="#f87171" strokeWidth="2" />
            <line x1="-16" y1="-8" x2="-8" y2="8" stroke="#ffffff" strokeWidth="3" />
            <line x1="0" y1="-8" x2="8" y2="8" stroke="#ffffff" strokeWidth="3" />
            <text x="0" y="-12" textAnchor="middle" fill="#f87171" fontSize="8" fontWeight="bold">BARRIER</text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="dashboard-card" style={{
      margin: '0 24px 16px 24px',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Simulation Top Bar */}
      <div style={{
        padding: '10px 16px',
        background: '#090e1a',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.8rem',
        color: '#94a3b8'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color="#10b981" />
          <strong style={{ color: '#f8fafc' }}>Interactive 2D Top-Down Simulation Environment</strong>
          <span>• Click canvas to position custom obstacle</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            A* Planned Path
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
            Rejected Route
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#06b6d4', display: 'inline-block' }}></span>
            Motion Forecast
          </span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div style={{ width: '100%', position: 'relative', background: '#0b101c' }}>
        <svg
          ref={svgRef}
          viewBox="0 0 1000 400"
          style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
          onClick={handleSvgClick}
        >
          <defs>
            {/* Glowing effect filter */}
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Asphalt Texture Pattern */}
            <pattern id="asphalt-grain" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#161c2b" />
              <circle cx="10" cy="12" r="1" fill="#111624" />
              <circle cx="28" cy="24" r="1.2" fill="#111624" />
              <circle cx="34" cy="8" r="0.8" fill="#1e2538" />
              <circle cx="15" cy="30" r="0.9" fill="#1e2538" />
            </pattern>
          </defs>

          {/* 1. Unpaved Road Shoulders (Top & Bottom) */}
          <rect x="0" y="0" width="1000" height="400" fill="#221b14" />

          {/* 2. Drivable Road Surface */}
          {roadBounds.isNarrow ? (
            /* Narrow Road Geometry with Bottleneck */
            <path
              d={`
                M 0 ${roadBounds.minY}
                L ${roadBounds.narrowSection?.startX || 320} ${roadBounds.minY}
                L ${roadBounds.narrowSection?.startX + 40} ${roadBounds.narrowSection?.minY || 125}
                L ${roadBounds.narrowSection?.endX - 40} ${roadBounds.narrowSection?.minY || 125}
                L ${roadBounds.narrowSection?.endX || 680} ${roadBounds.minY}
                L 1000 ${roadBounds.minY}
                L 1000 ${roadBounds.maxY}
                L ${roadBounds.narrowSection?.endX || 680} ${roadBounds.maxY}
                L ${roadBounds.narrowSection?.endX - 40} ${roadBounds.narrowSection?.maxY || 275}
                L ${roadBounds.narrowSection?.startX + 40} ${roadBounds.narrowSection?.maxY || 275}
                L ${roadBounds.narrowSection?.startX || 320} ${roadBounds.maxY}
                L 0 ${roadBounds.maxY}
                Z
              `}
              fill="url(#asphalt-grain)"
              stroke="#475569"
              strokeWidth="2"
            />
          ) : (
            /* Standard Wide Road */
            <rect
              x="0"
              y={roadBounds.minY}
              width="1000"
              height={roadBounds.maxY - roadBounds.minY}
              fill="url(#asphalt-grain)"
              stroke="#475569"
              strokeWidth="2"
            />
          )}

          {/* 3. Road Markings (Indian Road Centerline dashes) */}
          <line
            x1="0"
            y1="200"
            x2="1000"
            y2="200"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="18 16"
          />

          {/* Road boundaries markings */}
          {showBoundaries && (
            <g opacity="0.6">
              <line x1="0" y1={roadBounds.minY} x2="1000" y2={roadBounds.minY} stroke="#ffffff" strokeWidth="2" strokeDasharray="8 6" />
              <line x1="0" y1={roadBounds.maxY} x2="1000" y2={roadBounds.maxY} stroke="#ffffff" strokeWidth="2" strokeDasharray="8 6" />
            </g>
          )}

          {/* 4. Destination Marker */}
          <g id="destination-marker">
            <circle cx={destination.x} cy={destination.y} r={destination.radius} fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4">
              <animate attributeName="r" values="24;36;24" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={destination.x} cy={destination.y} r="10" fill="#10b981" />
            {/* Flag icon */}
            <path d={`M ${destination.x} ${destination.y - 18} L ${destination.x} ${destination.y + 4} M ${destination.x} ${destination.y - 18} L ${destination.x + 14} ${destination.y - 11} L ${destination.x} ${destination.y - 4}`} fill="#34d399" stroke="#059669" strokeWidth="1.5" />
            <text x={destination.x} y={destination.y + 24} textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">
              DESTINATION
            </text>
          </g>

          {/* 5. Rejected / Unsafe Candidate Paths (Red) */}
          {rejectedRoutes.map((rejPath, idx) => (
            <polyline
              key={idx}
              points={rejPath.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.75"
              filter="url(#glow-red)"
            />
          ))}

          {/* 6. A* Selected Safe Route (Glowing Green) */}
          {plannedPathD && (
            <g id="planned-route">
              <path
                d={plannedPathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow-green)"
              />
              {/* Waypoint Nodes */}
              {plannedRoute.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r="2.5"
                  fill="#6ee7b7"
                />
              ))}
            </g>
          )}

          {/* 7. Detected Obstacles */}
          {obstacles.map(renderObstacle)}

          {/* 8. Ego Autonomous Vehicle */}
          <g
            id="ego-vehicle"
            transform={`translate(${vehicle.x}, ${vehicle.y}) rotate(${vehicle.headingDeg || 0})`}
          >
            {/* Headlight beams */}
            <polygon
              points="20,-8 90,-26 90,26 20,8"
              fill="rgba(96, 165, 250, 0.22)"
            />

            {/* Safety Radius Halo */}
            <circle
              cx="0"
              cy="0"
              r={vehicle.safetyRadius || 28}
              fill="rgba(59, 130, 246, 0.08)"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeDasharray="3 3"
            />

            {/* Tires */}
            <rect x="-18" y="-14" width="9" height="5" rx="1.5" fill="#020617" />
            <rect x="10" y="-14" width="9" height="5" rx="1.5" fill="#020617" />
            <rect x="-18" y="9" width="9" height="5" rx="1.5" fill="#020617" />
            <rect x="10" y="9" width="9" height="5" rx="1.5" fill="#020617" />

            {/* Main Chassis Body */}
            <rect
              x="-21"
              y="-11"
              width="42"
              height="22"
              rx="6"
              fill="#2563eb"
              stroke="#60a5fa"
              strokeWidth="1.5"
            />

            {/* Roof / Cabin */}
            <rect
              x="-10"
              y="-8"
              width="22"
              height="16"
              rx="4"
              fill="#1d4ed8"
            />

            {/* Windshield */}
            <polygon points="4,-7 11,-5 11,5 4,7" fill="#93c5fd" />
            <polygon points="-7,-7 -3,-7 -3,7 -7,7" fill="#1e3a8a" />

            {/* Brake lights (Turn bright red when speed is 0 or low) */}
            <rect
              x="-21"
              y="-10"
              width="2"
              height="5"
              fill={vehicle.speedKmh < 15 ? '#ef4444' : '#7f1d1d'}
              filter={vehicle.speedKmh < 15 ? 'url(#glow-red)' : 'none'}
            />
            <rect
              x="-21"
              y="5"
              width="2"
              height="5"
              fill={vehicle.speedKmh < 15 ? '#ef4444' : '#7f1d1d'}
              filter={vehicle.speedKmh < 15 ? 'url(#glow-red)' : 'none'}
            />

            {/* Autonomous Sensor Pod on Roof */}
            <circle cx="0" cy="0" r="3" fill="#38bdf8" />
            <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
          </g>
        </svg>

        {/* Floating Vehicle Status Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '16px',
          background: 'rgba(13, 19, 34, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '0.75rem',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div>Vehicle Pos: <strong style={{ color: '#38bdf8' }}>({Math.round(vehicle.x)}, {Math.round(vehicle.y)})</strong></div>
          <div>Heading: <strong style={{ color: '#f8fafc' }}>{Math.round(vehicle.headingDeg || 0)}°</strong></div>
          <div>Speed: <strong style={{ color: '#10b981' }}>{vehicle.speedKmh} km/h</strong></div>
        </div>
      </div>
    </div>
  );
}
