"use client";

import { getAbilityModifier, formatModifier } from "@dnd-companion/shared";

interface AttributeOrbProps {
  abbreviation: string;
  score: number;
  isPrimary?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function AttributeOrb({
  abbreviation,
  score,
  isPrimary = false,
  size = "md",
  onClick,
}: AttributeOrbProps) {
  const modifier = getAbilityModifier(score);

  const sizeClasses = {
    sm: "w-14 h-14",
    md: "w-20 h-20",
    lg: "w-24 h-24",
  }[size];

  const scoreSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  }[size];

  return (
    <div
      className="flex flex-col items-center gap-2 group cursor-pointer"
      onClick={onClick}
    >
      <div
        className={`
          ${sizeClasses} rounded-full flex flex-col items-center justify-center
          transition-all duration-500 ease-out
          group-hover:scale-110 group-active:scale-95
          ${
            isPrimary
              ? "bg-secondary-container/15 border-2 border-secondary/60 animate-pulse-glow"
              : "bg-surface-container-highest border border-outline-variant/25 group-hover:border-secondary/30 group-hover:bg-surface-container-high"
          }
        `}
      >
        <span
          className={`font-label text-[10px] font-bold uppercase tracking-wider ${
            isPrimary ? "text-secondary" : "text-on-surface/40 group-hover:text-secondary/70"
          } transition-colors duration-300`}
        >
          {abbreviation}
        </span>
        <span className={`font-headline ${scoreSizes} text-on-surface leading-none`}>
          {score}
        </span>
        <span
          className={`font-body text-xs font-bold ${
            isPrimary ? "text-secondary/80" : "text-on-surface/25 group-hover:text-on-surface/50"
          } transition-colors duration-300`}
        >
          {formatModifier(modifier)}
        </span>
      </div>
    </div>
  );
}
