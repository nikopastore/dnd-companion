import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = "", id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="font-label text-xs uppercase tracking-widest text-on-surface-variant"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            w-full bg-surface-container-highest rounded-sm
            px-4 py-3 font-body text-on-surface
            placeholder:text-on-surface/30
            border-0 outline-none
            focus:ring-1 focus:ring-secondary/40
            transition-all duration-300
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
