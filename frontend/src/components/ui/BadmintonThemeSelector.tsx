import React, { useState } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useBadmintonTheme, BadmintonTheme } from '../../context/ThemeContext';
import { CrossedRacketsLogoIcon } from '../icons/BadmintonIcons';

export const BadmintonThemeSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, setTheme, themeName } = useBadmintonTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { id: BadmintonTheme; name: string; tag: string; courtColor: string; accentColor: string; description: string }[] = [
    {
      id: 'emerald',
      name: 'Midnight Cobalt & Cyan',
      tag: 'Grand Prix Tournament',
      courtColor: '#0a1738',
      accentColor: '#00f0ff',
      description: 'Mesmerizing midnight cobalt with electric cyan spotlights and shuttlecock gold accents.'
    },
    {
      id: 'cyber',
      name: 'Cyber Hawk-Eye Laser',
      tag: 'High-Speed Telemetry',
      courtColor: '#071024',
      accentColor: '#38bdf8',
      description: 'High-contrast broadcast telemetry with vibrant neon cyan and royal indigo tracking paths.'
    },
    {
      id: 'arena',
      name: 'Tokyo Championship Gold',
      tag: 'Imperial Arena',
      courtColor: '#0d163a',
      accentColor: '#fbbf24',
      description: 'Olympic court navy with gold championship crest and high-clarity court boundaries.'
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300 text-xs font-bold transition-all shadow-sm active:scale-95"
        title="Change Badminton Visual Theme"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-500/30 animate-pulse" />
        <CrossedRacketsLogoIcon className="w-3.5 h-3.5" glow={false} />
        {!compact && (
          <span className="hidden sm:inline font-mono tracking-tight">Theme: {themeName}</span>
        )}
        <Palette className="w-3.5 h-3.5 text-cyan-400 opacity-80" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#070d22] border border-cyan-500/30 shadow-2xl p-3 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/20 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Badminton Arena Themes
              </span>
              <span className="text-[10px] text-slate-400 font-mono">3 Variations</span>
            </div>

            <div className="flex flex-col gap-2">
              {themes.map((t) => {
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-start gap-3 p-2.5 rounded-xl text-left transition-all border ${
                      isActive
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                        : 'bg-[#091129]/60 border-transparent hover:border-cyan-500/20 text-slate-300 hover:bg-cyan-500/10'
                    }`}
                  >
                    {/* Visual Color Swatch */}
                    <div
                      className="w-8 h-8 rounded-lg shrink-0 border border-white/20 flex items-center justify-center shadow-inner mt-0.5"
                      style={{ backgroundColor: t.courtColor }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.accentColor }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white tracking-tight">{t.name}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </div>
                      <span className="inline-block text-[10px] font-mono text-cyan-400/90 font-medium">
                        {t.tag}
                      </span>
                      <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

