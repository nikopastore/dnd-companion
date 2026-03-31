import { getAbilityModifier, formatModifier } from "@dnd-companion/shared";

interface AttributeOrbProps {
  abbreviation: string;
  score: number;
  isPrimary?: boolean;
  onClick?: () => void;
}

export function AttributeOrb({
  abbreviation,
  score,
  isPrimary = false,
  onClick,
}: AttributeOrbProps) {
  const modifier = getAbilityModifier(score);

  return (
    <div
      className="flex flex-col items-center gap-2 group cursor-pointer"
      onClick={onClick}
    >
      <div
        className={`
          w-20 h-20 rounded-full flex flex-col items-center justify-center
          transition-transform group-active:scale-95
          ${
            isPrimary
              ? "bg-secondary-container/20 border-2 border-secondary glow-gold"
              : "bg-surface-container-highest border border-outline-variant/30"
          }
        `}
      >
        <span
          className={`font-label text-[10px] font-bold uppercase ${
            isPrimary ? "text-secondary" : "text-on-surface/50"
          }`}
        >
          {abbreviation}
        </span>
        <span className="font-headline text-2xl text-on-surface">{score}</span>
        <span
          className={`font-body text-xs font-bold ${
            isPrimary ? "text-secondary/70" : "text-on-surface/30"
          }`}
        >
          {formatModifier(modifier)}
        </span>
      </div>
    </div>
  );
}
