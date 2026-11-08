import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Compass,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { CourtCalibration, CornerPoint, Match } from '../types';
import { CourtCanvas } from '../components/court/CourtCanvas';
import { Button } from '../components/ui/Button';

export const CourtCalibrationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);
  const navigate = useNavigate();

  const [match, setMatch] = useState<Match | null>(null);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [corners, setCorners] = useState<CornerPoint[]>([
    { x: 0.28, y: 0.22 },
    { x: 0.72, y: 0.22 },
    { x: 0.90, y: 0.88 },
    { x: 0.10, y: 0.88 }
  ]);
  const [courtType, setCourtType] = useState<'SINGLES' | 'DOUBLES'>('SINGLES');
  const [confidence, setConfidence] = useState<number>(0.75);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCalibrationData = async () => {
      try {
        setLoading(true);
        const [matchData, frameData, calibData] = await Promise.all([
          api.getMatch(matchId),
          api.getCalibrationFrame(matchId),
          api.getCalibration(matchId).catch(() => null)
        ]);

        setMatch(matchData);
        setFrameUrl(frameData.frame_url);
        if (calibData && calibData.corners && calibData.corners.length === 4) {
          setCorners(calibData.corners);
          setCourtType(calibData.court_type || 'SINGLES');
          setConfidence(calibData.calibration_confidence || 0.8);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load video calibration frame.');
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      loadCalibrationData();
    }
  }, [matchId]);

  const handleAutoDetect = async () => {
    try {
      setSaving(true);
      const det = await api.autoDetectCourt(matchId);
      setCorners(det.corners);
      setConfidence(det.calibration_confidence);
    } catch (err: any) {
      setError(err.message || 'Auto-detection failed. You can adjust the 4 corners manually.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setCorners([
      { x: 0.28, y: 0.22 },
      { x: 0.72, y: 0.22 },
      { x: 0.90, y: 0.88 },
      { x: 0.10, y: 0.88 }
    ]);
  };

  const handleSaveAndAnalyze = async () => {
    try {
      setSaving(true);
      await api.updateCalibration(matchId, corners, courtType);
      await api.startAnalysis(matchId);
      navigate(`/matches/${matchId}/processing`);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate court telemetry analysis.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <span className="text-xs text-slate-300 font-medium">Extracting video perspective frame...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
            <Compass className="w-4 h-4" />
            <span>Stage 4: Perspective Calibration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Badminton Court Calibration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Match: <strong>{match?.title}</strong> • Align the 4 corners to establish BWF metric mapping
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Sparkles} onClick={handleAutoDetect} loading={saving}>
            Auto-Detect
          </Button>
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={handleResetDefaults}>
            Reset Pins
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Calibration Canvas */}
      {frameUrl && (
        <CourtCanvas
          imageUrl={frameUrl}
          corners={corners}
          onChange={setCorners}
          courtType={courtType}
        />
      )}

      {/* Verification Notice Card */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Homography Calibration Certified</h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Perspective matrix will calculate physical displacement in meters and instantaneous speeds in km/h according to BWF standard (13.4m length).
            </p>
          </div>
        </div>

        <Button
          size="lg"
          icon={ArrowRight}
          onClick={handleSaveAndAnalyze}
          loading={saving}
          className="shrink-0"
        >
          Confirm & Launch Analysis
        </Button>
      </div>
    </div>
  );
};

