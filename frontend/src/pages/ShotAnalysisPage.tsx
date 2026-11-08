import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Target,
  Edit2,
  Check,
  ChevronRight,
  ShieldAlert,
  BarChart3,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { Match, AnalysisResults, ShotEvent, ShotType } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const ShotAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);

  const [match, setMatch] = useState<Match | null>(null);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [editingShotId, setEditingShotId] = useState<number | null>(null);
  const [selectedShotType, setSelectedShotType] = useState<ShotType>('SMASH');
  const [loading, setLoading] = useState(true);
  const [savingShot, setSavingShot] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableShotTypes: ShotType[] = [
    'SMASH', 'CLEAR', 'DROP', 'DRIVE', 'NET_SHOT', 'LIFT', 'DEFENSIVE', 'UNKNOWN'
  ];

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
      setError(err.message || 'Failed to load shot events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (matchId) loadData();
  }, [matchId]);

  const handleSaveCorrection = async (shotId: number) => {
    try {
      setSavingShot(true);
      await api.correctShot(shotId, selectedShotType);
      setEditingShotId(null);
      // Reload results
      const res = await api.getAnalysisResults(matchId);
      setResults(res);
    } catch (err: any) {
      alert(err.message || 'Failed to update shot.');
    } finally {
      setSavingShot(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Categorizing shot telemetry...</span>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error || 'Shot analysis not available.'}</span>
      </div>
    );
  }

  // Build chart data from shot distribution
  const shotCounts: Record<string, number> = {};
  results?.shots.forEach((s) => {
    shotCounts[s.shot_type] = (shotCounts[s.shot_type] || 0) + 1;
  });

  const chartData = Object.entries(shotCounts).map(([type, count]) => ({
    name: type.replace('_', ' '),
    count
  }));

  const COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <Link to={`/matches/${match.id}/analysis`} className="hover:text-emerald-400 transition-colors">
            Analysis Hub
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-medium">Shot Classification & Trajectories</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Shot Detection, Trajectory & Arsenal Breakdown
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {results?.shots.length || 0} discrete hitting events classified by pose reach and trajectory direction
        </p>
      </div>

      {/* Visual Chart & Distribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Bar Chart */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-bold text-white mb-1">Shot Frequency by Category</h3>
          <p className="text-xs text-slate-400 mb-4">Total volume of detected clears, drops, smashes, and net play</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#080d1a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Proportional Distribution Summary */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-bold text-white mb-1">Shot Arsenal Ratio</h3>
          <p className="text-xs text-slate-400 mb-4">Proportion of attacking vs defensive shot choices</p>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#080d1a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Discrete Shot Events Table with Interactive User Correction */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Event Log & User Classification Correction</h3>
            <p className="text-xs text-slate-400">
              Incorrectly classified shot? Click the edit button to correct any event.
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-mono">
            {results?.shots.filter(s => s.is_user_corrected).length} user verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Shot Category</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Hitting Player</th>
                <th className="py-3 px-4">Court Location</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {results?.shots.map((shot, idx) => (
                <tr key={shot.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {shot.timestamp.toFixed(2)}s
                  </td>
                  <td className="py-3 px-4">
                    {editingShotId === shot.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedShotType}
                          onChange={(e) => setSelectedShotType(e.target.value as ShotType)}
                          className="px-2 py-1 bg-slate-900 border border-emerald-500 rounded-lg text-xs text-white"
                        >
                          {availableShotTypes.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          icon={Check}
                          onClick={() => handleSaveCorrection(shot.id)}
                          loading={savingShot}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            shot.shot_type === 'SMASH'
                              ? 'rose'
                              : shot.shot_type === 'CLEAR'
                              ? 'cyan'
                              : shot.shot_type === 'DROP'
                              ? 'amber'
                              : shot.shot_type === 'NET_SHOT'
                              ? 'lime'
                              : 'slate'
                          }
                          size="sm"
                        >
                          {shot.shot_type}
                        </Badge>
                        {shot.is_user_corrected && (
                          <span className="text-[10px] text-emerald-400 font-bold" title="Manually Verified">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className={shot.confidence >= 0.8 ? 'text-emerald-400' : 'text-amber-400'}>
                      {(shot.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    Player {shot.hitting_player_id}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {shot.court_x_m !== undefined && shot.court_y_m !== undefined
                      ? `${shot.court_x_m.toFixed(1)}m, ${shot.court_y_m.toFixed(1)}m`
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingShotId !== shot.id && (
                      <button
                        onClick={() => {
                          setEditingShotId(shot.id);
                          setSelectedShotType(shot.shot_type);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Correct shot classification"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

