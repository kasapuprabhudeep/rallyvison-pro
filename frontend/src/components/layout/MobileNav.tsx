import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Upload, History, Bot, User } from 'lucide-react';
import { ShuttlecockIcon } from '../icons/BadmintonIcons';

export const MobileNav: React.FC = () => {
  const items = [
    { to: '/dashboard', label: 'Match Center', icon: LayoutDashboard },
    { to: '/history', label: 'Archive', icon: History },
    { to: '/upload', label: 'Analyze', icon: Upload, highlight: true },
    { to: '/coach', label: 'AI Coach', icon: Bot },
    { to: '/profile', label: 'Passport', icon: User }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080d1a]/95 backdrop-blur-lg border-t border-cyan-500/20 px-3 py-2 flex items-center justify-around shadow-2xl">
      {items.map((item) => {
        const Icon = item.icon;
        if (item.highlight) {
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center -translate-y-3"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 border-4 border-[#080d1a] transition-transform active:scale-95">
                <ShuttlecockIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] font-extrabold text-cyan-400 mt-0.5">
                {item.label}
              </span>
            </NavLink>
          );
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
                isActive ? 'text-cyan-400 font-extrabold' : 'text-slate-400 hover:text-cyan-200'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
