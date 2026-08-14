import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

export const Badge = ({ className = '', variant = 'default', ...props }: BadgeProps) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors'
  
  const variants = {
    default: 'bg-teal-50 text-teal-700 border border-teal-100/60',
    secondary: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    destructive: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    outline: 'text-slate-600 border border-slate-200 bg-white'
  }

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  )
}
Badge.displayName = "Badge"
