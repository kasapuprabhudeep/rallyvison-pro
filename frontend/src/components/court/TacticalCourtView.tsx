import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ShotEvent, MovementTrackPoint } from '../../types';
import { CourtDimensionsIcon } from '../icons/BadmintonIcons';
import { Play, Pause, RotateCcw, FastForward, Activity, User, Eye, Zap } from 'lucide-react';

interface TacticalCourtViewProps {
  tracks?: MovementTrackPoint[];
  shots?: ShotEvent[];
  courtType?: 'SINGLES' | 'DOUBLES';
  currentTime?: number;
  highlightPlayerId?: number;
  interactive?: boolean;
}

type AvatarMode = 'ATHLETE' | 'HOLOGRAM' | 'DOT';
type AthleteStance = 'READY' | 'LUNGE' | 'SMASH' | 'SPRINT';

// Sample rally trajectory for instant preview if no tracks are loaded yet
const SAMPLE_RALLY_TRACKS: MovementTrackPoint[] = [
  { timestamp: 0.0, player_id: 1, court_x_m: 2.59, court_y_m: 6.80, speed_kmh: 2.1, zone: 'MID_RIGHT', is_base: true },
  { timestamp: 0.8, player_id: 1, court_x_m: 2.65, court_y_m: 6.70, speed_kmh: 5.4, zone: 'MID_RIGHT', is_base: true },
  { timestamp: 1.6, player_id: 1, court_x_m: 3.80, court_y_m: 9.90, speed_kmh: 13.8, zone: 'REAR_RIGHT', is_base: false },
  { timestamp: 2.4, player_id: 1, court_x_m: 4.10, court_y_m: 11.80, speed_kmh: 16.5, zone: 'REAR_RIGHT', is_base: false }, // Jump smash
  { timestamp: 3.2, player_id: 1, court_x_m: 3.10, court_y_m: 8.40, speed_kmh: 11.2, zone: 'MID_RIGHT', is_base: false },
  { timestamp: 4.0, player_id: 1, court_x_m: 2.59, court_y_m: 6.70, speed_kmh: 4.0, zone: 'MID_RIGHT', is_base: true }, // T-reset
  { timestamp: 4.8, player_id: 1, court_x_m: 1.40, court_y_m: 3.20, speed_kmh: 14.2, zone: 'FRONT_LEFT', is_base: false }, // Lunge net kill
  { timestamp: 5.6, player_id: 1, court_x_m: 1.20, court_y_m: 2.40, speed_kmh: 8.1, zone: 'FRONT_LEFT', is_base: false },
  { timestamp: 6.4, player_id: 1, court_x_m: 2.59, court_y_m: 6.70, speed_kmh: 6.0, zone: 'MID_LEFT', is_base: true },
];

const SAMPLE_SHOTS: ShotEvent[] = [
  { id: 101, timestamp: 2.4, shot_type: 'SMASH', confidence: 0.94, hitting_player_id: 1, court_x_m: 4.10, court_y_m: 11.80, is_user_corrected: false },
  { id: 102, timestamp: 5.4, shot_type: 'NET_SHOT', confidence: 0.91, hitting_player_id: 1, court_x_m: 1.20, court_y_m: 2.40, is_user_corrected: false },
];

