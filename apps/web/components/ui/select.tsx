import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, icon, className = "", id, children, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/80 font-bold"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface/30 group-focus-within:text-secondary/70 transition-colors duration-300 pointer-events-none">
              {icon}
            </span>
          )}
          <select
            ref={ref}
            id={id}
            className={`
              w-full bg-surface-container-highest/80 rounded-sm
              ${icon ? "pl-10 pr-10" : "pl-4 pr-10"} py-3 font-body text-on-surface
              border border-outline-variant/10
              outline-none appearance-none
              focus:border-secondary/40 focus:bg-surface-container-highest
              focus:shadow-[0_0_0_1px_rgba(233,195,73,0.15)]
              transition-all duration-300
              cursor-pointer
              ${error ? "border-error/40 focus:border-error/60" : ""}
              ${className}
            `}
            {...props}
          >
            {children}
          </select>
          {/* Custom dropdown arrow */}
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface/30 pointer-events-none group-focus-within:text-secondary/70 transition-colors duration-300">
            expand_more
          </span>
          {/* Bottom accent on focus */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-secondary/0 group-focus-within:bg-secondary/30 transition-all duration-500" />
        </div>
        {error && (
          <p className="text-error text-xs font-body flex items-center gap-1 animate-fade-in">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
