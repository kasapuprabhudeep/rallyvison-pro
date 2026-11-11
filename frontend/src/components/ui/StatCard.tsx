import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  trend?: string;
  trendPositive?: boolean;
  color?: 'lime' | 'cyan' | 'amber' | 'rose' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  color = 'cyan'
}) => {
  const colorStyles = {
    lime: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
    cyan: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
    amber: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    rose: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
    slate: 'text-slate-300 bg-slate-500/15 border-slate-500/30',
  };

  return (
    <div className="glass-panel bg-[#091129]/85 border border-cyan-500/20 hover:border-cyan-400/40 rounded-2xl p-5 shadow-xl group smooth-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${colorStyles[color]} shadow-sm group-hover:scale-105 transition-transform`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">{value}</span>
        {trend && (
          <span className={`text-xs font-bold ${trendPositive ? 'text-cyan-400' : 'text-rose-400'}`}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-400 leading-snug">{subtitle}</p>}
    </div>
  );
};
