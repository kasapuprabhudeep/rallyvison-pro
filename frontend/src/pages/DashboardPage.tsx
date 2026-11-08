import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Zap,
  Flame,
  Plus,
  PlayCircle,
  Camera,
  Footprints,
  Sparkles,
  AlertCircle,
  Target,
  Award,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { DashboardSummary } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LiveMatchRecorder } from '../components/video/LiveMatchRecorder';
import {
  ShuttlecockIcon,
  BadmintonRacketIcon,
  CrossedRacketsLogoIcon,
  CourtDimensionsIcon,
  SmashRadarIcon
} from '../components/icons/BadmintonIcons';
import { BadmintonThemeSelector } from '../components/ui/BadmintonThemeSelector';
import { BadmintonGestureCards } from '../components/badminton/BadmintonGestureCards';
import posterImg from '../assets/badminton-match-poster.jpg';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <span className="text-xs text-cyan-300 font-bold uppercase tracking-wider">
          Connecting to BWF Court Telemetry...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={fetchSummary} className="ml-auto">
          Retry
        </Button>
      </div>
    );
  }

  const hasMatches = summary && summary.recent_matches.length > 0;

  // Approximate totals for badminton athletic fitness
  const totalCalories = summary
    ? Math.round(summary.total_movement_distance_m * 0.065 + (summary.total_playing_time_sec / 3600) * 450)
    : 0;
  const totalSteps = summary ? Math.round(summary.total_movement_distance_m / 0.72) : 0;

  // Get latest match for hero highlight
  const latestMatch = summary?.recent_matches?.[0];
  const playerArchetype = latestMatch?.analytics?.player_archetype || 'All-Round Dynamo 🏸';
  const matchEnergyScore = latestMatch?.analytics?.match_energy_score || 85;

  return (
    <div className="flex flex-col gap-8">
      {/* Top Bar with Badminton Arena Branding & Theme Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-panel bg-[#091129]/80 border-cyan-500/25 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 flex items-center justify-center">
            <CrossedRacketsLogoIcon size={24} glow={false} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              Tournament Match Center
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                LIVE TELEMETRY
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              International BWF 13.4m court perspective homography & shot classifier
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <BadmintonThemeSelector />
        </div>
      </div>

      {/* Badminton Match Day Hero Locker Card with Dynamic Stadium Poster Background */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl smooth-card glass-panel" style={{
        backgroundImage: `linear-gradient(to right, rgba(6, 9, 19, 0.94) 0%, rgba(9, 17, 41, 0.88) 50%, rgba(13, 24, 57, 0.82) 100%), url(${posterImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%'
      }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute inset-0 badminton-string-pattern opacity-30 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/35 text-cyan-300 text-xs font-black uppercase tracking-wider mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Current Player Profile • {playerArchetype}</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Court Performance Intelligence
            </h1>
            
            <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
              Prop your smartphone near the net or baseline. RallyVision Pro measures your footwork distance in real-world meters, logs smash speeds up to 400+ km/h, classifies drop vs clear strokes, and segments every rally.
            </p>

            {/* Micro Badge Row */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-200">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#070d22]/80 border border-cyan-500/25 font-mono">
                <CourtDimensionsIcon className="w-3.5 h-3.5 text-cyan-400" />
                13.4m × 6.1m Matrix
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#070d22]/80 border border-cyan-500/25 font-mono">
                <SmashRadarIcon className="w-3.5 h-3.5 text-rose-400" />
                Smash Radar Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#070d22]/80 border border-cyan-500/25 font-mono">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Intensity: {matchEnergyScore}/100
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => setShowRecorder(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm shadow-xl shadow-red-600/35 transition-all active:scale-95"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <Camera className="w-4 h-4" />
              <span>Record Live Court</span>
            </button>

            <Link to="/upload" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" icon={Plus} className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20">
                Upload Match Video
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {!hasMatches ? (
        <EmptyState
          title="No Match Recordings Yet"
          description="Prop your phone by the court or upload a match recording to see your genuine footwork distance, smash speeds, calories, and shot accuracy."
          actionLabel="Record Live Match with Camera"
          onAction={() => setShowRecorder(true)}
        />
      ) : (
        <>
          {/* Badminton Fitness & Telemetry Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Court Distance"
              value={`${summary.total_movement_distance_m.toFixed(0)}m`}
              subtitle={`~${totalSteps} explosive court steps`}
              icon={Footprints}
              color="lime"
            />
            <StatCard
              title="Calories Burned"
              value={`~${totalCalories} kcal`}
              subtitle="Energy spent on court rallies"
              icon={Flame}
              color="rose"
            />
            <StatCard
              title="Active Court Time"
              value={`${(summary.total_playing_time_sec / 60).toFixed(1)} mins`}
              subtitle={`${summary.total_matches_analyzed} match sessions recorded`}
              icon={Clock}
              color="cyan"
            />
            <StatCard
              title="Average Speed"
              value={`${summary.avg_movement_speed_kmh.toFixed(1)} km/h`}
              subtitle={`${summary.total_detected_shots} total strokes analyzed`}
              icon={Zap}
              color="amber"
            />
          </div>

          {/* Performance Trends Chart with Badminton Styling */}
          {summary.performance_trends.length > 0 && (
            <div className="glass-panel bg-[#091129]/80 border-cyan-500/25 rounded-3xl p-5 sm:p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-cyan-400" />
                    Footwork & Stamina Progression
                  </h3>
                  <p className="text-xs text-slate-300">
                    Distance covered in meters and court sprint velocities across your matches
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm" />
                    Distance (m)
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-sm" />
                    Speed (km/h)
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.performance_trends}>
                    <defs>
                      <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#172554" />
                    <XAxis dataKey="title" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#070d22', borderColor: '#00f0ff', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="distance_m"
                      name="Distance (m)"
                      stroke="#00f0ff"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#distGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="avg_speed_kmh"
                      name="Avg Speed (km/h)"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#speedGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent Matches Section with Badminton Court Cards */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <CrossedRacketsLogoIcon className="w-5 h-5" glow={false} />
                Match History & Tactical Reports
              </h3>
              <Link to="/history" className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1">
                <span>View Full Match Archive</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.recent_matches.map((m) => (
                <div
                  key={m.id}
                  className="glass-panel bg-[#091129]/80 border border-cyan-500/25 hover:border-cyan-400/50 rounded-2xl overflow-hidden transition-all flex flex-col justify-between shadow-xl group"
                >
                  {/* Thumbnail / Video Banner */}
                  <div className="relative aspect-video bg-[#05091a] flex items-center justify-center overflow-hidden">
                    {m.video?.thumbnail_path ? (
                      <img
                        src={m.video.thumbnail_path}
                        alt={m.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-cyan-500/40">
                        <CrossedRacketsLogoIcon className="w-12 h-12" glow={false} />
                        <span className="text-[10px] mt-1 font-mono uppercase text-cyan-400/60">
                          Badminton Replay
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2.5 right-2.5">
                      <Badge
                        variant={
                          m.status === 'COMPLETED'
                            ? 'lime'
                            : m.status === 'PROCESSING'
                            ? 'cyan'
                            : m.status === 'FAILED'
                            ? 'rose'
                            : 'slate'
                        }
                        size="sm"
                      >
                        {m.status}
                      </Badge>
                    </div>

                    <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-[10px] text-cyan-300 font-mono font-bold border border-cyan-500/20">
                      {m.match_type}
                    </div>
                  </div>

                  {/* Match Details Body */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-cyan-300 transition-colors">
                          {m.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {m.opponent_name ? `vs. ${m.opponent_name}` : 'Casual Court Play'} • {m.created_at.slice(0, 10)}
                      </p>
                    </div>

                    {m.analytics && (
                      <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-cyan-500/20 text-center bg-[#060c20]/60 rounded-xl px-1">
                        <div>
                          <div className="text-xs font-black text-cyan-400">
                            {m.analytics.total_movement_distance_m.toFixed(0)}m
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">Distance</div>
                        </div>
                        <div>
                          <div className="text-xs font-black text-rose-400">
                            ~{m.analytics.estimated_calories_burned || Math.round(m.analytics.total_movement_distance_m * 0.065)} kcal
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">Calories</div>
                        </div>
                        <div>
                          <div className="text-xs font-black text-indigo-400">
                            {m.analytics.total_shots}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">Shots</div>
                        </div>
                      </div>
                    )}

                    {/* Action Link Button */}
                    <div className="flex items-center gap-2 pt-1">
                      {m.status === 'COMPLETED' ? (
                        <Link to={`/matches/${m.id}/analysis`} className="w-full">
                          <Button size="sm" variant="secondary" className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20">
                            View Tactical Analysis →
                          </Button>
                        </Link>
                      ) : m.status === 'PROCESSING' ? (
                        <Link to={`/matches/${m.id}/processing`} className="w-full">
                          <Button size="sm" variant="secondary" className="w-full">
                            Analyzing ({m.analysis_progress.toFixed(0)}%)
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/matches/${m.id}/calibrate`} className="w-full">
                          <Button size="sm" variant="secondary" className="w-full">
                            Calibrate Court
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Badminton Gesture Posters */}
          <div className="pt-2">
            <BadmintonGestureCards compact={true} />
          </div>
        </>
      )}

      {/* Live Match Camera Modal */}
      {showRecorder && (
        <LiveMatchRecorder onClose={() => setShowRecorder(false)} />
      )}
    </div>
  );
};
