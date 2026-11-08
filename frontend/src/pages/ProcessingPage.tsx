import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';

export const ProcessingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);
  const navigate = useNavigate();

  const [progress, setProgress] = useState(5.0);
  const [statusMessage, setStatusMessage] = useState('Initializing telemetry pipeline...');
  const [status, setStatus] = useState('PROCESSING');
  const [error, setError] = useState<string | null>(null);

  const stages = [
    { label: 'Video Ingestion & Frame Extraction', threshold: 15 },
    { label: 'Court Homography Perspective Transform', threshold: 25 },
    { label: 'Player Tracking & Footwear Ground Anchoring', threshold: 60 },
    { label: 'Shuttlecock Trajectory & Direction Reversal', threshold: 75 },
    { label: 'Shot Detection & Category Classification', threshold: 85 },
    { label: 'Rally Segmentation & Work-Rest Metrics', threshold: 92 },
    { label: 'Tactical Coaching Insights & Biomechanical Report', threshold: 100 }
  ];

  useEffect(() => {
    let interval: any;

    const pollStatus = async () => {
      try {
        const res = await api.getAnalysisStatus(matchId);
        setProgress(res.progress);
        setStatusMessage(res.message);
        setStatus(res.status);

        if (res.status === 'COMPLETED') {
          clearInterval(interval);
          setTimeout(() => {
            navigate(`/matches/${matchId}/analysis`);
          }, 1200);
        } else if (res.status === 'FAILED') {
          clearInterval(interval);
          setError(res.message || 'Analysis processing encountered an unexpected error.');
        }
      } catch (err: any) {
        // Continue polling
      }
    };

    pollStatus();
    interval = setInterval(pollStatus, 1500);

    return () => clearInterval(interval);
  }, [matchId, navigate]);

  return (
    <div className="max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      {/* Animated Glowing Ring */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-3xl bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-2xl">
          <Activity className="w-12 h-12 stroke-[2.5] animate-pulse" />
        </div>
        <div className="absolute -inset-2 bg-cyan-500/20 rounded-3xl blur-xl -z-10 animate-pulse" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        Processing Badminton Match Video
      </h1>
      <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md">
        Running modular 15-stage computer-vision telemetry pipeline.
      </p>

      {/* Progress Bar & Status Text */}
      <div className="w-full mt-8 p-6 rounded-3xl glass-panel bg-[#091129]/80 border border-cyan-500/25 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-cyan-400 font-semibold">{statusMessage}</span>
          <span className="text-white font-bold">{progress.toFixed(0)}%</span>
        </div>

        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>

        {/* Pipeline Stage Checklist */}
        <div className="flex flex-col gap-2.5 mt-4 text-left border-t border-slate-800/80 pt-4">
          {stages.map((stg, i) => {
            const isDone = progress >= stg.threshold;
            const isCurrent = progress < stg.threshold && (i === 0 || progress >= stages[i - 1].threshold);

            return (
              <div
                key={i}
                className={`flex items-center gap-2.5 text-xs transition-colors ${
                  isDone
                    ? 'text-emerald-400 font-medium'
                    : isCurrent
                    ? 'text-white font-bold'
                    : 'text-slate-500'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span>{stg.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 text-left">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {status === 'COMPLETED' && (
        <div className="mt-6">
          <Button
            size="lg"
            icon={ArrowRight}
            onClick={() => navigate(`/matches/${matchId}/analysis`)}
          >
            Open Performance Analysis
          </Button>
        </div>
      )}
    </div>
  );
};
