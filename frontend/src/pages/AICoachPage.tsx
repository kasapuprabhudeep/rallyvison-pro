import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Shield, Trophy, Activity, MessageSquare, ChevronDown } from 'lucide-react';
import { AICoachChat } from '../components/ai/AICoachChat';
import { api } from '../services/api';
import { Match } from '../types';

export const AICoachPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await api.listMatches();
        setMatches(data);
        if (data.length > 0) {
          // Default to the most recent match if available
          setSelectedMatchId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load matches for AI coach context', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Autonomous Badminton Sports Science</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-cyan-400" />
            <span>RallyCoach AI Tactical Assistant</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ask any question about stroke mechanics, footwork drills, BWF rules, or ground your coaching in your private match telemetry.
          </p>
        </div>

        {/* Match Context Selector */}
        <div className="flex flex-col gap-1 sm:items-end">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Grounded Match Telemetry:
          </label>
          <div className="relative">
            <select
              value={selectedMatchId || ''}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedMatchId(val ? Number(val) : undefined);
              }}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-[#091129] border border-cyan-500/30 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
            >
              <option value="">🏸 General Badminton (No Match Context)</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  Match: {m.title} ({m.match_type})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Selected Match Context Card (if any) */}
      {selectedMatch && (
        <div className="p-4 rounded-2xl glass-panel bg-[#091129]/80 border border-cyan-500/25 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold">
              🏸
            </div>
            <div>
              <span className="font-bold text-white block">Active Match: {selectedMatch.title}</span>
              <span className="text-[11px] text-slate-400">
                Opponent: {selectedMatch.opponent_name || 'N/A'} • Format: {selectedMatch.match_type} • Status: {selectedMatch.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
              Telemetry Grounded
            </span>
          </div>
        </div>
      )}

      {/* AI Assistant Chat Component */}
      <div className="w-full">
        <AICoachChat
          key={selectedMatchId || 'general'}
          matchId={selectedMatchId}
          matchTitle={selectedMatch?.title}
          defaultOpen={true}
        />
      </div>
    </div>
  );
};