export const TacticalCourtView: React.FC<TacticalCourtViewProps> = ({
  tracks = [],
  shots = [],
  courtType = 'SINGLES',
  currentTime,
  highlightPlayerId = 1
}) => {
  const [selectedShot, setSelectedShot] = useState<ShotEvent | null>(null);
  const [avatarMode, setAvatarMode] = useState<AvatarMode>('ATHLETE');
  const [isSimPlaying, setIsSimPlaying] = useState<boolean>(false);
  const [simTime, setSimTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());

  // Use actual tracks if provided, otherwise fallback to sample demo tracks
  const effectiveTracks = tracks.length > 0 ? tracks : SAMPLE_RALLY_TRACKS;
  const effectiveShots = shots.length > 0 ? shots : SAMPLE_SHOTS;

  // Max duration of tracks
  const maxTrackTime = useMemo(() => {
    if (effectiveTracks.length === 0) return 6.4;
    return Math.max(...effectiveTracks.map(t => t.timestamp), 6.4);
  }, [effectiveTracks]);

  // Current active time (either external prop or internal simulator)
  const activeTime = currentTime !== undefined ? currentTime : simTime;

  // Simulator playback loop
  useEffect(() => {
    if (!isSimPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTickRef.current = performance.now();
    const tick = (now: number) => {
      const deltaSec = ((now - lastTickRef.current) / 1000) * playbackSpeed;
      lastTickRef.current = now;

      setSimTime(prev => {
        const next = prev + deltaSec;
        return next > maxTrackTime ? 0 : next;
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSimPlaying, maxTrackTime, playbackSpeed]);

  // BWF Court dimensions in meters:
  // Length: 13.40m, Width: 5.18m (singles) or 6.10m (doubles)
  const courtW = courtType === 'SINGLES' ? 5.18 : 6.10;
  const courtL = 13.40;

  // ViewBox scale: 1 meter = 40 SVG units
  const scale = 40;
  const svgW = courtW * scale; // 207.2 or 244
  const svgL = courtL * scale; // 536

  const netY = 6.70 * scale;
  const shortServiceTopY = (6.70 - 1.98) * scale;
  const shortServiceBottomY = (6.70 + 1.98) * scale;
  const rearServiceTopY = 0.76 * scale;
  const rearServiceBottomY = (13.40 - 0.76) * scale;

  // Relevant tracks up to current active time
  const relevantTracks = effectiveTracks
    .filter(t => t.timestamp <= activeTime && (t.player_id === highlightPlayerId || effectiveTracks.length < 15))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Current active player coordinate
  const currentPos = relevantTracks.length > 0 ? relevantTracks[relevantTracks.length - 1] : effectiveTracks[0];

  // Previous position to calculate motion vector & angle
  const prevPos = relevantTracks.length >= 2 ? relevantTracks[relevantTracks.length - 2] : null;

  // Calculate movement heading angle in degrees (0 deg = pointing towards opponent net)
  const headingAngle = useMemo(() => {
    if (!prevPos || !currentPos) return 0;
    const dx = currentPos.court_x_m - prevPos.court_x_m;
    const dy = currentPos.court_y_m - prevPos.court_y_m;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.08) return 0; // Standing still, face net
    return Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  }, [currentPos, prevPos]);

  // Determine biomechanical stance based on position, speed, and proximity to shots
  const speed = currentPos ? (currentPos.speed_kmh ?? (currentPos as any).instant_speed_kmh ?? 0) : 0;
  const stance: AthleteStance = useMemo(() => {
    if (!currentPos) return 'READY';
    
    // Check if near a shot event
    const nearShot = effectiveShots.find(s => Math.abs(s.timestamp - activeTime) <= 0.4);
    if (nearShot) {
      if (nearShot.shot_type === 'SMASH' || nearShot.shot_type === 'CLEAR') return 'SMASH';
      if (nearShot.shot_type === 'NET_SHOT' || nearShot.shot_type === 'DROP' || nearShot.shot_type === 'LIFT') return 'LUNGE';
    }

    // Kinematic stance inference
    if (currentPos.court_y_m > 9.5 && speed > 11.0) return 'SMASH';
    if (currentPos.court_y_m < 4.2 && speed > 7.0) return 'LUNGE';
    if (speed > 8.5) return 'SPRINT';
    return 'READY';
  }, [currentPos, effectiveShots, activeTime, speed]);

  // Recent footstep trail (last 4 points)
  const recentFootsteps = relevantTracks.slice(-4, -1);

  // Full trajectory polyline points
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
    <div className="flex flex-col items-center justify-center p-3.5 sm:p-5 glass-panel bg-[#091129]/90 rounded-3xl border border-cyan-500/30 shadow-2xl w-full">
      {/* Top Header & Telemetry Mode Bar */}
      <div className="flex flex-wrap items-center justify-between w-full mb-3 px-1 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <CourtDimensionsIcon className="w-4 h-4 text-cyan-400" />
            Tactical BWF Virtual Motion Court
          </span>
        </div>

        {/* Avatar Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#05091a] p-1 rounded-xl border border-cyan-500/30">
          <button
            onClick={() => setAvatarMode('ATHLETE')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
              avatarMode === 'ATHLETE'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Full Virtual Motion Athlete Figure"
          >
            <User className="w-3 h-3" />
            <span>Athlete</span>
          </button>
          <button
            onClick={() => setAvatarMode('HOLOGRAM')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
              avatarMode === 'HOLOGRAM'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Kinetic Cyber Hologram"
          >
            <Zap className="w-3 h-3" />
            <span>Hologram</span>
          </button>
          <button
            onClick={() => setAvatarMode('DOT')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
              avatarMode === 'DOT'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Minimal Metric Point"
          >
            <Activity className="w-3 h-3" />
            <span>Dot</span>
          </button>
        </div>
      </div>

      {/* SVG Court Canvas with Dynamic Motion Athlete */}
      <div className="relative border-4 border-cyan-400/40 rounded-2xl p-2.5 bg-gradient-to-b from-[#091530] via-[#071126] to-[#040918] shadow-2xl w-full flex justify-center overflow-hidden">
        {/* Ambient Court Glow */}
        <div className="absolute inset-0 bg-radial-gradient from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

        <svg
          viewBox={`0 0 ${svgW} ${svgL}`}
          className="w-full max-w-[270px] sm:max-w-[320px] h-auto drop-shadow-2xl select-none"
          style={{ maxHeight: '540px' }}
        >
          <defs>
            {/* Athlete Glow Filters */}
            <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Smash Shockwave Radial Gradient */}
            <radialGradient id="smash-burst" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>

            {/* Athlete Jersey Gradient */}
            <linearGradient id="jersey-p1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Footstep Pulse Gradient */}
            <radialGradient id="footstep-pulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Court Surface */}
          <rect x="0" y="0" width={svgW} height={svgL} fill="#07122b" />

          {/* Court Outer Boundary Line */}
          <rect x="0" y="0" width={svgW} height={svgL} fill="none" stroke="#e2e8f0" strokeWidth="2.5" />

          {/* Singles Sidelines in Doubles Court */}
          {courtType === 'DOUBLES' && (
            <>
              <line x1={0.46 * scale} y1="0" x2={0.46 * scale} y2={svgL} stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.8" />
              <line x1={(6.10 - 0.46) * scale} y1="0" x2={(6.10 - 0.46) * scale} y2={svgL} stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.8" />
            </>
          )}

          {/* Center Longitudinal Line (Splitting Service Courts) */}
          <line
            x1={svgW / 2}
            y1="0"
            x2={svgW / 2}
            y2={shortServiceTopY}
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeOpacity="0.8"
          />
          <line
            x1={svgW / 2}
            y1={shortServiceBottomY}
            x2={svgW / 2}
            y2={svgL}
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeOpacity="0.8"
          />

          {/* Short Service Lines (1.98m from net) */}
          <line x1="0" y1={shortServiceTopY} x2={svgW} y2={shortServiceTopY} stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.85" />
          <line x1="0" y1={shortServiceBottomY} x2={svgW} y2={shortServiceBottomY} stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.85" />

          {/* Doubles Rear Long Service Lines (0.76m from baseline) */}
          {courtType === 'DOUBLES' && (
            <>
              <line x1="0" y1={rearServiceTopY} x2={svgW} y2={rearServiceTopY} stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.8" />
              <line x1="0" y1={rearServiceBottomY} x2={svgW} y2={rearServiceBottomY} stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.8" />
            </>
          )}

          {/* NET MESH & Yellow Top Cord */}
          <rect x="-8" y={netY - 3} width={svgW + 16} height="6" fill="#eab308" rx="1.5" />
          <line x1="-10" y1={netY} x2={svgW + 10} y2={netY} stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" />

          {/* Historical Footstep Anchor Rings */}
          {recentFootsteps.map((step, idx) => {
            const fx = Math.max(0, Math.min(courtW, step.court_x_m)) * scale;
            const fy = Math.max(0, Math.min(courtL, step.court_y_m)) * scale;
            const opacity = 0.2 + (idx * 0.15);
            return (
              <g key={`step-${idx}`} transform={`translate(${fx}, ${fy})`}>
                <ellipse rx="7" ry="4" fill="url(#footstep-pulse)" opacity={opacity} />
                <circle r="2.5" fill="#00f0ff" opacity={opacity} />
              </g>
            );
          })}

          {/* Player Movement Trajectory Path */}
          {polylinePoints && (
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
              className="drop-shadow"
            />
          )}

          {/* Shot Event Markers on Court */}
          {effectiveShots.map((s, idx) => {
            if (s.court_x_m === undefined || s.court_y_m === undefined) return null;
            const sx = Math.max(0, Math.min(courtW, s.court_x_m)) * scale;
            const sy = Math.max(0, Math.min(courtL, s.court_y_m)) * scale;
            const color = getShotColor(s.shot_type);
            const isHitNow = Math.abs(s.timestamp - activeTime) <= 0.4;

            return (
              <g
                key={idx}
                transform={`translate(${sx}, ${sy})`}
                onClick={() => setSelectedShot(s)}
                className="cursor-pointer group"
              >
                {/* Active Impact Burst Ripple */}
                {isHitNow && (
                  <circle r="18" fill="none" stroke={color} strokeWidth="2" opacity="0.9" className="animate-ping" />
                )}
                <circle r="8" fill={color} opacity="0.8" className={isHitNow ? 'animate-pulse' : ''} />
                <circle r="4.5" fill="#ffffff" />
                <text y="-10" textAnchor="middle" fill={color} fontSize="8" fontWeight="bold">
                  {s.shot_type}
                </text>
              </g>
            );
          })}

          {/* ======================================================== */}
          {/* DYNAMIC VIRTUAL MOTION BADMINTON ATHLETE AVATAR           */}
          {/* ======================================================== */}
          {currentPos && (
            <g
              transform={`translate(${Math.max(0, Math.min(courtW, currentPos.court_x_m)) * scale}, ${
                Math.max(0, Math.min(courtL, currentPos.court_y_m)) * scale
              })`}
              className="transition-transform duration-100 ease-out"
            >
              {/* Dynamic Aura Ring */}
              <circle
                r={stance === 'SMASH' ? 22 : 16}
                fill={stance === 'SMASH' ? 'url(#smash-burst)' : 'none'}
                stroke={stance === 'SMASH' ? '#ef4444' : '#00f0ff'}
                strokeWidth={stance === 'SMASH' ? '2.5' : '1.5'}
                opacity={stance === 'SMASH' ? '0.85' : '0.4'}
                className={stance === 'SMASH' ? 'animate-pulse' : ''}
              />

              {/* MODE 1: DETAILED VIRTUAL MOTION ATHLETE FIGURE */}
              {avatarMode === 'ATHLETE' && (
                <g transform={`rotate(${headingAngle})`}>
                  {/* Motion Shadow on Court Surface */}
                  <ellipse cx="0" cy="5" rx="14" ry="7" fill="#000000" opacity="0.55" />

                  {/* Athletic Feet / Shoes */}
                  <rect x="-8" y="2" width="5" height="10" rx="2.5" fill="#f8fafc" stroke="#00f0ff" strokeWidth="1" />
                  <rect x="3" y={stance === 'LUNGE' ? '6' : '2'} width="5" height="10" rx="2.5" fill="#f8fafc" stroke="#00f0ff" strokeWidth="1" />

                  {/* Athletic Torso / Team Jersey */}
                  <path
                    d="M -10 -4 L 10 -4 L 7 6 L -7 6 Z"
                    fill="url(#jersey-p1)"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />

                  {/* Player Arms & Racket Grip */}
                  {stance === 'SMASH' ? (
                    // Overhead Jump Smash Arm + Racket Arc
                    <g>
                      {/* Left Balance Arm */}
                      <line x1="-8" y1="-2" x2="-14" y2="2" stroke="#fed7aa" strokeWidth="3" strokeLinecap="round" />
                      {/* Right Smashing Arm extending back & up */}
                      <line x1="8" y1="-2" x2="16" y2="-12" stroke="#fed7aa" strokeWidth="3.2" strokeLinecap="round" />
                      {/* Badminton Racket Shaft & Head Overhead */}
                      <g transform="translate(16, -12) rotate(-45)">
                        <line x1="0" y1="0" x2="0" y2="-18" stroke="#cbd5e1" strokeWidth="1.8" />
                        <ellipse cx="0" cy="-24" rx="6" ry="8" fill="none" stroke="#ef4444" strokeWidth="2" filter="url(#neon-glow)" />
                        <line x1="-4" y1="-24" x2="4" y2="-24" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />
                        <line x1="0" y1="-30" x2="0" y2="-18" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />
                      </g>
                    </g>
                  ) : stance === 'LUNGE' ? (
                    // Deep Front-Court Lunge Arm + Forward Racket Reach
                    <g>
                      {/* Balanced Left Arm */}
                      <line x1="-8" y1="-1" x2="-14" y2="6" stroke="#fed7aa" strokeWidth="2.8" strokeLinecap="round" />
                      {/* Extended Right Arm reach forward to net */}
                      <line x1="8" y1="-2" x2="15" y2="-8" stroke="#fed7aa" strokeWidth="3" strokeLinecap="round" />
                      {/* Forward Racket Net Touch */}
                      <g transform="translate(15, -8) rotate(15)">
                        <line x1="0" y1="0" x2="0" y2="-16" stroke="#cbd5e1" strokeWidth="1.6" />
                        <ellipse cx="0" cy="-21" rx="5" ry="7" fill="none" stroke="#10b981" strokeWidth="1.8" />
                      </g>
                    </g>
                  ) : (
                    // Athletic Ready / Sprint Stance
                    <g>
                      {/* Left Ready Arm */}
                      <line x1="-8" y1="-2" x2="-13" y2="-5" stroke="#fed7aa" strokeWidth="2.8" strokeLinecap="round" />
                      {/* Right Arm Holding Racket at Ready */}
                      <line x1="8" y1="-2" x2="13" y2="-6" stroke="#fed7aa" strokeWidth="2.8" strokeLinecap="round" />
                      {/* Balanced Racket */}
                      <g transform="translate(13, -6) rotate(25)">
                        <line x1="0" y1="0" x2="0" y2="-14" stroke="#cbd5e1" strokeWidth="1.6" />
                        <ellipse cx="0" cy="-19" rx="5" ry="6.5" fill="none" stroke="#00f0ff" strokeWidth="1.6" />
                      </g>
                    </g>
                  )}

                  {/* Athlete Head with Sports Headband */}
                  <circle cx="0" cy="-8" r="6.5" fill="#fed7aa" stroke="#334155" strokeWidth="0.8" />
                  {/* Cyan Team Headband */}
                  <path d="M -6.5 -10 Q 0 -11 6.5 -10" stroke="#00f0ff" strokeWidth="2.2" fill="none" />
                </g>
              )}

              {/* MODE 2: KINETIC CYBER HOLOGRAM SILHOUETTE */}
              {avatarMode === 'HOLOGRAM' && (
                <g>
                  <circle r="14" fill="#00f0ff" opacity="0.2" className="animate-ping" />
                  <circle r="9" fill="#0891b2" stroke="#00f0ff" strokeWidth="2" filter="url(#neon-glow)" />
                  <path d="M -6 6 L 0 -8 L 6 6 Z" fill="#ffffff" opacity="0.9" />
                </g>
              )}

              {/* MODE 3: MINIMAL METRIC DOT */}
              {avatarMode === 'DOT' && (
                <g>
                  <circle r="12" fill="#00f0ff" opacity="0.3" className="animate-ping" />
                  <circle r="7" fill="#00f0ff" stroke="#ffffff" strokeWidth="2" />
                </g>
              )}

              {/* Floating Holographic Telemetry Pill Above Athlete */}
              <g transform="translate(0, -28)">
                <rect
                  x="-36"
                  y="-11"
                  width="72"
                  height="17"
                  rx="8.5"
                  fill="#030712"
                  fillOpacity="0.92"
                  stroke={stance === 'SMASH' ? '#ef4444' : '#00f0ff'}
                  strokeWidth="1.2"
                  filter="url(#neon-glow)"
                />
                <text
                  x="0"
                  y="1"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="black"
                  letterSpacing="0.3"
                >
                  {stance === 'SMASH'
                    ? `⚡ ${speed.toFixed(1)} km/h • SMASH`
                    : stance === 'LUNGE'
                    ? `🏸 ${speed.toFixed(1)} km/h • LUNGE`
                    : stance === 'SPRINT'
                    ? `🏃 ${speed.toFixed(1)} km/h • SPRINT`
                    : `🛡️ ${speed.toFixed(1)} km/h • READY`}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Virtual Motion Interactive Playback Controller */}
      <div className="w-full mt-3 p-3 rounded-2xl bg-[#05091a] border border-cyan-500/25 flex flex-col gap-2 shadow-lg">
        {/* Playback Scrub Slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={maxTrackTime}
            step="0.1"
            value={activeTime}
            onChange={(e) => {
              setIsSimPlaying(false);
              setSimTime(parseFloat(e.target.value));
            }}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Playback Control Actions */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimPlaying(!isSimPlaying)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/25"
            >
              {isSimPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isSimPlaying ? 'Pause Motion' : 'Play Motion'}</span>
            </button>

            <button
              onClick={() => {
                setIsSimPlaying(false);
                setSimTime(0);
              }}
              title="Reset to 0s"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-cyan-300 text-[11px] font-bold ml-1">
              {activeTime.toFixed(1)}s / {maxTrackTime.toFixed(1)}s
            </span>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1">
            {[0.5, 1.0, 1.5, 2.0].map(s => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                  playbackSpeed === s ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Shot Callout */}
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
