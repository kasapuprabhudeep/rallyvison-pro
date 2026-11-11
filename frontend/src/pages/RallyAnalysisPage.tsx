import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  Zap,
  CheckCircle2,
  ChevronRight,
  Flame,
  Award,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Match, AnalysisResults } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const RallyAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);

  const [match, setMatch] = useState<Match | null>(null);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [m, res] = await Promise.all([
        api.getMatch(matchId),
        api.getAnalysisResults(matchId)
      ]);
      setMatch(m);
      setResults(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load rally telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (matchId) loadData();
  }, [matchId]);

  const handleVerify = async (rallyId: number) => {
    try {
      await api.verifyRally(rallyId);
      const res = await api.getAnalysisResults(matchId);
      setResults(res);
    } catch (err: any) {
      alert(err.message || 'Verification failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Segmenting rally durations...</span>
      </div>
    );
  }

  if (error || !match || !match.analytics) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error || 'Rally breakdown not available.'}</span>
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
          <span className="text-slate-200 font-medium">Rally Pacing & Active Play</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Rally Segmentation & Match Pacing
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Breakdown of active rally exchanges vs pause and rest intervals
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Rallies"
          value={a.total_rallies}
          subtitle={`Avg ${a.avg_rally_duration_sec.toFixed(1)}s duration`}
          icon={Clock}
          color="lime"
        />
        <StatCard
          title="Longest Rally"
          value={`${a.longest_rally_sec.toFixed(1)} s`}
          subtitle="Peak endurance exchange"
          icon={Award}
          color="amber"
        />
        <StatCard
          title="Work-to-Rest Ratio"
          value={`1 : ${a.work_to_rest_ratio.toFixed(1)}`}
          subtitle={`${a.active_play_duration_sec.toFixed(0)}s play vs ${a.rest_duration_sec.toFixed(0)}s rest`}
          icon={Zap}
          color="cyan"
        />
        <StatCard
          title="Shots Per Rally"
          value={`${a.avg_shots_per_rally.toFixed(1)}`}
          subtitle={`${a.total_shots} total detected shots`}
          icon={Flame}
          color="rose"
        />
      </div>

      {/* Detailed Rally Event Cards */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-white mb-1">Detected Rallies</h3>
        <p className="text-xs text-slate-400 mb-4">
          Click Verify to confirm rally boundary timestamps
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results?.rallies.map((rally) => (
            <div
              key={rally.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">
                  Rally #{rally.rally_number}
                </span>
                <Badge variant={rally.is_verified ? 'cyan' : 'slate'} size="sm">
                  {rally.is_verified ? 'Verified' : 'Auto-Detected'}
                </Badge>
              </div>

              <div className="flex items-baseline justify-between text-xs font-mono py-1 border-y border-slate-800">
                <span className="text-slate-400">Duration:</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {rally.duration_seconds.toFixed(1)}s
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div>
                  Start: <strong className="text-white">{rally.start_timestamp.toFixed(1)}s</strong>
                </div>
                <div>
                  End: <strong className="text-white">{rally.end_timestamp.toFixed(1)}s</strong>
                </div>
                <div>
                  Shots: <strong className="text-white">{rally.shot_count}</strong>
                </div>
                <div>
                  Winner: <strong className="text-white">{rally.winning_player_id ? `Player ${rally.winning_player_id}` : 'Unassigned'}</strong>
                </div>
              </div>

              {!rally.is_verified && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={CheckCircle2}
                  onClick={() => handleVerify(rally.id)}
                  className="w-full mt-1"
                >
                  Verify Rally Boundary
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

