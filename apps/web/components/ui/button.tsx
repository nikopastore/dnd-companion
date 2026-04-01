"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "gradient-crimson border border-secondary/30 text-on-primary-container font-semibold shadow-whisper hover:shadow-elevated hover:scale-[1.02] active:scale-[0.97] active:shadow-none",
  secondary:
    "bg-surface-container-highest text-on-surface border border-outline-variant/20 hover:bg-surface-bright hover:border-outline-variant/40 active:scale-[0.97]",
  ghost:
    "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 active:scale-[0.97]",
  danger:
    "bg-error-container/30 text-error border border-error/20 hover:bg-error-container/50 hover:border-error/40 active:scale-[0.97]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-xs gap-1.5",
  md: "px-6 py-2.5 text-sm gap-2",
  lg: "px-8 py-3.5 text-base gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center
          rounded-sm font-body
          transition-all duration-300 ease-out
          disabled:opacity-40 disabled:pointer-events-none disabled:scale-100
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary/50 focus-visible:outline-offset-2
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
