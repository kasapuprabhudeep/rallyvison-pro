import React, { useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import {
  SmashRadarIcon,
  ShuttlecockIcon,
  CrossedRacketsLogoIcon,
  LiftIcon,
  ShuttlecockSpinIcon
} from '../icons/BadmintonIcons';
import smashActionImg from '../../assets/badminton-smash-action.jpg';
import defenseLiftImg from '../../assets/badminton-defense-lift.jpg';
import shuttleMacroImg from '../../assets/badminton-shuttle-macro.jpg';
import doublesClashImg from '../../assets/badminton-doubles-clash.jpg';

interface GesturePoster {
  id: string;
  title: string;
  subtitle: string;
  category: 'LIFT THEME' | 'SHUTTLE THEME' | 'RACKETS LOGO THEME' | 'SMASH THEME';
  speed: string;
  gestureName: string;
  gestureIconNode: React.ReactNode;
  gestureSteps: string[];
  image: string;
  color: string;
  accentBadge: string;
  tacticalTip: string;
  stats: { label: string; value: string }[];
}

export const BadmintonGestureCards: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [selectedPosterId, setSelectedPosterId] = useState<string>('lift');

  const gesturePosters: GesturePoster[] = [
    {
      id: 'lift',
      title: 'High Defensive Lift',
      subtitle: 'Underhand Sky-High Reset Arc',
      category: 'LIFT THEME',
      speed: '142 km/h',
      gestureName: 'Deep Lunge & Forearm Wrist Flick',
      gestureIconNode: <LiftIcon className="w-5 h-5 text-cyan-400" />,
      gestureSteps: [
        '1. Step deep into forecourt with lunging foot pointing to net corner',
        '2. Cock wrist backward with racket head below the tumbling shuttlecock',
        '3. Explosive upward snap of wrist and forearm right before net tape',
        '4. Send shuttlecock into an 8.5m high parabolic lob to rear doubles line'
      ],
      image: defenseLiftImg,
      color: '#00f0ff',
      accentBadge: 'AERIAL RESET LIFT',
      tacticalTip: 'A high defensive lift peaking above 8 meters grants you 1.8 seconds of recovery time to reclaim the central T-mark.',
      stats: [
        { label: 'Lob Apex Height', value: '8.4 m' },
        { label: 'Air Hang Time', value: '1.82 sec' },
        { label: 'Depth to Baseline', value: '13.1 m' }
      ]
    },
    {
      id: 'shuttle',
      title: 'Feather Shuttlecock Spin',
      subtitle: 'Tumbling 16-Feather Hairpin Touch',
      category: 'SHUTTLE THEME',
      speed: '48 km/h',
      gestureName: 'Aerodynamic Cork Slice & Hairpin Roll',
      gestureIconNode: <ShuttlecockSpinIcon className="w-5 h-5 text-amber-300" />,
      gestureSteps: [
        '1. Meet shuttlecock at the tape apex with relaxed loose fingers',
        '2. Slice racket strings horizontally across the natural cork base',
        '3. Induce high-frequency 420 RPM rotational tumble across the 16 goose feathers',
        '4. Shuttle rolls directly over white net cord with zero bounce response'
      ],
      image: shuttleMacroImg,
      color: '#fbbf24',
      accentBadge: '16-FEATHER SPIN DYNAMICS',
      tacticalTip: 'Slicing across the cork base tumbles the feather skirt unpredictably, making net-kill counters nearly impossible for the opponent.',
      stats: [
        { label: 'Spin Frequency', value: '420 RPM' },
        { label: 'Net Tape Gap', value: '2.1 cm' },
        { label: 'Feather Balance', value: '16 Plumes' }
      ]
    },
    {
      id: 'rackets_cross',
      title: 'Crossed Rackets Championship Clash',
      subtitle: 'Dual-Racket Flat Laser Drive & Wall',
      category: 'RACKETS LOGO THEME',
      speed: '218 km/h',
      gestureName: 'Crossed Rackets Compact Push & Angle Block',
      gestureIconNode: <CrossedRacketsLogoIcon className="w-5 h-5" glow={false} />,
      gestureSteps: [
        '1. Ready position with racket head perpetually held high above wrist',
        '2. Short, explosive 10cm forward punch without taking full backswing',
        '3. Intercept opponent smash in the mid-court tramline intersection',
        '4. Flat laser return skimming 5cm above net directly into body gap'
      ],
      image: doublesClashImg,
      color: '#a855f7',
      accentBadge: 'CROSSED RACKETS CLASH',
      tacticalTip: 'Keeping racket head high and utilizing compact forearm recoil allows lightning-fast counter-attacks during 200+ km/h mid-court rallies.',
      stats: [
        { label: 'Drive Speed', value: '218 km/h' },
        { label: 'Reaction Window', value: '0.19 sec' },
        { label: 'Mid-Court Push', value: 'Flat Trajectory' }
      ]
    },
    {
      id: 'smash',
      title: 'Explosive Jump Smash',
      subtitle: 'Apex Scissor-Kick Terminal Spike',
      category: 'SMASH THEME',
      speed: '386 km/h',
      gestureName: 'Scissor Kick & Internal Forearm Pronation',
      gestureIconNode: <SmashRadarIcon className="w-5 h-5 text-rose-400" />,
      gestureSteps: [
        '1. Quick chassé backpedal into deep rear court with body arched',
        '2. Explosive vertical jump off non-dominant leg into full scissor kick',
        '3. Cock racket behind spine; unleash rapid internal forearm pronation',
        '4. Steep downward angle follow-through into central court recovery'
      ],
      image: smashActionImg,
      color: '#f43f5e',
      accentBadge: 'TERMINAL SMASH ATTACK',
      tacticalTip: 'Jump smash contact point reaches 3.1m above ground, shortening the shuttlecock flight duration to under 0.22 seconds.',
      stats: [
        { label: 'Exit Velocity', value: '386 km/h' },
        { label: 'Apex Height', value: '3.12 m' },
        { label: 'Downward Angle', value: '28.4°' }
      ]
    }
  ];

  const activePoster = gesturePosters.find(p => p.id === selectedPosterId) || gesturePosters[0];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-black uppercase tracking-wider mb-2 shadow-sm">
            <CrossedRacketsLogoIcon className="w-4 h-4" glow={false} />
            <span>Badminton Multi-Theme Action Gestures</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Tactical Technique Mini-Posters
            </h2>
            <span className="w-fit text-[10px] sm:text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold tracking-wider">
              LIFT • SHUTTLE • CROSSED RACKETS • SMASH
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            Explore dedicated Lift, Shuttlecock Spin, Crossed Rackets, and Smash gesture mechanics with live telemetry.
          </p>
        </div>
      </div>

      {/* Grid of 4 Distinct Theme Mini-Posters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {gesturePosters.map((poster) => {
          const isSelected = selectedPosterId === poster.id;
          return (
            <div
              key={poster.id}
              onClick={() => setSelectedPosterId(poster.id)}
              className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-2 group flex flex-col justify-between ${
                isSelected
                  ? 'border-cyan-400 shadow-2xl shadow-cyan-500/25 -translate-y-1.5 ring-2 ring-cyan-400/40'
                  : 'border-slate-800/80 hover:border-cyan-400/50 hover:-translate-y-1 hover:shadow-xl'
              }`}
              style={{ minHeight: compact ? '260px' : '310px' }}
            >
              {/* Poster Image Background with Gradient Glass Overlay */}
              <div className="absolute inset-0 z-0">
                <img
                  src={poster.image}
                  alt={poster.title}
                  className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070c1e] via-[#070c1e]/50 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#070c1e]/70 via-transparent to-[#070c1e]/90 pointer-events-none" />
              </div>

              {/* Top Action Badge */}
              <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between">
                <span
                  className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider backdrop-blur-md border shadow"
                  style={{
                    backgroundColor: `${poster.color}25`,
                    color: poster.color,
                    borderColor: `${poster.color}50`
                  }}
                >
                  {poster.category}
                </span>

                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md backdrop-blur-md border"
                  style={{
                    backgroundColor: `${poster.color}30`,
                    borderColor: `${poster.color}60`
                  }}
                >
                  {poster.gestureIconNode}
                </div>
              </div>

              {/* Bottom Telemetry & Title */}
              <div className="relative z-10 p-4 sm:p-5 pt-8 flex flex-col gap-1.5 mt-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-black text-cyan-300">
                    {poster.speed}
                  </span>
                  <span className="text-[10px] text-slate-300 font-semibold flex items-center gap-0.5 group-hover:text-white transition-colors">
                    <span>Gesture Specs</span>
                    <ChevronRight className="w-3 h-3 text-cyan-400" />
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug group-hover:text-cyan-300 transition-colors">
                  {poster.title}
                </h3>

                <p className="text-[11px] text-slate-300 line-clamp-1 font-medium">
                  {poster.gestureName}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Interactive Gesture Detail Showcase */}
      <div className="relative rounded-3xl bg-[#091129]/90 border-2 border-cyan-500/30 p-5 sm:p-7 shadow-2xl backdrop-blur-2xl transition-all">
        {/* Subtle Crossed Rackets background watermark inside detail card */}
        <div className="absolute top-4 right-4 pointer-events-none opacity-10">
          <CrossedRacketsLogoIcon size={120} glow={false} />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Gesture Mechanics Breakdown */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider border shadow-sm"
                style={{
                  backgroundColor: `${activePoster.color}20`,
                  color: activePoster.color,
                  borderColor: `${activePoster.color}40`
                }}
              >
                {activePoster.accentBadge}
              </span>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-400/25 font-bold">
                SPEED: {activePoster.speed}
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{activePoster.title}</span>
                <span className="w-6 h-6 flex items-center justify-center">{activePoster.gestureIconNode}</span>
              </h3>
              <p className="text-xs sm:text-sm text-cyan-200/90 font-medium mt-0.5">
                Mechanic: <strong>{activePoster.gestureName}</strong>
              </p>
            </div>

            {/* Gesture Step-by-Step Flow */}
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-[#05091a] border border-cyan-500/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Kinetic Stroke & Trajectory Progression:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {activePoster.gestureSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-start gap-2 leading-snug"
                  >
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 border border-cyan-500/30">
                      {idx + 1}
                    </span>
                    <span>{step.slice(3)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Coaching Tip */}
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center gap-2.5 text-xs text-cyan-100">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span><strong>Coach Tip:</strong> {activePoster.tacticalTip}</span>
            </div>
          </div>

          {/* Right: Telemetry KPI Radar Pod */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2.5">
              {activePoster.stats.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#05091a] border border-cyan-500/25 text-center flex flex-col justify-center shadow-lg"
                >
                  <span className="text-sm sm:text-base font-black text-white tracking-tight">
                    {s.value}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Mini Action Visual Preview */}
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-xl group">
              <img
                src={activePoster.image}
                alt={activePoster.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05091a] via-transparent to-transparent" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-cyan-300 font-bold">
                <span>BWF TRAJECTORY CALIBRATION</span>
                <span className="flex items-center gap-1 text-white">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  OPTICALLY VERIFIED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
