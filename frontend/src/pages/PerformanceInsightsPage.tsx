import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Target,
  Award,
  Zap,
  Activity,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Match, PerformanceRecommendation } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const PerformanceInsightsPage: React.FC = () => {
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
        setError(err.message || 'Failed to load recommendations.');
      } finally {
        setLoading(false);
      }
    };
    if (matchId) loadData();
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <span className="text-xs text-slate-300 font-medium">Synthesizing tactical coaching insights & drills...</span>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error || 'Insights not available.'}</span>
      </div>
    );
  }

  const recs = match.recommendations;

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <Link to={`/matches/${match.id}/analysis`} className="hover:text-cyan-400 transition-colors">
            Analysis Hub
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-medium">Tactical Coaching Insights</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Tactical Performance Coaching & Biomechanical Drills
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Tactical training drills and court movement adjustments synthesized from match telemetry
        </p>
      </div>

      {/* Disclaimers & Integrity Header Card */}
      <div className="p-5 rounded-2xl glass-panel bg-gradient-to-r from-[#0d1627] to-[#0a1638] border border-cyan-500/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-white">Empirical Evidence Grounding</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Every insight below is derived from physical spatial measurements (base recovery percentage, sprint bursts, zone occupancy, and shot selection). We do not speculate on unrecorded attributes.
          </p>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="flex flex-col gap-4">
        {recs.map((rec) => (
          <div
            key={rec.id}
            className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] hover:border-slate-700 transition-colors flex flex-col gap-4 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[11px] font-bold">
                  {rec.category}
                </span>
                <h3 className="text-base font-bold text-white">{rec.title}</h3>
              </div>
              <Badge variant={rec.priority === 'HIGH' ? 'rose' : rec.priority === 'MEDIUM' ? 'amber' : 'slate'}>
                {rec.priority} Priority
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Observed Pattern & Telemetry
                </span>
                <p className="text-slate-300 leading-relaxed">{rec.observation}</p>
                {rec.grounded_metric && (
                  <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-cyan-400">
                    {rec.grounded_metric}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block mb-1">
                  Target Training Drill & Tactical Remedy
                </span>
                <p className="text-white leading-relaxed font-medium">{rec.recommendation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

