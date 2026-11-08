import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Zap,
  Target,
  BarChart2,
  Video,
  Smartphone,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  Award,
  Activity,
  Eye
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  ShuttlecockIcon,
  BadmintonRacketIcon,
  CourtDimensionsIcon,
  SmashRadarIcon,
  CrossedRacketsLogoIcon,
  LiftIcon,
  ShuttlecockSpinIcon
} from '../components/icons/BadmintonIcons';
import { BadmintonGestureCards } from '../components/badminton/BadmintonGestureCards';
import posterImg from '../assets/badminton-match-poster.jpg';

export const LandingPage: React.FC = () => {
  // Interactive Court Shot Simulator State
  const [activeShot, setActiveShot] = useState<'SMASH' | 'CLEAR' | 'DROP' | 'DRIVE'>('SMASH');

  const shotDemos = {
    SMASH: {
      name: 'Jump Smash',
      speed: '386 km/h',
      zone: 'Deep Rear-Right to Front-Left Line',
      tactics: 'Steep downward angle piercing opponent backhand corner at maximum velocity.',
      color: '#ff1744',
      path: 'M 190 70 L 60 410',
      contactPt: { x: 190, y: 70 },
      landingPt: { x: 60, y: 410 },
      inCall: 'IN (9.2cm inside singles line)'
    },
    CLEAR: {
      name: 'Attacking Overhead Clear',
      speed: '148 km/h',
      zone: 'Rear-Left to Baseline Tramline',
      tactics: 'High offensive trajectory forcing opponent past back baseline to reset court positioning.',
      color: '#00f0ff',
      path: 'M 80 80 Q 130 250 180 480',
      contactPt: { x: 80, y: 80 },
      landingPt: { x: 180, y: 480 },
      inCall: 'IN (Right on baseline tape)'
    },
    DROP: {
      name: 'Spinning Net Drop',
      speed: '58 km/h',
      zone: 'Mid-Court to Front Service Line',
      tactics: 'Deceleration slice skimming 3cm above the net tape into front service box.',
      color: '#facc15',
      path: 'M 160 120 Q 140 230 110 275',
      contactPt: { x: 160, y: 120 },
      landingPt: { x: 110, y: 275 },
      inCall: 'IN (Front service box winner)'
    },
    DRIVE: {
      name: 'Flat Mid-Court Drive',
      speed: '182 km/h',
      zone: 'Sideline to Opposite Mid Tramline',
      tactics: 'Horizontal shuttle trajectory designed to counter fast exchanges and induce weak lifts.',
      color: '#a855f7',
      path: 'M 50 250 L 210 260',
      contactPt: { x: 50, y: 250 },
      landingPt: { x: 210, y: 260 },
      inCall: 'IN (Sharp sideline punch)'
    }
  };

  const currentShot = shotDemos[activeShot];

  return (
    <div className="flex flex-col gap-16 sm:gap-24 pb-12">
      {/* Cinematic Hero Section with Two Badminton Players Background Poster & Mesmerizing Cyan-Indigo Shading */}
      <section className="relative rounded-3xl overflow-hidden badminton-hero-bg border border-cyan-500/30 shadow-2xl p-6 sm:p-14 lg:p-20 text-center flex flex-col items-center max-w-6xl mx-auto w-full">
        {/* Mesmerizing Stadium Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] h-[350px] bg-cyan-500/15 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-1/4 right-1/4 w-[280px] h-[280px] bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto">
          {/* Tournament Pill Header with Crossed Rackets Emblem */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-black mb-6 uppercase tracking-widest shadow-xl backdrop-blur-xl">
            <CrossedRacketsLogoIcon className="w-5 h-5" glow={false} />
            <span>Official BWF Court Standard • Optical Tracking & Telemetry</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-0.5 shadow-sm shadow-cyan-400" />
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.06] drop-shadow-2xl">
            Turn Any Match Video Into <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300">
              Pro Court Precision
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-lg text-slate-200 max-w-2xl leading-relaxed drop-shadow">
            Experience computer-vision intelligence built purely for badminton. Prop your phone near the court or upload any match recording. RallyVision Pro tracks footwork speed, detects smashes up to 400+ km/h, classifies drop vs clear strokes, and generates tactical insights.
          </p>

          {/* Hero CTAs with Mesmerizing Cyan-Indigo Styling */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 w-full">
            <Link to="/register">
              <Button size="lg" icon={ArrowRight} className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all">
                Analyze My Match Free
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/15 backdrop-blur-xl hover:scale-105 active:scale-95 transition-all">
                Sign In to Player Dashboard
              </Button>
            </Link>
          </div>

          {/* Live Badminton Telemetry Metric Strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-3xl border border-cyan-500/25 bg-[#081026]/85 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-2xl">
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#05091a]/80 border border-cyan-500/20 smooth-card">
              <div className="flex items-center gap-1.5 text-2xl font-black text-cyan-300">
                <CourtDimensionsIcon className="w-5 h-5 text-cyan-400" />
                <span>13.4m</span>
              </div>
              <div className="text-[11px] text-slate-300 font-bold tracking-wide mt-0.5">BWF Calibrated Matrix</div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#05091a]/80 border border-rose-500/20 smooth-card">
              <div className="flex items-center gap-1.5 text-2xl font-black text-rose-400">
                <SmashRadarIcon className="w-5 h-5 text-rose-400" />
                <span>420 km/h</span>
              </div>
              <div className="text-[11px] text-slate-300 font-bold tracking-wide mt-0.5">Smash Velocity Radar</div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#05091a]/80 border border-amber-500/20 smooth-card">
              <div className="flex items-center gap-1.5 text-2xl font-black text-amber-300">
                <ShuttlecockIcon className="w-5 h-5 text-amber-300" />
                <span>7 Strokes</span>
              </div>
              <div className="text-[11px] text-slate-300 font-bold tracking-wide mt-0.5">Kinematic Stroke Classifier</div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#05091a]/80 border border-indigo-500/20 smooth-card">
              <div className="flex items-center gap-1.5 text-2xl font-black text-indigo-300">
                <CrossedRacketsLogoIcon className="w-5 h-5" glow={false} />
                <span>6 Zones</span>
              </div>
              <div className="text-[11px] text-slate-300 font-bold tracking-wide mt-0.5">Tactical Court Coverage</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Badminton Match Poster Action Showcase */}
      <section className="max-w-6xl mx-auto px-4 w-full">
        <div className="relative rounded-3xl overflow-hidden border-2 border-cyan-500/35 shadow-2xl bg-[#060a1a] group smooth-card">
          <div className="relative aspect-[21/9] sm:aspect-[16/7] w-full overflow-hidden">
            <img
              src={posterImg}
              alt="Two players playing badminton in tournament rally"
              className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
            />
            {/* Elegant gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-[#060913]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#060913]/85 via-transparent to-[#060913]/85" />

            {/* Poster Floating Telemetry Badges */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                MATCH POINT LIVE RALLY
              </span>
              <span className="px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-rose-500/40 text-rose-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg">
                <SmashRadarIcon className="w-3.5 h-3.5" />
                JUMP SMASH: 386 KM/H
              </span>
            </div>

            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 right-4 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-xl">
                <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow">
                  Two Players. One Court. Complete Tactical Insight.
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 mt-1 line-clamp-2">
                  From deep baseline smashes to net-kill dives, every movement vector is projected through 4-point homography into real-world meters.
                </p>
              </div>

              <Link to="/upload" className="shrink-0">
                <Button size="sm" icon={Play} className="shadow-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black">
                  Record Court Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Badminton Multi-Theme Gesture Mini-Posters Section */}
      <section className="max-w-6xl mx-auto px-4 w-full">
        <BadmintonGestureCards />
      </section>

      {/* Interactive Court Simulator Hero Banner */}
      <section className="max-w-6xl mx-auto px-4 w-full">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#09132e] via-[#070e24] to-[#040816] border-2 border-cyan-500/35 p-6 sm:p-10 shadow-2xl overflow-hidden smooth-card">
          {/* Subtle string pattern watermark */}
          <div className="absolute inset-0 badminton-string-pattern opacity-40 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Control Panel */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider w-fit border border-cyan-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive Flight Telemetry</span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Simulate Live Badminton Shots
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Click any stroke to preview how RallyVision Pro projects trajectory arcs, registers smash speeds, and verifies court line boundaries.
                </p>
              </div>

              {/* Shot Selection Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                {(['SMASH', 'CLEAR', 'DROP', 'DRIVE'] as const).map((shot) => {
                  const isSelected = activeShot === shot;
                  return (
                    <button
                      key={shot}
                      onClick={() => setActiveShot(shot)}
                      className={`px-3.5 py-3 rounded-2xl text-left border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 border-cyan-400 text-white shadow-xl shadow-cyan-950/60 font-black scale-102'
                          : 'bg-[#05091a]/80 border-slate-800 text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-400/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase">{shot}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                      </div>
                      <div className="text-[11px] font-mono text-cyan-300 mt-0.5 font-bold">
                        {shotDemos[shot].speed}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Shot Telemetry Card */}
              <div className="p-4 rounded-2xl bg-[#05091a]/90 border border-cyan-500/30 flex flex-col gap-2 shadow-lg">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                  <span>{currentShot.name}</span>
                  <span className="font-mono text-cyan-400 font-extrabold">{currentShot.speed}</span>
                </div>
                <div className="text-[11px] text-slate-300 font-medium">{currentShot.tactics}</div>
                <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[11px] font-mono text-cyan-400">
                  <span>LINE CALL:</span>
                  <span className="font-extrabold text-white bg-cyan-500/25 px-2 py-0.5 rounded border border-cyan-400/40">
                    {currentShot.inCall}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Interactive 2D Badminton Court */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center">
              <div className="relative border-4 border-white rounded-2xl p-3 bg-[#081534] shadow-2xl court-mat-texture w-full max-w-[340px] sm:max-w-[400px]">
                {/* Court SVG */}
                <svg viewBox="0 0 260 540" className="w-full h-auto drop-shadow-xl">
                  {/* Outer Court Boundary */}
                  <rect x="10" y="10" width="240" height="520" fill="none" stroke="#ffffff" strokeWidth="3" />
                  
                  {/* Singles Sidelines */}
                  <line x1="28" y1="10" x2="28" y2="530" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.9" />
                  <line x1="232" y1="10" x2="232" y2="530" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.9" />

                  {/* Doubles Long Service Lines */}
                  <line x1="10" y1="40" x2="250" y2="40" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.9" />
                  <line x1="10" y1="500" x2="250" y2="500" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.9" />

                  {/* Short Service Lines */}
                  <line x1="10" y1="190" x2="250" y2="190" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.9" />
                  <line x1="10" y1="350" x2="250" y2="350" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.9" />

                  {/* Center Line */}
                  <line x1="130" y1="10" x2="130" y2="190" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.9" />
                  <line x1="130" y1="350" x2="130" y2="530" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.9" />

                  {/* Net Barrier */}
                  <line x1="2" y1="270" x2="258" y2="270" stroke="#00f0ff" strokeWidth="3.5" strokeDasharray="3 3" />
                  <text x="130" y="266" textAnchor="middle" fill="#00f0ff" fontSize="9" fontWeight="bold" letterSpacing="1.5">
                    CENTER NET LINE (1.55m)
                  </text>

                  {/* Active Trajectory Path Arc */}
                  <path
                    d={currentShot.path}
                    fill="none"
                    stroke={currentShot.color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray="6 4"
                    className="drop-shadow"
                  />

                  {/* Contact Origin Point */}
                  <circle cx={currentShot.contactPt.x} cy={currentShot.contactPt.y} r="7" fill={currentShot.color} className="animate-ping" opacity="0.75" />
                  <circle cx={currentShot.contactPt.x} cy={currentShot.contactPt.y} r="5" fill="#ffffff" stroke={currentShot.color} strokeWidth="2" />
                  <text x={currentShot.contactPt.x + 10} y={currentShot.contactPt.y + 4} fill="#ffffff" fontSize="10" fontWeight="black">
                    HIT
                  </text>

                  {/* Landing Target Point */}
                  <circle cx={currentShot.landingPt.x} cy={currentShot.landingPt.y} r="8" fill={currentShot.color} opacity="0.9" />
                  <circle cx={currentShot.landingPt.x} cy={currentShot.landingPt.y} r="3" fill="#ffffff" />
                  <text x={currentShot.landingPt.x + 10} y={currentShot.landingPt.y + 4} fill={currentShot.color} fontSize="10" fontWeight="black">
                    LAND
                  </text>
                </svg>

                {/* Court Dimension Footnote */}
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-cyan-300 font-semibold px-1">
                  <span>BWF STANDARD: 13.4m × 6.1m</span>
                  <span>COURT SURFACE: MIDNIGHT TOURNAMENT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Badminton Features Grid */}
      <section className="max-w-6xl mx-auto px-4 w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2 border border-cyan-400/30">
            <Award className="w-3.5 h-3.5" />
            <span>Badminton Science & Coaching</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Engineered for Modern Badminton
          </h2>
          <p className="mt-2 text-sm text-slate-300 max-w-lg mx-auto">
            Not decorative stats — genuine computer-vision spatial models calibrated against real-world badminton courts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#09132e] to-[#05091a] border border-cyan-500/25 hover:border-cyan-400 transition-all shadow-xl smooth-card">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-4 border border-cyan-400/30">
              <CourtDimensionsIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Perspective Homography</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Standard broadcast and smartphone camera angles distort distance. Our 4-point homography projects pixels into genuine metric meters and velocities.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#09132e] to-[#05091a] border border-cyan-500/25 hover:border-cyan-400 transition-all shadow-xl smooth-card">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-4 border border-indigo-400/30">
              <LiftIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Footwork & Base Recovery</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Calculates recovery to the central T-junction after every lunge, sprint bursts, and time spent across front, mid, and rear court zones.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#09132e] to-[#05091a] border border-cyan-500/25 hover:border-cyan-400 transition-all shadow-xl smooth-card">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center mb-4 border border-rose-400/30">
              <SmashRadarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Smash Radar Velocity</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Estimated shuttlecock exit velocity across smashes, clears, and drives with clear confidence labeling to maintain scientific sports integrity.
            </p>
          </div>
        </div>
      </section>

      {/* Ready to Play CTA */}
      <section className="max-w-4xl mx-auto px-4 w-full text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-[#08122a] to-[#0c1a40] border-2 border-cyan-500/35 shadow-2xl flex flex-col items-center smooth-card relative overflow-hidden">
          <div className="absolute top-2 right-4 pointer-events-none opacity-10">
            <CrossedRacketsLogoIcon size={180} glow={false} />
          </div>

          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-4 border border-cyan-400/40">
            <BadmintonRacketIcon size={32} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Elevate Your Badminton Game Today
          </h2>
          <p className="mt-3 text-sm text-slate-300 max-w-xl">
            Join badminton enthusiasts, academy coaches, and club players using computer vision to unlock their full potential.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/register">
              <Button size="lg" icon={ArrowRight} className="bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-black shadow-xl">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
