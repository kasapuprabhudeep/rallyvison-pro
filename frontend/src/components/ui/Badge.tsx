import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'lime' | 'cyan' | 'amber' | 'rose' | 'slate' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'lime',
  size = 'md'
}) => {
  const variantStyles = {
    lime: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    slate: 'bg-slate-800 text-slate-300 border border-slate-700',
    outline: 'bg-transparent text-slate-400 border border-slate-700'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wider',
    md: 'text-xs px-2.5 py-1 font-medium'
  };

  return (
    <span className={`inline-flex items-center rounded-full transition-colors ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {children}
    </span>
  );
};

