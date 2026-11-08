import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  GitCompare,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  MapPin,
  Clock,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Match } from '../types';
import { Button } from '../components/ui/Button';

export const MatchComparisonPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const matchAId = searchParams.get('a');
  const matchBId = searchParams.get('b');

  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedA, setSelectedA] = useState<number | ''>(matchAId ? Number(matchAId) : '');
  const [selectedB, setSelectedB] = useState<number | ''>(matchBId ? Number(matchBId) : '');
  const [compareData, setCompareData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const list = await api.listMatches();
        const completed = list.filter(m => m.status === 'COMPLETED');
        setMatches(completed);

        if (!selectedA && completed.length > 0) {
          setSelectedA(completed[0].id);
        }
        if (!selectedB && completed.length > 1) {
          setSelectedB(completed[1].id);
        }
      } catch {
        // ignore
      }
    };
    fetchMatches();
  }, []);

  const runComparison = async () => {
    if (!selectedA || !selectedB || selectedA === selectedB) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.compareMatches(Number(selectedA), Number(selectedB));
      setCompareData(data);
    } catch (err: any) {
      setError(err.message || 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedA && selectedB && selectedA !== selectedB) {
      runComparison();
    }
  }, [selectedA, selectedB]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Match-to-Match Progression Comparison
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Select two completed matches to evaluate tactical adjustments and physical endurance changes
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e293b] grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Baseline Match (Session A)
          </label>
          <select
            value={selectedA}
            onChange={(e) => setSelectedA(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-[#080d1a] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.created_at.slice(0, 10)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Comparison Match (Session B)
          </label>
          <select
            value={selectedB}
            onChange={(e) => setSelectedB(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-[#080d1a] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            {matches.map(m => (
              <option key={m.id} value={m.id} disabled={m.id === selectedA}>
                {m.title} ({m.created_at.slice(0, 10)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Computing deltas and progression trends...</span>
        </div>
      ) : compareData ? (
        <div className="flex flex-col gap-6">
          {/* Key Deltas Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Distance Delta
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {compareData.deltas.distance_m > 0 ? `+${compareData.deltas.distance_m}` : compareData.deltas.distance_m}m
                </span>
                {compareData.deltas.distance_m > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Ground coverage change</p>
            </div>

            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Speed Delta
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {compareData.deltas.speed_kmh > 0 ? `+${compareData.deltas.speed_kmh}` : compareData.deltas.speed_kmh} km/h
                </span>
                {compareData.deltas.speed_kmh > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Movement velocity pace</p>
            </div>

            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Base Recovery Delta
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {compareData.deltas.base_recovery_percent > 0 ? `+${compareData.deltas.base_recovery_percent}` : compareData.deltas.base_recovery_percent}%
                </span>
                {compareData.deltas.base_recovery_percent > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Central reset consistency</p>
            </div>

            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Shots Delta
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {compareData.deltas.shots > 0 ? `+${compareData.deltas.shots}` : compareData.deltas.shots}
                </span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total recorded shots</p>
            </div>
          </div>

          {/* Side-by-side Comparative Table */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl overflow-x-auto">
            <h3 className="text-base font-bold text-white mb-4">Metric by Metric Breakdown</h3>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Performance Metric</th>
                  <th className="py-3 px-4 text-emerald-400 font-bold">{compareData.match_a.title}</th>
                  <th className="py-3 px-4 text-cyan-400 font-bold">{compareData.match_b.title}</th>
                  <th className="py-3 px-4">Delta Variation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Movement Distance</td>
                  <td className="py-3.5 px-4 font-mono">{compareData.match_a.analytics.total_movement_distance_m.toFixed(1)} m</td>
                  <td className="py-3.5 px-4 font-mono">{compareData.match_b.analytics.total_movement_distance_m.toFixed(1)} m</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{compareData.deltas.distance_m} m</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Average Speed</td>
                  <td className="py-3.5 px-4 font-mono">{compareData.match_a.analytics.avg_movement_speed_kmh.toFixed(1)} km/h</td>
                  <td className="py-3.5 px-4 font-mono">{compareData.match_b.analytics.avg_movement_speed_kmh.toFixed(1)} km/h</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{compareData.deltas.speed_kmh} km/h</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Peak Speed</td>
                  <td className="py-3.5 px-4 font-mono">{compareData.match_a.analytics.max_movement_speed_kmh.toFixed(1)} km/h</td>
                  <td className="py-3.5 px-4 font-mono">{compareData.match_b.analytics.max_movement_speed_kmh.toFixed(1)} km/h</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {(compareData.match_b.analytics.max_movement_speed_kmh - compareData.match_a.analytics.max_movement_speed_kmh).toFixed(1)} km/h
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Base Recovery Rate</td>
                  <td className="py-3.5 px-4 font-mono">{compareData.match_a.analytics.base_recovery_rate_percent.toFixed(0)}%</td>
                  <td className="py-3.5 px-4 font-mono">{compareData.match_b.analytics.base_recovery_rate_percent.toFixed(0)}%</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{compareData.deltas.base_recovery_percent}%</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Total Rallies</td>
                  <td className="py-3.5 px-4 font-mono">{compareData.match_a.analytics.total_rallies}</td>
                  <td className="py-3.5 px-4 font-mono">{compareData.match_b.analytics.total_rallies}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{compareData.deltas.rallies}</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Total Detected Shots</td>
                  <td className="py-3.5 px-4 font-mono">{compareData.match_a.analytics.total_shots}</td>
                  <td className="py-3.5 px-4 font-mono">{compareData.match_b.analytics.total_shots}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{compareData.deltas.shots}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 text-sm">
          Select two matches to generate direct side-by-side telemetry comparison.
        </div>
      )}
    </div>
  );
};

