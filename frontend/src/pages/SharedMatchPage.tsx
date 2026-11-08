import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Activity,
  Calendar,
  User,
  Clock,
  Flame,
  Footprints,
  Zap,
  Download,
  Share2,
  Lock,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target
} from 'lucide-react';
import { api } from '../services/api';
import { SharedMatchPublic } from '../types';
import { TacticalCourtView } from '../components/court/TacticalCourtView';
import { CourtHeatmap } from '../components/court/CourtHeatmap';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CrossedRacketsLogoIcon } from '../components/icons/BadmintonIcons';

export const SharedMatchPage: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [match, setMatch] = useState<SharedMatchPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedMatch = async () => {
      if (!shareToken) return;
      try {
        setLoading(true);
        const data = await api.getSharedMatch(shareToken);
        setMatch(data);
      } catch (err: any) {
        setError(err.message || 'Shared match report not found or access has been revoked.');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedMatch();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Loading secure shared match analysis...</span>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0f172a] border border-rose-500/30 rounded-3xl p-8 text-center shadow-2xl flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Private Match Access Unavailable</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {error || 'This match recording is private or public access was revoked by the player.'}
            </p>
          </div>
          <Link to="/" className="w-full mt-2">
            <Button size="sm" className="w-full">
              Go to RallyVision Pro Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const analytics = match.analytics;
  const shotEvents = match.shot_events || [];
  const tracks = match.movement_tracks || [];

  return (
    <div className="min-h-screen bg-[#021a14] text-slate-100 flex flex-col">
      {/* Public Shared Banner */}
      <div className="bg-[#052820] border-b border-emerald-500/30 px-4 py-2 text-center text-xs text-emerald-300 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong>Private Access Shared Link:</strong> Viewing match performance data authorized by{' '}
          <span className="text-white font-bold">{match.player_name}</span>.
        </span>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-8 flex flex-col gap-8 flex-1">
        {/* Match Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#052820] border border-emerald-500/25 shadow-xl">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="lime">{match.match_type}</Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(match.match_date).toLocaleDateString()}
              </span>
              <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                {analytics?.player_archetype || 'All-Round Dynamo 🏸'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {match.title}
            </h1>

            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-300" />
                Player: <strong className="text-white ml-1">{match.player_name}</strong>
              </span>
              {match.opponent_name && (
                <span>
                  vs <strong className="text-white">{match.opponent_name}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {match.has_pdf_report && shareToken && (
              <a
                href={api.getSharedPdfUrl(shareToken)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white border border-slate-700 transition-colors font-medium shadow"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download PDF Summary</span>
              </a>
            )}

            <Link to="/register">
              <Button size="sm" icon={Sparkles}>
                Analyze My Match
              </Button>
            </Link>
          </div>
        </div>

        {/* Fitness & Activity Metrics */}
        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Calories Burned"
              value={`~${analytics.estimated_calories_burned || 0} kcal`}
              subtitle="Estimated energy expenditure"
              icon={Flame}
              color="rose"
            />
            <StatCard
              title="Total Distance"
              value={`${analytics.total_movement_distance_m.toFixed(0)}m`}
              subtitle={`~${analytics.estimated_steps || 0} movement steps`}
              icon={Footprints}
              color="lime"
            />
            <StatCard
              title="Movement Speed"
              value={`${analytics.avg_movement_speed_kmh.toFixed(1)} km/h`}
              subtitle={`Peak: ${analytics.max_movement_speed_kmh.toFixed(1)} km/h`}
              icon={Zap}
              color="cyan"
            />
            <StatCard
              title="Base Recovery"
              value={`${analytics.base_recovery_rate_percent.toFixed(0)}%`}
              subtitle="Reset discipline to center T"
              icon={Target}
              color="amber"
            />
          </div>
        )}

        {/* Tactical 2D Court & Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-[#1e293b] flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  2D Tactical Court Projection
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">BWF 13.4m Court</span>
            </div>
            <p className="text-xs text-slate-400">
              Player movement path (green trail) and detected shot hit events projected using homography transformation.
            </p>
            <div className="flex justify-center p-2 bg-slate-950/60 rounded-2xl border border-slate-800">
              <TacticalCourtView
                tracks={tracks as any}
                shots={shotEvents as any}
                courtType={match.match_type}
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* 6-Zone Heatmap */}
            <div className="p-6 rounded-3xl bg-[#0f172a] border border-[#1e293b] flex flex-col gap-4 shadow-xl flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Court Zone Occupancy
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Tactical Coverage</span>
              </div>
              <div className="flex justify-center p-2 bg-slate-950/60 rounded-2xl border border-slate-800">
                <CourtHeatmap
                  courtType={match.match_type}
                  zoneOccupancy={analytics?.court_zone_occupancy || {}}
                />
              </div>
            </div>

            {/* Shot Distribution */}
            {analytics?.shot_distribution && (
              <div className="p-6 rounded-3xl bg-[#0f172a] border border-[#1e293b] flex flex-col gap-3 shadow-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Detected Shot Breakdown ({analytics.total_shots} Shots)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {Object.entries(analytics.shot_distribution).map(([shot, count]) => (
                    <div
                      key={shot}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-300 font-medium">{shot.replace('_', ' ')}</span>
                      <span className="font-mono font-bold text-emerald-400">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tactical Biomechanical Drills & Recommendations */}
        {match.recommendations && match.recommendations.length > 0 && (
          <div className="p-6 rounded-3xl glass-panel bg-[#091129]/80 border border-cyan-500/25 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center gap-2">
              <CrossedRacketsLogoIcon className="w-4 h-4" glow={false} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Tactical Coaching Insights & Biomechanics
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {match.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl bg-[#05091a] border border-cyan-500/20 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{rec.title}</span>
                    <Badge variant={rec.priority === 'HIGH' ? 'rose' : 'slate'}>
                      {rec.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{rec.observation}</p>
                  <p className="text-xs text-cyan-300 bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20 font-medium">
                    🏸 {rec.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Public CTA Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#0a1128] via-[#0e1738] to-[#141f4d] border border-cyan-500/35 text-center flex flex-col items-center gap-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <Activity className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Want to analyze your own badminton matches?
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
              Record from your smartphone or upload match video. Automated optical tracking records footwork distance, smash speeds, and rally dynamics.
            </p>
          </div>
          <Link to="/register">
            <Button size="lg" icon={ArrowRight} className="font-black px-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-xl shadow-cyan-500/20">
              Get Started with RallyVision Pro
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
