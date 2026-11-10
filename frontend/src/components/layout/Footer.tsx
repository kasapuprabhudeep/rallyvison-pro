import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Activity, Globe, Heart } from 'lucide-react';
import { CrossedRacketsLogoIcon, CourtDimensionsIcon } from '../icons/BadmintonIcons';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-cyan-500/20 bg-[#060a18]/95 backdrop-blur-2xl text-slate-400 text-xs py-10 px-4 sm:px-8 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Platform Brand & Crest */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-950 via-[#0a1638] to-[#0d2254] border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <CrossedRacketsLogoIcon className="w-7 h-7" glow={false} />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-white flex items-center gap-2">
                  RallyVision <span className="text-cyan-300 font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 uppercase tracking-widest font-black">PRO</span>
                </span>
                <span className="text-[11px] text-cyan-300/80 font-medium block">
                  International BWF Court Video Telemetry & Kinematics Engine
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-md mt-1">
              Engineered for elite badminton academies, tournament circuits, club players, and performance biomechanists worldwide. Calibrated against BWF Law 1 (Court & Equipment) and Law 3 (Shuttlecock Speed & Testing) specifications.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-cyan-300">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0a122c] border border-cyan-500/25">
                <CourtDimensionsIcon className="w-3.5 h-3.5 text-cyan-400" />
                13.4m × 6.1m Matrix
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0a122c] border border-cyan-500/25">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                256-Bit Telemetry Encryption
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0a122c] border border-emerald-500/30 text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Antivirus Sentinel: Active (Auto-Purge)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0a122c] border border-cyan-500/25">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Version 2.4.0 (Build 2026.11)
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Court Solutions</h4>
            <Link to="/dashboard" className="hover:text-cyan-300 transition-colors">Match Center Hub</Link>
            <Link to="/upload" className="hover:text-cyan-300 transition-colors">Match Recording & Upload</Link>
            <Link to="/history" className="hover:text-cyan-300 transition-colors">Tournament Archive</Link>
            <Link to="/compare" className="hover:text-cyan-300 transition-colors">Head-to-Head Compare</Link>
            <Link to="/reports" className="hover:text-cyan-300 transition-colors">PDF Match Dossiers</Link>
          </div>

          {/* Col 3: Compliance & Legal */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Compliance & System</h4>
            <Link to="/privacy" className="hover:text-cyan-300 transition-colors">Privacy Charter & GDPR</Link>
            <Link to="/settings" className="hover:text-cyan-300 transition-colors">Court Matrix Calibration</Link>
            <span className="text-slate-500">Enterprise Club Licensing</span>
            <span className="text-slate-500">High-Speed Sensor Pipeline</span>
            <span className="text-slate-500">BWF Rules Compliance</span>
          </div>
        </div>

        {/* Bottom Bar with Copyright */}
        <div className="pt-6 border-t border-cyan-500/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © 2026 RallyVision Sports Technologies, Inc. All rights reserved. Commercial Sports Performance Software.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Global Deployment Node
            </span>
            <span>•</span>
            <span className="text-cyan-400 font-mono font-bold">RELEASE v2.4.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

