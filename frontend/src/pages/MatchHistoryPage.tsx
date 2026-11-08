import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  History,
  Trash2,
  PlayCircle,
  RotateCcw,
  GitCompare,
  Plus,
  Filter,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Match } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

export const MatchHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await api.listMatches();
      setMatches(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load match history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleDelete = async (matchId: number) => {
    if (!confirm('Are you sure you want to permanently delete this match recording and all its analytics?')) {
      return;
    }
    try {
      await api.deleteMatch(matchId);
      setMatches(matches.filter(m => m.id !== matchId));
      setSelectedForCompare(selectedForCompare.filter(id => id !== matchId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete match.');
    }
  };

  const handleToggleCompare = (id: number) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter(x => x !== id));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare([selectedForCompare[1], id]);
      } else {
        setSelectedForCompare([...selectedForCompare, id]);
      }
    }
  };

  const filtered = matches.filter(m => {
    if (filterType === 'SINGLES') return m.match_type === 'SINGLES';
    if (filterType === 'DOUBLES') return m.match_type === 'DOUBLES';
    if (filterType === 'COMPLETED') return m.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Match History & Archives
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse, re-analyze, compare, and manage your uploaded badminton sessions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedForCompare.length === 2 && (
            <Button
              variant="secondary"
              icon={GitCompare}
              onClick={() => navigate(`/compare?a=${selectedForCompare[0]}&b=${selectedForCompare[1]}`)}
            >
              Compare Selected (2)
            </Button>
          )}

          <Link to="/upload">
            <Button icon={Plus}>Upload Match</Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'SINGLES', 'DOUBLES', 'COMPLETED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterType === tab
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            {tab === 'ALL' ? 'All Matches' : tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Loading match archives...</span>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Matches Found"
          description="Upload your first match video to start building your performance telemetry history."
          actionLabel="Upload Match"
          actionHref="/upload"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((m) => {
            const isSelected = selectedForCompare.includes(m.id);
            return (
              <div
                key={m.id}
                className={`bg-[#0f172a] border rounded-2xl overflow-hidden transition-all flex flex-col justify-between ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-[#1e293b] hover:border-slate-700'
                }`}
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  {m.video?.thumbnail_path ? (
                    <img src={m.video.thumbnail_path} alt={m.title} className="w-full h-full object-cover" />
                  ) : (
                    <PlayCircle className="w-10 h-10 text-slate-600" />
                  )}

                  <div className="absolute top-2.5 right-2.5">
                    <Badge
                      variant={
                        m.status === 'COMPLETED' ? 'lime' : m.status === 'PROCESSING' ? 'cyan' : 'slate'
                      }
                      size="sm"
                    >
                      {m.status}
                    </Badge>
                  </div>

                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] text-white font-mono">
                    {m.match_type}
                  </div>

                  {m.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleToggleCompare(m.id)}
                      className={`absolute top-2.5 left-2.5 px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-black/60 text-slate-300 hover:bg-black/90'
                      }`}
                    >
                      {isSelected ? '✓ Selected' : '+ Compare'}
                    </button>
                  )}
                </div>

                {/* Match Information */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-base truncate">{m.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Opponent: {m.opponent_name || 'N/A'} • {m.created_at.slice(0, 10)}
                    </p>
                  </div>

                  {m.analytics && (
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800 text-center text-xs">
                      <div>
                        <div className="font-bold text-emerald-400">
                          {m.analytics.total_movement_distance_m.toFixed(0)}m
                        </div>
                        <div className="text-[10px] text-slate-400">Distance</div>
                      </div>
                      <div>
                        <div className="font-bold text-cyan-400">
                          {m.analytics.avg_movement_speed_kmh.toFixed(1)}k
                        </div>
                        <div className="text-[10px] text-slate-400">Avg Speed</div>
                      </div>
                      <div>
                        <div className="font-bold text-amber-400">
                          {m.analytics.total_shots}
                        </div>
                        <div className="text-[10px] text-slate-400">Shots</div>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <Link to={`/matches/${m.id}/analysis`} className="flex-1 mr-2">
                      <Button size="sm" variant="secondary" className="w-full">
                        {m.status === 'COMPLETED' ? 'View Telemetry' : 'Check Status'}
                      </Button>
                    </Link>

                    <button
                      onClick={() => handleDelete(m.id)}
                      title="Delete Match"
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

