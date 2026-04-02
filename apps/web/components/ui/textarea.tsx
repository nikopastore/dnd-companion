import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
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
          <textarea
            ref={ref}
            id={id}
            className={`
              w-full bg-surface-container-highest/80 rounded-sm
              px-4 py-3 font-body text-on-surface
              placeholder:text-on-surface/25
              border border-outline-variant/10
              outline-none resize-none
              focus:border-secondary/40 focus:bg-surface-container-highest
              focus:shadow-[0_0_0_1px_rgba(233,195,73,0.15)]
              transition-all duration-300
              min-h-[80px]
              ${error ? "border-error/40 focus:border-error/60" : ""}
              ${className}
            `}
            {...props}
          />
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

Textarea.displayName = "Textarea";
