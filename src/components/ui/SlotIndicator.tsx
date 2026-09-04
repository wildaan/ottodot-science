import * as React from 'react';

interface SlotIndicatorProps {
  filled: number;
  total: number;
  mode?: 'left' | 'filled';
  className?: string;
  label?: React.ReactNode;
}

export function SlotIndicator({ filled, total, mode = 'left', className = '', label }: SlotIndicatorProps) {
  const percentage = Math.min(100, Math.max(0, (filled / total) * 100));
  const remaining = Math.max(0, total - filled);

  // Styling based on capacity
  let progressColor = 'bg-teal-500';
  let textColor = 'text-slate-600';

  if (remaining === 0) {
    progressColor = 'bg-rose-500';
    textColor = 'text-rose-600 font-semibold';
  } else if (remaining === 1) {
    progressColor = 'bg-amber-500';
    textColor = 'text-amber-600 font-semibold';
  }

  const defaultText =
    mode === 'left'
      ? remaining === 0
        ? 'Class Full'
        : `${remaining} of ${total} slots remaining`
      : `${filled} of ${total} slots filled`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between items-center text-xs">
        <span className={`${textColor}`}>
          {label ?? defaultText}
        </span>
        <span className="text-slate-400 font-medium">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
