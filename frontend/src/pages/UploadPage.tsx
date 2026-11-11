import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Camera,
  Film,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { LiveMatchRecorder } from '../components/video/LiveMatchRecorder';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [showLiveRecorder, setShowLiveRecorder] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [title, setTitle] = useState('');
  const [matchType, setMatchType] = useState<'SINGLES' | 'DOUBLES'>('SINGLES');
  const [playerPosition, setPlayerPosition] = useState('NEAR_COURT');
  const [opponentName, setOpponentName] = useState('');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [autoMode, setAutoMode] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName || `Badminton Match - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      setError('Please select or record a video file first.');
      return;
    }

    setError(null);
    try {
      setStatusText('Creating match record in database...');
      const defaultTitle = `Badminton Match - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      const match = await api.createMatch({
        title: title.trim() || defaultTitle,
        match_type: matchType,
        player_position: playerPosition,
        opponent_name: opponentName.trim() || undefined,
        match_date: new Date(matchDate).toISOString(),
        notes: notes.trim() || undefined
      });

      setStatusText('Uploading match video to processing pipeline...');
      setUploadProgress(0);

      await api.uploadVideo(match.id, selectedFile, (pct) => {
        setUploadProgress(pct);
      });

      if (autoMode) {
        setStatusText('Calibrating court matrix and initiating kinematic tracking...');
        try {
          await api.autoDetectCourt(match.id);
        } catch {
          // If auto detect fallback, standard homography will be used
        }
        await api.startAnalysis(match.id);
        navigate(`/matches/${match.id}/processing`);
      } else {
        setStatusText('Video uploaded. Opening court calibration canvas...');
        navigate(`/matches/${match.id}/calibrate`);
      }
    } catch (err: any) {
      setError(err.message || 'Upload and analysis initiation failed.');
      setUploadProgress(null);
      setStatusText(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12">
      {/* Live In-App Camera Viewfinder Modal */}
      {showLiveRecorder && (
        <LiveMatchRecorder onClose={() => setShowLiveRecorder(false)} />
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Zap className="w-4 h-4" />
          <span>Automated Video Analysis</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Record or Upload Match Video
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Take a video with your phone/camera or select a file. Once submitted, RallyVision Pro automatically registers the court boundaries, tracks player footwork, and classifies strokes.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Video Capture Options */}
      {!selectedFile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option A: Take Live Video with Camera */}
          <div
            onClick={() => setShowLiveRecorder(true)}
            className="p-6 rounded-3xl bg-gradient-to-br from-red-950/40 via-[#0a1128] to-[#080d20] border-2 border-red-500/35 hover:border-red-500/60 transition-all cursor-pointer group flex flex-col justify-between gap-4 shadow-xl active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <Camera className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Live Camera
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-red-300 transition-colors">
                Record Video with Camera
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Open in-app court viewfinder. Record your game on court, then tap Submit & the telemetry engine will automatically process everything!
              </p>
            </div>

            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={Camera}
              className="w-full mt-2"
            >
              Open Live Court Camera
            </Button>
          </div>

          {/* Option B: Choose Video from File System */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-3xl glass-panel bg-[#091129]/80 border-2 ${
              isDragging ? 'border-cyan-400 bg-cyan-500/15' : 'border-cyan-500/25 hover:border-cyan-400/50'
            } transition-all cursor-pointer group flex flex-col justify-between gap-4 shadow-xl active:scale-[0.99]`}
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <Upload className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="px-3 py-1 rounded-full bg-[#070d22] border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold">
                MP4, MOV, MKV, WebM
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                Upload Saved Video File
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Select a recorded match from your phone or computer storage. Drag & drop or browse device.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Film}
              className="w-full mt-2 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
            >
              Browse Device Videos
            </Button>
          </div>
        </div>
      )}

      {/* Selected Video Preview & 1-Click Auto-Analyze Action */}
      {selectedFile && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 flex flex-col gap-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-base font-extrabold text-white">Video Ready for Submission</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
                setUploadProgress(null);
              }}
              className="text-xs text-rose-400 hover:text-rose-300 hover:underline font-semibold"
            >
              Remove & Choose Another
            </button>
          </div>

          {/* Video Preview */}
          <div className="w-full aspect-video max-h-[380px] bg-black rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl">
            <video src={previewUrl!} controls className="w-full h-full object-contain" />
          </div>

          {/* Upload Progress Indicator */}
          {uploadProgress !== null && (
            <div className="w-full flex flex-col gap-2 p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold">{statusText}</span>
                <span className="text-white font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 1-Click Fast Submit Button */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25">
              <div className="pr-4">
                <span className="text-xs font-bold text-white block">
                  ⚡ Automated Kinematic Processing Pipeline (Recommended)
                </span>
                <span className="text-[11px] text-slate-300">
                  Automatically aligns court lines, detects rallies, tracks footwork, and calculates calories immediately
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoMode}
                onChange={(e) => setAutoMode(e.target.checked)}
                className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            <Button
              size="lg"
              icon={ArrowRight}
              onClick={() => handleSubmit()}
              disabled={uploadProgress !== null}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/20"
            >
              {autoMode ? 'Submit Video & Process Court Telemetry' : 'Submit Video & Calibrate Court'}
            </Button>
          </div>

          {/* Optional Advanced Settings Toggle */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-200 py-2 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Customize Match Details (Optional)</span>
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-800/60">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Match Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Club Weekend Singles"
                    className="w-full px-3.5 py-2 bg-[#080d1a] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Format
                  </label>
                  <select
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SINGLES">Singles (5.18m Court)</option>
                    <option value="DOUBLES">Doubles (6.10m Court)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Player Half
                  </label>
                  <select
                    value={playerPosition}
                    onChange={(e) => setPlayerPosition(e.target.value)}
                    className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="NEAR_COURT">Near Court (Closer to Camera)</option>
                    <option value="FAR_COURT">Far Court (Opposite side)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Opponent Name
                  </label>
                  <input
                    type="text"
                    value={opponentName}
                    onChange={(e) => setOpponentName(e.target.value)}
                    placeholder="e.g. Viktor"
                    className="w-full px-3.5 py-2 bg-[#080d1a] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Match Date
                  </label>
                  <input
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#080d1a] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
