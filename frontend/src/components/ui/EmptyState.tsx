import React from 'react';
import { LucideIcon, Video, PlusCircle } from 'lucide-react';
import { Button } from './Button';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Video,
  actionLabel = 'Upload Match Recording',
  actionHref = '/upload',
  onAction
}) => {
  return (
    <div className="bg-[#0f172a] border border-dashed border-[#1e293b] rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      
      {actionHref ? (
        <Link to={actionHref}>
          <Button icon={PlusCircle}>{actionLabel}</Button>
        </Link>
      ) : onAction ? (
        <Button icon={PlusCircle} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};

