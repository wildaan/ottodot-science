import * as React from 'react';
import { useTranslations } from 'next-intl';

export type BookingStatus = 'pending_payment' | 'confirmed' | 'payment_failed' | 'cancelled';

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

const statusConfig: Record<
  BookingStatus,
  { bgClass: string; textClass: string; dotClass: string }
> = {
  pending_payment: {
    bgClass: 'bg-amber-50 border-amber-200',
    textClass: 'text-amber-800',
    dotClass: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  },
  confirmed: {
    bgClass: 'bg-emerald-50 border-emerald-200',
    textClass: 'text-emerald-800',
    dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  },
  payment_failed: {
    bgClass: 'bg-rose-50 border-rose-200',
    textClass: 'text-rose-800',
    dotClass: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
  },
  cancelled: {
    bgClass: 'bg-slate-100 border-slate-200',
    textClass: 'text-slate-600',
    dotClass: 'bg-slate-400',
  },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const t = useTranslations('Status');
  const config = statusConfig[status] || {
    bgClass: 'bg-slate-50 border-slate-200',
    textClass: 'text-slate-700',
    dotClass: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bgClass} ${config.textClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      <span>{t(status) || status}</span>
    </span>
  );
}
