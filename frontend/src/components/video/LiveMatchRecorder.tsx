import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Video,
  Square,
  Sparkles,
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  FlipHorizontal
} from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';

interface LiveMatchRecorderProps {
  onClose?: () => void;
}

export const LiveMatchRecorder: React.FC<LiveMatchRecorderProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize camera stream
  const startCamera = async (mode: 'environment' | 'user') => {
    try {
      setError(null);
      // Stop existing tracks first
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      let mediaStream: MediaStream;
      try {
        // Try with audio first
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true
        });
      } catch {
        // Fallback to video only if mic is unavailable or denied
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setError('Camera access denied or camera not found. Please verify browser camera permissions.');
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const toggleFacingMode = () => {
    if (isRecording) return;
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Timer while recording
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const startRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    setElapsedSeconds(0);

    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.start(1000); // 1-second chunks
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      setError('Unable to record video stream with current browser capabilities.');
    }
  };

  const stopRecordingAndAnalyze = async () => {
    if (!mediaRecorderRef.current) return;

    setProcessing(true);
    setProcessingStatus('Finalizing recorded video buffer...');

    mediaRecorderRef.current.onstop = async () => {
      try {
        const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
        const isMp4 = mimeType.includes('mp4');
        const ext = isMp4 ? 'mp4' : 'webm';

        const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const videoFile = new File([videoBlob], `Live_Match_${now.toISOString().slice(0, 10)}.${ext}`, {
          type: mimeType
        });

        // 1. Create Match for Everyday Player
        setProcessingStatus('Creating match profile in database...');
        const matchTitle = `Badminton Match - ${dateStr} (${timeStr})`;
        const match = await api.createMatch({
          title: matchTitle,
          match_type: 'SINGLES',
          player_position: 'NEAR_COURT',
          notes: 'Recorded directly via RallyVision in-app camera'
        });

        // 2. Upload Video with Progress
        setProcessingStatus('Uploading video to telemetry processing server...');
        setUploadPercent(0);
        await api.uploadVideo(match.id, videoFile, (pct) => {
          setUploadPercent(pct);
        });

        // 3. Auto-detect Court & Homography in 1 click
        setProcessingStatus('Auto-aligning court lines with optical homography...');
        try {
          await api.autoDetectCourt(match.id);
        } catch {
          // If auto detect fallback, standard homography will be used
        }

        // 4. Start Telemetry Analysis Pipeline
        setProcessingStatus('Launching Telemetry Performance Analysis...');
        await api.startAnalysis(match.id);

        // Stop camera tracks before redirecting
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        // 5. Jump directly to Live Processing Screen
        navigate(`/matches/${match.id}/processing`);
      } catch (err: any) {
        setError(err.message || 'Failed to submit and analyze match.');
        setProcessing(false);
      }
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col p-4 sm:p-6 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
              <span>Live Court Camera & Instant Optical Analysis</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hidden sm:inline-block">
                Auto-Analyze
              </span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Record your match, hit submit, and our telemetry engine will automatically process movement, shots, and rallies
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Flip camera toggle for mobile */}
          {!isRecording && !processing && (
            <button
              onClick={toggleFacingMode}
              title="Switch Camera (Front/Rear)"
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1.5 text-xs transition-colors"
            >
              <FlipHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Flip Camera</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={() => {
                if (stream) stream.getTracks().forEach((t) => t.stop());
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="my-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Viewfinder */}
      <div className="relative flex-1 bg-black rounded-3xl overflow-hidden my-3 border border-slate-800 shadow-2xl flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Live Recording HUD Status */}
        {isRecording && (
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-red-500/40 flex items-center gap-3 shadow-xl">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-mono font-bold text-white text-base">
              REC {formatTimer(elapsedSeconds)}
            </span>
          </div>
        )}

        {/* Setup Guide Overlay for Players */}
        {!isRecording && !processing && (
          <div className="absolute bottom-4 inset-x-4 max-w-lg mx-auto bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 text-center text-xs text-slate-200 shadow-2xl">
            <span className="text-amber-400 font-bold block text-sm mb-1">
              🏸 Step 1: Position Camera & Step 2: Play!
            </span>
            <span>
              Rest your phone or tripod at the back baseline or corner of the court. When finished, tap Finish & Auto-Analyze!
            </span>
          </div>
        )}

        {/* Loading Spinner & Progress Overlay */}
        {processing && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 gap-4 z-20">
            <div className="w-14 h-14 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-xl" />
            <div className="text-center">
              <h4 className="text-base font-bold text-white mb-1">{processingStatus}</h4>
              <p className="text-xs text-slate-400">Everything is automated — court calibration, player tracking, and shots.</p>
            </div>

            {uploadPercent !== null && (
              <div className="w-full max-w-xs flex flex-col gap-1.5 mt-2">
                <div className="flex justify-between text-xs font-mono text-cyan-400">
                  <span>Uploading video</span>
                  <span>{uploadPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-200"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Buttons Bar */}
      <div className="pt-2 flex items-center justify-center gap-4">
        {!isRecording && !processing ? (
          <Button
            size="lg"
            icon={Video}
            onClick={startRecording}
            className="w-full max-w-md py-4 bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/30 font-extrabold text-base"
          >
            Start Recording Match Video
          </Button>
        ) : isRecording ? (
          <Button
            size="lg"
            icon={Square}
            onClick={stopRecordingAndAnalyze}
            className="w-full max-w-md py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-xl shadow-cyan-500/30 font-black text-base animate-pulse"
          >
            ⏹ Submit & Auto-Analyze Everything ({formatTimer(elapsedSeconds)})
          </Button>
        ) : null}
      </div>
    </div>
  );
};
