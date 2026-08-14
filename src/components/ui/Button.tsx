import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'xs' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer'
    
    const variants = {
      default: 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-sm',
      destructive: 'bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 active:bg-rose-200 border border-rose-200/60',
      outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-xs',
      secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300',
      ghost: 'hover:bg-slate-100 hover:text-slate-900 text-slate-600',
      link: 'text-teal-600 underline-offset-4 hover:underline'
    }

    const sizes = {
      default: 'h-9 px-4 py-2 text-sm gap-1.5',
      sm: 'h-8 px-3 text-xs gap-1',
      xs: 'h-7 px-2.5 text-xs gap-1',
      lg: 'h-10 px-5 text-sm gap-2',
      icon: 'h-8 w-8'
    }

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
