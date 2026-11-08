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
  color = 'lime'
}) => {
  const colorStyles = {
    lime: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    cyan: 'text-teal-300 bg-teal-500/15 border-teal-500/30',
    amber: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    rose: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
    slate: 'text-slate-300 bg-slate-500/15 border-slate-500/30',
  };

  return (
    <div className="bg-[#052820] border border-emerald-500/25 hover:border-emerald-400/50 rounded-2xl p-5 shadow-xl group smooth-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200/70">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${colorStyles[color]} shadow-sm group-hover:scale-105 transition-transform`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">{value}</span>
        {trend && (
          <span className={`text-xs font-bold ${trendPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-emerald-100/60 leading-snug">{subtitle}</p>}
    </div>
  );
};
