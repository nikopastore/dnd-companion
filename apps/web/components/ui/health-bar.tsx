interface HealthBarProps {
  current: number;
  max: number;
  temp?: number;
  className?: string;
}

export function HealthBar({ current, max, temp = 0, className = "" }: HealthBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const tempPercentage = Math.min(100 - percentage, (temp / max) * 100);

  return (
    <div
      className={`h-3 w-full bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant/10 ${className}`}
    >
      <div className="h-full flex">
        {/* Current HP */}
        <div
          className="h-full bg-gradient-to-r from-primary-container to-primary relative transition-all duration-500"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 opacity-20 paper-texture" />
        </div>
        {/* Temp HP */}
        {temp > 0 && (
          <div
            className="h-full bg-secondary/40 relative transition-all duration-500"
            style={{ width: `${tempPercentage}%` }}
          />
        )}
      </div>
    </div>
  );
}
