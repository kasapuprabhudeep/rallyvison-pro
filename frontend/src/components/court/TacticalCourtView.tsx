import React, { useState } from 'react';
import { ShotEvent, MovementTrackPoint } from '../../types';
import { ShuttlecockIcon, CourtDimensionsIcon } from '../icons/BadmintonIcons';

interface TacticalCourtViewProps {
  tracks?: MovementTrackPoint[];
  shots?: ShotEvent[];
  courtType?: 'SINGLES' | 'DOUBLES';
  currentTime?: number;
  highlightPlayerId?: number;
  interactive?: boolean;
}

export const TacticalCourtView: React.FC<TacticalCourtViewProps> = ({
  tracks = [],
  shots = [],
  courtType = 'SINGLES',
  currentTime,
  highlightPlayerId = 1
}) => {
  const [selectedShot, setSelectedShot] = useState<ShotEvent | null>(null);

  // BWF Court dimensions in meters:
  // Length: 13.4m, Width: 5.18m (singles) or 6.1m (doubles)
  const courtW = courtType === 'SINGLES' ? 5.18 : 6.10;
  const courtL = 13.40;

  // ViewBox units: 1 meter = 40 SVG units
  const scale = 40;
  const svgW = courtW * scale; // 207.2 or 244
  const svgL = courtL * scale; // 536

  const netY = 6.70 * scale;
  const shortServiceTopY = (6.70 - 1.98) * scale;
  const shortServiceBottomY = (6.70 + 1.98) * scale;
  const rearServiceTopY = 0.76 * scale;
  const rearServiceBottomY = (13.40 - 0.76) * scale;

  // Map tracks to current time or show full trajectory path
  const relevantTracks = currentTime !== undefined
    ? tracks.filter(t => t.timestamp <= currentTime && t.player_id === highlightPlayerId)
    : tracks.filter(t => t.player_id === highlightPlayerId);

  // Current active player coordinate
  const currentPos = relevantTracks.length > 0 ? relevantTracks[relevantTracks.length - 1] : null;

  // Trajectory points string for SVG polyline
  const polylinePoints = relevantTracks
    .map(t => `${Math.max(0, Math.min(courtW, t.court_x_m)) * scale},${Math.max(0, Math.min(courtL, t.court_y_m)) * scale}`)
    .join(' ');

  const getShotColor = (type: string) => {
    switch (type) {
      case 'SMASH': return '#ef4444'; // Red
      case 'CLEAR': return '#38bdf8'; // Sky Blue
      case 'DROP': return '#f59e0b'; // Amber Gold
      case 'NET_SHOT': return '#10b981'; // Emerald Green
      case 'DRIVE': return '#a855f7'; // Purple
      case 'LIFT': return '#06b6d4'; // Cyan
      default: return '#94a3b8';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 glass-panel bg-[#091129]/80 rounded-3xl border border-cyan-500/30 shadow-2xl">
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
          <CourtDimensionsIcon className="w-4 h-4 text-cyan-400" />
          Tactical BWF 2D Replay ({courtType})
        </span>
        <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
          13.4m × {courtW}m
        </span>
      </div>

      <div className="relative border-4 border-cyan-300/40 rounded-2xl p-2.5 bg-[#0a1738] shadow-2xl w-full flex justify-center">
        <svg
          viewBox={`0 0 ${svgW} ${svgL}`}
          className="w-full max-w-[270px] sm:max-w-[320px] h-auto drop-shadow-xl"
          style={{ maxHeight: '540px' }}
        >
          {/* Court Surface */}
          <rect x="0" y="0" width={svgW} height={svgL} fill="#0a1738" />

          {/* Outer Boundary Line */}
          <rect x="0" y="0" width={svgW} height={svgL} fill="none" stroke="#ffffff" strokeWidth="3" />

          {/* Singles Sidelines if in Doubles view */}
          {courtType === 'DOUBLES' && (
            <>
              <line x1={0.46 * scale} y1="0" x2={0.46 * scale} y2={svgL} stroke="#ffffff" strokeWidth="2" strokeOpacity="0.9" />
              <line x1={(6.10 - 0.46) * scale} y1="0" x2={(6.10 - 0.46) * scale} y2={svgL} stroke="#ffffff" strokeWidth="2" strokeOpacity="0.9" />
            </>
          )}

          {/* Center Longitudinal Line */}
          <line
            x1={svgW / 2}
            y1="0"
            x2={svgW / 2}
            y2={shortServiceTopY}
            stroke="#ffffff"
            strokeWidth="2"
            strokeOpacity="0.9"
          />
          <line
            x1={svgW / 2}
            y1={shortServiceBottomY}
            x2={svgW / 2}
            y2={svgL}
            stroke="#ffffff"
            strokeWidth="2"
            strokeOpacity="0.9"
          />

          {/* Short Service Lines */}
          <line x1="0" y1={shortServiceTopY} x2={svgW} y2={shortServiceTopY} stroke="#ffffff" strokeWidth="2" strokeOpacity="0.9" />
          <line x1="0" y1={shortServiceBottomY} x2={svgW} y2={shortServiceBottomY} stroke="#ffffff" strokeWidth="2" strokeOpacity="0.9" />

          {/* Doubles Rear Service Lines */}
          {courtType === 'DOUBLES' && (
            <>
              <line x1="0" y1={rearServiceTopY} x2={svgW} y2={rearServiceTopY} stroke="#ffffff" strokeWidth="2" strokeOpacity="0.9" />
              <line x1="0" y1={rearServiceBottomY} x2={svgW} y2={rearServiceBottomY} stroke="#ffffff" strokeWidth="2" strokeOpacity="0.9" />
            </>
          )}

          {/* NET MESH & CABLE */}
          <rect x="-8" y={netY - 3} width={svgW + 16} height="6" fill="#facc15" rx="1.5" />
          <line x1="-10" y1={netY} x2={svgW + 10} y2={netY} stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" />

          {/* Player Movement Trajectory Path */}
          {polylinePoints && (
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#00f0ff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
              className="drop-shadow"
            />
          )}

          {/* Shot Event Markers */}
          {shots.map((s, idx) => {
            if (s.court_x_m === undefined || s.court_y_m === undefined) return null;
            const sx = Math.max(0, Math.min(courtW, s.court_x_m)) * scale;
            const sy = Math.max(0, Math.min(courtL, s.court_y_m)) * scale;
            const color = getShotColor(s.shot_type);

            return (
              <g
                key={idx}
                transform={`translate(${sx}, ${sy})`}
                onClick={() => setSelectedShot(s)}
                className="cursor-pointer group"
              >
                <circle r="7" fill={color} opacity="0.8" className="animate-pulse" />
                <circle r="4" fill="#ffffff" />
              </g>
            );
          })}

          {/* Current Active Footwork Position */}
          {currentPos && (
            <g transform={`translate(${Math.max(0, Math.min(courtW, currentPos.court_x_m)) * scale}, ${Math.max(0, Math.min(courtL, currentPos.court_y_m)) * scale})`}>
              <circle r="12" fill="#00f0ff" opacity="0.3" className="animate-ping" />
              <circle r="7" fill="#00f0ff" stroke="#ffffff" strokeWidth="2" />
              <text y="-11" textAnchor="middle" fill="#00f0ff" fontSize="10" fontWeight="black">
                PLAYER
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Selected Shot Detail Callout */}
      {selectedShot && (
        <div className="mt-3 p-3 rounded-xl bg-[#05091a] border border-cyan-500/30 text-xs w-full flex items-center justify-between animate-in fade-in duration-150">
          <div>
            <span className="font-extrabold text-white">{selectedShot.shot_type}</span>
            <span className="text-cyan-300/80 ml-2 font-mono">at {selectedShot.timestamp}s</span>
          </div>
          <button
            onClick={() => setSelectedShot(null)}
            className="text-cyan-400 font-bold hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Badminton Shot Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-300 font-medium">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Smash
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Drop
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          Clear
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Net Shot
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          Drive
        </span>
      </div>
    </div>
  );
};
