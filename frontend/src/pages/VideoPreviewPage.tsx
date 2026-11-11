import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Film, ChevronRight, RotateCcw, Activity, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Match } from '../types';
import { VideoPlayerOverlay } from '../components/video/VideoPlayerOverlay';
import { Button } from '../components/ui/Button';

export const VideoPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMatch = async () => {
      try {
        setLoading(true);
        const m = await api.getMatch(matchId);
        setMatch(m);
      } catch (err: any) {
        setError(err.message || 'Failed to load video preview.');
      } finally {
        setLoading(false);
      }
    };
    if (matchId) loadMatch();
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Loading video stream...</span>
      </div>
    );
  }

  if (error || !match || !match.video) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error || 'No uploaded video found for this match.'}</span>
      </div>
    );
  }

  const videoSrc = api.getVideoStreamUrl(match.video.id);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <Link to={`/matches/${match.id}/analysis`} className="hover:text-cyan-400 transition-colors">
            Analysis Hub
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-medium">Video Inspection Preview</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {match.title} - Video Stream
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Resolution: {match.video.metadata_info?.width}x{match.video.metadata_info?.height} • FPS: {match.video.metadata_info?.fps} • Duration: {match.video.metadata_info?.duration_seconds}s
        </p>
      </div>

      <VideoPlayerOverlay src={videoSrc} />

      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f172a] border border-[#1e293b]">
        <Link to={`/matches/${match.id}/calibrate`}>
          <Button variant="outline" icon={RotateCcw}>
            Recalibrate Court
          </Button>
        </Link>
        <Link to={`/matches/${match.id}/analysis`}>
          <Button icon={Activity}>
            Return to Analysis Hub
          </Button>
        </Link>
      </div>
    </div>
  );
};

