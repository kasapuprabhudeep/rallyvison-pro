import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  History,
  GitCompare,
  FileText,
  User,
  Settings,
  ShieldCheck,
  Zap,
  Target,
  Bot,
  Sparkles
} from 'lucide-react';
import { ShuttlecockIcon, BadmintonRacketIcon, CourtDimensionsIcon, CrossedRacketsLogoIcon } from '../icons/BadmintonIcons';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Match Center', icon: LayoutDashboard },
    { to: '/coach', label: 'AI Tactical Coach', icon: Bot, badge: 'AI' },
    { to: '/upload', label: 'Upload Match', icon: Upload },
    { to: '/history', label: 'Match Archive', icon: History },
    { to: '/compare', label: 'Head-to-Head Compare', icon: GitCompare },
    { to: '/reports', label: 'Tactical PDF Reports', icon: FileText },
    { to: '/profile', label: 'Player Passport', icon: User },
    { to: '/settings', label: 'Court Settings', icon: Settings },
    { to: '/privacy', label: 'Privacy & Security', icon: ShieldCheck }
  ];

  return (
    <aside className="w-64 border-r border-cyan-500/20 bg-[#070b1a]/95 backdrop-blur-2xl hidden md:flex flex-col justify-between py-6 px-4 shrink-0 min-h-[calc(100vh-4rem)] badminton-string-pattern">
      <div className="flex flex-col gap-1.5">
        <div className="px-3 pb-3 text-[11px] font-extrabold uppercase tracking-widest text-cyan-400/80 flex items-center justify-between">
          <span>Court Navigation</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-400/40 font-bold shadow-lg shadow-cyan-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 text-cyan-400/90" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Pro Badminton Telemetry Badge with Crossed Rackets Emblem */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#0d1738] to-[#070e24] border border-cyan-500/30 text-xs shadow-2xl relative overflow-hidden">
        <div className="absolute -right-3 -bottom-3 opacity-15 pointer-events-none">
          <CrossedRacketsLogoIcon size={85} glow={false} />
        </div>
        
        <div className="flex items-center gap-2 text-cyan-300 font-extrabold mb-1.5">
          <CourtDimensionsIcon className="w-4 h-4 text-cyan-400" />
          <span>BWF 13.4m Court Matrix</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Calibrated 4-point perspective homography for singles & doubles tracking.
        </p>
        <div className="mt-2.5 pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold">
          <span>HAWK-EYE 2D REPLAY</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
        </div>
      </div>
    </aside>
  );
};
