import type { HTMLAttributes } from "react";

type ChipVariant = "default" | "active" | "condition";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  icon?: string;
}

const variantClasses: Record<ChipVariant, string> = {
  default: "bg-surface-container-high text-on-surface",
  active: "bg-primary-container/20 text-primary",
  condition: "bg-error-container/20 text-error",
};

export function Chip({
  variant = "default",
  icon,
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
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {icon && (
        <span className="material-symbols-outlined text-[14px]">{icon}</span>
      )}
      {children}
    </span>
  );
}
