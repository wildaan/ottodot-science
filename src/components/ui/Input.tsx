import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={`flex h-9 w-full rounded-xl border ${
            error 
              ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500' 
              : 'border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500'
          } bg-white px-3.5 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none shadow-2xs disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150 ${className}`}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"
