import type { HTMLAttributes } from "react";

type CardVariant = "default" | "recessed" | "interactive" | "accent";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  withTexture?: boolean;
  accentColor?: "primary" | "secondary" | "error";
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-surface-container-low border border-outline-variant/8",
  recessed: "bg-surface-container-lowest border border-outline-variant/5",
  interactive:
    "bg-surface-container-low border border-transparent hover:border-secondary/20 hover:bg-surface-container transition-all duration-500 cursor-pointer interactive-lift",
  accent: "bg-surface-container-low border-l-2",
};

const accentClasses: Record<string, string> = {
  primary: "border-l-primary/40",
  secondary: "border-l-secondary/40",
  error: "border-l-error/40",
};

export function Card({
  variant = "default",
  withTexture = false,
  accentColor,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-sm overflow-hidden
        ${variantClasses[variant]}
        ${variant === "accent" && accentColor ? accentClasses[accentColor] : ""}
        ${withTexture ? "paper-texture" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
