interface HealthBarProps {
  current: number;
  max: number;
  temp?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function HealthBar({
  current,
  max,
  temp = 0,
  size = "md",
  showLabel = false,
  className = "",
}: HealthBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const tempPercentage = Math.min(100 - percentage, (temp / max) * 100);
  const isLow = percentage < 25;
  const isCritical = percentage < 10;

  const heightClass = { sm: "h-1.5", md: "h-3", lg: "h-4" }[size];

  return (
    <div className={className}>
      <div
        className={`${heightClass} w-full bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant/10 relative`}
      >
        <div className="h-full flex">
          {/* Current HP */}
          <div
            className={`h-full relative transition-all duration-700 ease-out ${
              isCritical
                ? "bg-gradient-to-r from-error-container to-error animate-pulse-danger"
                : isLow
                  ? "bg-gradient-to-r from-error-container to-primary"
                  : "bg-gradient-to-r from-primary-container to-primary"
            }`}
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 opacity-20 paper-texture" />
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
          </div>
          {/* Temp HP */}
          {temp > 0 && (
            <div
              className="h-full bg-secondary/30 relative transition-all duration-500"
              style={{ width: `${tempPercentage}%` }}
            >
              <div className="absolute inset-0 animate-shimmer" />
            </div>
          )}
        </div>
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1.5 font-label text-xs">
          <span className="text-on-surface/50">Hit Points</span>
          <span className={`font-bold ${isLow ? "text-error" : "text-primary"}`}>
            {current} / {max}
            {temp > 0 && <span className="text-secondary ml-1">(+{temp})</span>}
          </span>
        </div>
      )}
    </div>
  );
}
