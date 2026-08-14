import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200/60 rounded-2xl shadow-xs max-w-md mx-auto ${className}`}>
      <div className="flex items-center justify-center w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl mb-4 border border-teal-100/50">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>
      <h3 className="font-display font-bold text-lg text-slate-800 mb-1.5">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs hover:shadow-md transition-all active:scale-[0.98] border-none rounded-xl"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
