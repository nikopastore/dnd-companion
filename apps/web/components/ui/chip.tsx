import type { HTMLAttributes } from "react";

type ChipVariant = "default" | "active" | "condition" | "success";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  icon?: string;
  removable?: boolean;
  onRemove?: () => void;
}

const variantClasses: Record<ChipVariant, string> = {
  default: "bg-surface-container-high/80 text-on-surface/70 border border-outline-variant/10 hover:bg-surface-container-highest hover:text-on-surface",
  active: "bg-primary-container/25 text-primary border border-primary/20 glow-crimson",
  condition: "bg-error-container/20 text-error border border-error/20",
  success: "bg-green-900/20 text-green-400 border border-green-500/20",
};

export function Chip({
  variant = "default",
  icon,
  removable,
  onRemove,
  className = "",
  children,
  ...props
}: ChipProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-3 py-1 rounded-xl
        font-label text-[10px] uppercase font-bold tracking-wider
        transition-all duration-300 ease-out
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {icon && (
        <span className="material-symbols-outlined text-[14px]">{icon}</span>
      )}
      {children}
      {removable && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          className="ml-0.5 hover:text-error transition-colors"
        >
          <span className="material-symbols-outlined text-[12px]">close</span>
        </button>
      )}
    </span>
  );
}
