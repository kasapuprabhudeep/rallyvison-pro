import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Activity,
  Zap,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { Match, MatchAnalytics } from '../types';
import { CourtHeatmap } from '../components/court/CourtHeatmap';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';

export const MovementAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const m = await api.getMatch(matchId);
        setMatch(m);
      } catch (err: any) {
        setError(err.message || 'Failed to load movement telemetry.');
      } finally {
        setLoading(false);
      }
    };
    if (matchId) loadData();
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Computing footwork trajectories...</span>
      </div>
    );
  }

  if (error || !match || !match.analytics) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error || 'Movement analysis not available.'}</span>
      </div>
    );
  }

  const a = match.analytics;

  return (
    <div className="flex flex-col gap-8">
      {/* Header Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <Link to={`/matches/${match.id}/analysis`} className="hover:text-cyan-400 transition-colors">
            Analysis Hub
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-medium">Footwork & Movement Dynamics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Player Footwork & Spatial Court Coverage
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Calibrated metric velocity profile, base position reset discipline, and 6-zone occupancy
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Distance"
          value={`${a.total_movement_distance_m.toFixed(1)} m`}
          subtitle="Direct metric path integration"
          icon={MapPin}
          color="lime"
        />
        <StatCard
          title="Average Speed"
          value={`${a.avg_movement_speed_kmh.toFixed(1)} km/h`}
          subtitle="Continuous court movement pace"
          icon={Zap}
          color="cyan"
        />
        <StatCard
          title="Sprint Burst Peak"
          value={`${a.max_movement_speed_kmh.toFixed(1)} km/h`}
          subtitle="Explosive corner lunges & jumps"
          icon={TrendingUp}
          color="rose"
        />
        <StatCard
          title="Base Recovery Rate"
          value={`${a.base_recovery_rate_percent.toFixed(0)}%`}
          subtitle="Target > 55% central reset"
          icon={Activity}
          color="amber"
        />
      </div>

      {/* Speed Over Time Timeseries Chart */}
      {a.speed_series && a.speed_series.length > 0 && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Instantaneous Movement Velocity (km/h)</h3>
              <p className="text-xs text-slate-400">Time-stamped speed fluctuations across rallies</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Peak: {a.max_movement_speed_kmh} km/h
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={a.speed_series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#64748b' }} />
                <YAxis stroke="#64748b" fontSize={11} label={{ value: 'km/h', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#080d1a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="speed"
                  name="Speed (km/h)"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 6-Zone Heatmap and Zone Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <CourtHeatmap
          zoneOccupancy={a.court_zone_occupancy}
          courtType={match.match_type}
        />

        {/* Zone Breakdown Table */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-bold text-white mb-2">Tactical Zone Occupancy Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">
            Percentage of active match time spent in each tactical court sector.
          </p>

          <div className="flex flex-col gap-2.5">
            {Object.entries(a.court_zone_occupancy).map(([zone, pct]) => (
              <div key={zone} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{zone.replace('_', ' ')}</span>
                  <span className="font-mono text-cyan-400 font-bold">{pct.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Measurement Authenticity:</strong> Distances and velocities are strictly computed through the 4-point court perspective homography matrix ($H$).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

