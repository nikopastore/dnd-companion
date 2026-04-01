"use client";

import { CONDITIONS, type ConditionKey } from "@dnd-companion/shared";
import { Icon } from "@/components/ui/icon";

interface Props {
  activeConditions: ConditionKey[];
  deathSaveSuccesses: number;
  deathSaveFailures: number;
  exhaustionLevel: number;
  onToggleCondition: (condition: ConditionKey) => void;
  onUpdate: (field: string, value: number) => void;
}

const EXHAUSTION_COLORS = [
  "", // level 0 — unused
  "bg-yellow-700/40 text-yellow-400 border-yellow-500/30",
  "bg-orange-700/40 text-orange-400 border-orange-500/30",
  "bg-orange-800/50 text-orange-300 border-orange-400/30",
  "bg-red-800/50 text-red-300 border-red-400/30",
  "bg-red-900/60 text-red-200 border-red-300/30",
  "bg-error text-on-error border-error glow-danger",
];

const EXHAUSTION_INACTIVE = "bg-surface-container-highest text-on-surface/30 border-outline-variant/10 hover:bg-surface-container-high hover:text-on-surface/50";

export function ConditionManager({
  activeConditions,
  deathSaveSuccesses,
  deathSaveFailures,
  exhaustionLevel,
  onToggleCondition,
  onUpdate,
}: Props) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Death Saves */}
      <div className="bg-surface-container-low p-6 rounded-sm shadow-whisper relative overflow-hidden">
        <div className="decorative-orb w-40 h-40 -bottom-16 left-1/2 -translate-x-1/2" style={{ background: "#a52a2a" }} />
        <span className="font-headline text-secondary uppercase tracking-widest text-xs block mb-5 relative z-10">
          Death Saves
        </span>
        <div className="flex justify-center gap-12 relative z-10">
          {/* Successes */}
          <div className="text-center">
            <span className="font-label text-[10px] text-green-400 uppercase block mb-3 tracking-wider">
              Successes
            </span>
            <div className="flex gap-3">
              {[0, 1, 2].map((i) => {
                const filled = i < deathSaveSuccesses;
                return (
                  <button
                    key={i}
                    onClick={() => onUpdate("deathSaveSuccesses", i < deathSaveSuccesses ? i : i + 1)}
                    aria-label={`Death save success ${i + 1}${i < deathSaveSuccesses ? ", filled" : ", empty"}`}
                    className={`min-w-[44px] min-h-[44px] w-9 h-9 rounded-full border-2 transition-all duration-300 ${
                      filled
                        ? "bg-green-400 border-green-400 shadow-[0_0_12px_rgba(74,222,128,0.5)] scale-110"
                        : "border-green-400/30 hover:border-green-400/60 hover:shadow-[0_0_8px_rgba(74,222,128,0.2)]"
                    }`}
                  >
                    {filled && (
                      <Icon name="check" size={18} className="text-green-950 animate-scale-in" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vertical divider */}
          <div className="w-px bg-outline-variant/20 self-stretch" />

          {/* Failures */}
          <div className="text-center">
            <span className="font-label text-[10px] text-error uppercase block mb-3 tracking-wider">
              Failures
            </span>
            <div className="flex gap-3">
              {[0, 1, 2].map((i) => {
                const filled = i < deathSaveFailures;
                return (
                  <button
                    key={i}
                    onClick={() => onUpdate("deathSaveFailures", i < deathSaveFailures ? i : i + 1)}
                    aria-label={`Death save failure ${i + 1}${i < deathSaveFailures ? ", filled" : ", empty"}`}
                    className={`min-w-[44px] min-h-[44px] w-9 h-9 rounded-full border-2 transition-all duration-300 ${
                      filled
                        ? "bg-error border-error shadow-[0_0_12px_rgba(255,77,77,0.5)] scale-110"
                        : "border-error/30 hover:border-error/60 hover:shadow-[0_0_8px_rgba(255,77,77,0.2)]"
                    }`}
                  >
                    {filled && (
                      <Icon name="close" size={18} className="text-red-950 animate-scale-in" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3 successes = stabilized, 3 failures = dead */}
        {deathSaveSuccesses >= 3 && (
          <p className="font-label text-xs text-green-400 text-center mt-4 animate-scale-in relative z-10">
            <Icon name="favorite" size={14} filled className="inline mr-1 align-text-bottom" />
            Stabilized
          </p>
        )}
        {deathSaveFailures >= 3 && (
          <p className="font-label text-xs text-error text-center mt-4 animate-scale-in glow-danger relative z-10">
            <Icon name="skull" size={14} className="inline mr-1 align-text-bottom" />
            Dead
          </p>
        )}
      </div>

      {/* Exhaustion */}
      <div className="bg-surface-container-low p-6 rounded-sm shadow-whisper">
        <div className="flex items-center justify-between mb-5">
          <span className="font-headline text-secondary uppercase tracking-widest text-xs">
            Exhaustion
          </span>
          {exhaustionLevel > 0 && (
            <span className="font-label text-[10px] text-error/70 uppercase tracking-wider animate-fade-in">
              Level {exhaustionLevel}/6
            </span>
          )}
        </div>

        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5, 6].map((level) => {
            const isActive = level <= exhaustionLevel;
            return (
              <button
                key={level}
                onClick={() => onUpdate("exhaustionLevel", exhaustionLevel === level ? level - 1 : level)}
                aria-label={`Exhaustion level ${level}${level <= exhaustionLevel ? ", active" : ""}`}
                className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-sm flex items-center justify-center font-headline text-lg border transition-all duration-300 interactive-lift ${
                  isActive
                    ? EXHAUSTION_COLORS[level]
                    : EXHAUSTION_INACTIVE
                }`}
                title={level === 6 ? "Death" : `Level ${level}: -${level * 2} to d20 rolls, -${level * 5}ft speed`}
              >
                {level === 6 && isActive ? (
                  <Icon name="skull" size={18} className="animate-scale-in" />
                ) : (
                  level
                )}
              </button>
            );
          })}
        </div>

        {/* Exhaustion effect description */}
        {exhaustionLevel > 0 && (
          <div className="mt-3 animate-fade-in">
            <div className="h-1 rounded-full overflow-hidden bg-surface-container-highest">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 transition-all duration-700 ease-out"
                style={{ width: `${(exhaustionLevel / 6) * 100}%` }}
              />
            </div>
            <p className="font-body text-xs text-error/70 text-center mt-2">
              {exhaustionLevel === 6
                ? "DEATH"
                : `Penalty: -${exhaustionLevel * 2} to d20 rolls, -${exhaustionLevel * 5}ft speed`}
            </p>
          </div>
        )}
      </div>

      {/* Conditions */}
      <div className="bg-surface-container-low p-6 rounded-sm shadow-whisper">
        <span className="font-headline text-secondary uppercase tracking-widest text-xs block mb-5">
          Conditions
        </span>

        {/* Active conditions shown first */}
        {activeConditions.length > 0 && (
          <div className="mb-4">
            <span className="font-label text-[9px] text-error/50 uppercase tracking-widest block mb-2">Active</span>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CONDITIONS) as [ConditionKey, typeof CONDITIONS[ConditionKey]][])
                .filter(([key]) => key !== "EXHAUSTION" && activeConditions.includes(key))
                .map(([key, cond]) => (
                  <button
                    key={key}
                    onClick={() => onToggleCondition(key)}
                    title={cond.description}
                    className="animate-scale-in inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label text-[10px] uppercase font-bold tracking-wider transition-all duration-300 bg-error-container/30 text-error border border-error/30 interactive-glow glow-crimson hover:bg-error-container/50"
                  >
                    <Icon name={cond.icon} size={14} filled />
                    {cond.name}
                    <Icon name="close" size={10} className="ml-0.5 opacity-50" />
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Inactive conditions */}
        <div>
          {activeConditions.length > 0 && (
            <span className="font-label text-[9px] text-on-surface/30 uppercase tracking-widest block mb-2">Available</span>
          )}
          <div className="flex flex-wrap gap-2">
            {(Object.entries(CONDITIONS) as [ConditionKey, typeof CONDITIONS[ConditionKey]][]).map(
              ([key, cond]) => {
                if (key === "EXHAUSTION") return null; // Handled above
                const isActive = activeConditions.includes(key);
                if (isActive) return null; // Shown in active group
                return (
                  <button
                    key={key}
                    onClick={() => onToggleCondition(key)}
                    title={cond.description}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label text-[10px] uppercase font-bold tracking-wider transition-all duration-300 bg-surface-container-high text-on-surface/50 border border-transparent hover:text-on-surface hover:bg-surface-container-highest hover:border-outline-variant/20 interactive-glow"
                  >
                    <Icon name={cond.icon} size={14} />
                    {cond.name}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
