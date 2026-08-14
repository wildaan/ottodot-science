import * as React from "react"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, label, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
        <select
          className={`flex h-9 w-full rounded-xl border ${
            error 
              ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500' 
              : 'border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500'
          } bg-white px-3.5 py-1.5 text-sm text-slate-800 focus:outline-none shadow-2xs disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150 cursor-pointer ${className}`}
          ref={ref}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
      </div>
    )
  }
)
Select.displayName = "Select"
