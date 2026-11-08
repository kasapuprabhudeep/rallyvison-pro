import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Video,
  Bell,
  Palette,
  HardDrive,
  CheckCircle2,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const [videoQuality, setVideoQuality] = useState('720p');
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Application Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure video analysis sampling rate, interface notifications, and storage defaults
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 flex flex-col gap-6">
        {/* Video Processing Settings */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-3">
            <Video className="w-4 h-4 text-emerald-400" />
            <span>Video Processing & Sampling</span>
          </h3>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-white block">Auto-Start Analysis</span>
                <span className="text-[11px] text-slate-400">Launch background job immediately after court confirmation</span>
              </div>
              <input
                type="checkbox"
                checked={autoAnalyze}
                onChange={(e) => setAutoAnalyze(e.target.checked)}
                className="w-4 h-4 accent-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-white block">Processing Resolution</span>
                <span className="text-[11px] text-slate-400">Higher resolution increases landmark precision on shuttlecock</span>
              </div>
              <select
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value)}
                className="px-3 py-1.5 bg-[#080d1a] border border-slate-700 rounded-lg text-xs text-white"
              >
                <option value="480p">480p (Fastest)</option>
                <option value="720p">720p (Balanced)</option>
                <option value="1080p">1080p (Maximum Precision)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audio / Interface */}
        <div className="pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-cyan-400" />
            <span>Interface Audio & Alerts</span>
          </h3>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-white block">Audio Feedback on Shot Classification</span>
              <span className="text-[11px] text-slate-400">Subtle click sound when video playback crosses a hit event</span>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
          </div>
        </div>

        {/* Account Data & Privacy Governance Link */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-0.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Data Privacy & Security Controls</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Manage account privacy, video auto-purge periods, data export, and purge rights.
            </p>
          </div>
          <Link
            to="/privacy"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white border border-slate-700 transition-colors"
          >
            <span>Open Privacy Hub</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        <Button onClick={handleSave} className="self-end mt-2">
          Save Settings
        </Button>
      </div>
    </div>
  );
};

