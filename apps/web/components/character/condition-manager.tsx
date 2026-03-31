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

export function ConditionManager({
  activeConditions,
  deathSaveSuccesses,
  deathSaveFailures,
  exhaustionLevel,
  onToggleCondition,
  onUpdate,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Death Saves */}
      <div className="bg-surface-container-low p-6 rounded-sm">
        <span className="font-headline text-secondary uppercase tracking-widest text-xs block mb-4">
          Death Saves
        </span>
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <span className="font-label text-[10px] text-green-400 uppercase block mb-2">Successes</span>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => onUpdate("deathSaveSuccesses", i < deathSaveSuccesses ? i : i + 1)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    i < deathSaveSuccesses
                      ? "bg-green-400 border-green-400"
                      : "border-green-400/30 hover:border-green-400/60"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-center">
            <span className="font-label text-[10px] text-error uppercase block mb-2">Failures</span>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => onUpdate("deathSaveFailures", i < deathSaveFailures ? i : i + 1)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    i < deathSaveFailures
                      ? "bg-error border-error"
                      : "border-error/30 hover:border-error/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Exhaustion */}
      <div className="bg-surface-container-low p-6 rounded-sm">
        <span className="font-headline text-secondary uppercase tracking-widest text-xs block mb-4">
          Exhaustion
        </span>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <button
              key={level}
              onClick={() => onUpdate("exhaustionLevel", exhaustionLevel === level ? level - 1 : level)}
              className={`w-10 h-10 rounded-sm flex items-center justify-center font-headline text-lg transition-all ${
                level <= exhaustionLevel
                  ? level === 6
                    ? "bg-error text-on-error"
                    : "bg-error-container/40 text-error"
                  : "bg-surface-container-highest text-on-surface/30 hover:bg-surface-container-high"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        {exhaustionLevel > 0 && (
          <p className="font-body text-xs text-error/70 text-center mt-2">
            {exhaustionLevel === 6
              ? "DEATH"
              : `−${exhaustionLevel * 2} to d20 rolls, −${exhaustionLevel * 5}ft speed`}
          </p>
        )}
      </div>

      {/* Conditions */}
      <div className="bg-surface-container-low p-6 rounded-sm">
        <span className="font-headline text-secondary uppercase tracking-widest text-xs block mb-4">
          Conditions
        </span>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(CONDITIONS) as [ConditionKey, typeof CONDITIONS[ConditionKey]][]).map(
            ([key, cond]) => {
              if (key === "EXHAUSTION") return null; // Handled above
              const isActive = activeConditions.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => onToggleCondition(key)}
                  title={cond.description}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label text-[10px] uppercase font-bold tracking-wider transition-all ${
                    isActive
                      ? "bg-error-container/30 text-error border border-error/30"
                      : "bg-surface-container-high text-on-surface/50 hover:text-on-surface hover:bg-surface-container-highest"
                  }`}
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
  );
}
