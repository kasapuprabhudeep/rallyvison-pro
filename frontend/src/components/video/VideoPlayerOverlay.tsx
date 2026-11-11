import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Rewind, Volume2, VolumeX, Maximize } from 'lucide-react';
import { ShotEvent, MovementTrackPoint, ShuttlecockDetectionPoint } from '../../types';

interface VideoPlayerOverlayProps {
  src: string;
  shots?: ShotEvent[];
  tracks?: MovementTrackPoint[];
  shuttleDetections?: ShuttlecockDetectionPoint[];
  onTimeUpdate?: (time: number) => void;
}

export const VideoPlayerOverlay: React.FC<VideoPlayerOverlayProps> = ({
  src,
  shots = [],
  tracks = [],
  shuttleDetections = [],
  onTimeUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    if (onTimeUpdate) {
      onTimeUpdate(t);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const stepFrame = (deltaSeconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + deltaSeconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const setSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Find active shot or player point at current timestamp
  const activeShot = shots.find(s => Math.abs(s.timestamp - currentTime) <= 0.6);
  const activeTrack = tracks.find(t => Math.abs(t.timestamp - currentTime) <= 0.3);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  return (
    <div className="flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Video & Overlay Container */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          playsInline
        />

        {/* Dynamic HUD Overlays */}
        {activeShot && (
          <div className="absolute top-4 left-4 bg-slate-900/90 border border-cyan-500/50 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {activeShot.shot_type}
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              ({(activeShot.confidence * 100).toFixed(0)}% conf)
            </span>
          </div>
        )}

        {activeTrack && (
          <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 font-mono flex items-center gap-3">
            <span>Speed: <strong className="text-cyan-400">{activeTrack.speed_kmh} km/h</strong></span>
            <span>Zone: <strong className="text-cyan-400">{activeTrack.zone}</strong></span>
          </div>
        )}

        {/* Center Play Button Overlay on Pause */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95"
          >
            <Play className="w-8 h-8 fill-current translate-x-0.5" />
          </button>
        )}
      </div>

      {/* Control Bar */}
      <div className="p-3 bg-[#0d1424] flex flex-col gap-2 border-t border-slate-800">
        {/* Progress Slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Frame step buttons */}
            <button
              onClick={() => stepFrame(-0.1)}
              title="Step backward 1 frame"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <Rewind className="w-4 h-4" />
            </button>
            <button
              onClick={() => stepFrame(0.1)}
              title="Step forward 1 frame"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <FastForward className="w-4 h-4" />
            </button>

            {/* Timestamp */}
            <span className="font-mono text-[11px] text-slate-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Playback rate speed pills */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5">
              {[0.5, 0.75, 1, 1.25].map(rate => (
                <button
                  key={rate}
                  onClick={() => setSpeed(rate)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    playbackRate === rate ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Mute */}
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

