import type { HTMLAttributes } from "react";

type CardVariant = "default" | "recessed" | "interactive";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  withTexture?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-surface-container-low",
  recessed: "bg-surface-container-lowest",
  interactive:
    "bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer",
};

export function Card({
  variant = "default",
  withTexture = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-sm overflow-hidden
        ${variantClasses[variant]}
        ${withTexture ? "paper-texture" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
