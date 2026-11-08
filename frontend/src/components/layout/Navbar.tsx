import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Camera, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { LiveMatchRecorder } from '../video/LiveMatchRecorder';
import { CrossedRacketsLogoIcon } from '../icons/BadmintonIcons';
import { BadmintonThemeSelector } from '../ui/BadmintonThemeSelector';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showRecorder, setShowRecorder] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-cyan-500/20 bg-[#070b1a]/90 backdrop-blur-2xl sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between shadow-2xl shadow-indigo-950/40">
        {/* Brand Logo with Crossed Badminton Rackets Championship Crest */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-950 via-[#0a1638] to-[#0d2254] border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-all">
            <CrossedRacketsLogoIcon className="w-8 h-8" glow={true} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
              RallyVision <span className="text-cyan-300 font-mono text-[11px] px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 uppercase tracking-widest font-black">PRO</span>
            </span>
            <span className="text-[10px] text-cyan-300/80 font-medium hidden sm:block tracking-wide">
              BWF Court Intelligence & Trajectory Platform
            </span>
          </div>
        </Link>

        {/* Right Actions & Badminton Theme Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <BadmintonThemeSelector />

          {user ? (
            <>
              {/* Quick Live Camera Match Recording button */}
              <button
                onClick={() => setShowRecorder(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
                title="Record live court footage directly with phone or laptop camera"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Record Match</span>
              </button>

              <Link to="/upload" className="hidden md:inline-flex">
                <Button size="sm" icon={Plus} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20">
                  Upload Match
                </Button>
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/25 hover:border-cyan-400/40 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold border border-cyan-400/30">
                  {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-medium text-slate-200 hidden lg:inline">
                  {user.full_name}
                </span>
              </Link>

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                title="Sign Out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-500/25">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Live In-App Match Camera Recorder Modal */}
      {showRecorder && (
        <LiveMatchRecorder onClose={() => setShowRecorder(false)} />
      )}
    </>
  );
};
