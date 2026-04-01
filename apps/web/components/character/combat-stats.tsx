"use client";

import { useState, useEffect, useRef } from "react";
import { HealthBar } from "@/components/ui/health-bar";
import { Icon } from "@/components/ui/icon";

interface Props {
  currentHP: number;
  maxHP: number;
  tempHP: number;
  armorClass: number;
  initiative: number;
  speed: number;
  onUpdate: (field: string, value: number) => void;
}

export function CombatStats({ currentHP, maxHP, tempHP, armorClass, initiative, speed, onUpdate }: Props) {
  const [hpDelta, setHpDelta] = useState("");
  const [hpAnimKey, setHpAnimKey] = useState(0);
  const prevHP = useRef(currentHP);

  // Trigger count-up animation when HP changes
  useEffect(() => {
    if (prevHP.current !== currentHP) {
      setHpAnimKey((k) => k + 1);
      prevHP.current = currentHP;
    }
  }, [currentHP]);

  function applyDamage() {
    const val = parseInt(hpDelta);
    if (!val || val <= 0) return;
    // Damage hits temp HP first
    let remaining = val;
    let newTemp = tempHP;
    if (newTemp > 0) {
      const absorbed = Math.min(newTemp, remaining);
      newTemp -= absorbed;
      remaining -= absorbed;
      onUpdate("tempHP", newTemp);
    }
    onUpdate("currentHP", Math.max(0, currentHP - remaining));
    setHpDelta("");
  }

  function applyHeal() {
    const val = parseInt(hpDelta);
    if (!val || val <= 0) return;
    onUpdate("currentHP", Math.min(maxHP, currentHP + val));
    setHpDelta("");
  }

  function addTempHP() {
    const val = parseInt(hpDelta);
    if (!val || val <= 0) return;
    onUpdate("tempHP", Math.max(tempHP, val)); // Temp HP doesn't stack — take higher
    setHpDelta("");
  }

  const hpPercent = maxHP > 0 ? currentHP / maxHP : 0;
  const isLow = hpPercent < 0.25;
  const isCritical = hpPercent < 0.1;

  return (
    <section className="grid grid-cols-12 gap-4 animate-fade-in-up">
      {/* Vitality */}
      <div className="col-span-12 md:col-span-6 bg-surface-container-low paper-texture p-6 rounded-sm relative overflow-hidden shadow-whisper">
        {/* Decorative orb behind vitality section */}
        <div
          className="decorative-orb w-48 h-48 -top-12 -right-12"
          style={{ background: isCritical ? "#93000a" : isLow ? "#a52a2a" : "#e9c349" }}
        />

        <div className="flex justify-between items-start mb-4 relative z-10">
          <span className="font-headline text-secondary uppercase tracking-widest text-xs">Vitality</span>
          <div className="flex items-center gap-1.5">
            <Icon name="directions_run" size={14} className="text-on-surface/30" />
            <span className="font-label text-xs text-on-surface/40">{speed} ft</span>
          </div>
        </div>

        <div className="flex items-end gap-4 relative z-10">
          <div className="flex flex-col">
            <span
              key={hpAnimKey}
              className={`font-headline text-6xl font-bold leading-none animate-count-up ${
                isCritical
                  ? "text-error animate-pulse-danger"
                  : isLow
                    ? "text-error"
                    : "text-on-background"
              }`}
            >
              {currentHP}
            </span>
            <span className="font-label text-xs text-primary uppercase mt-2 tracking-wider">Current HP</span>
          </div>
          <div className="h-12 w-[2px] bg-secondary/10 mb-2" />
          <div className="flex flex-col pb-1">
            <span className="font-headline text-2xl text-on-surface/60">{maxHP}</span>
            <span className="font-label text-[10px] text-on-surface/40 uppercase">Maximum</span>
          </div>
          {tempHP > 0 && (
            <>
              <div className="h-12 w-[2px] bg-secondary/10 mb-2" />
              <div className="flex flex-col pb-1 animate-scale-in">
                <span className="font-headline text-2xl text-secondary animate-shimmer">{tempHP}</span>
                <span className="font-label text-[10px] text-secondary/60 uppercase">Temp</span>
              </div>
            </>
          )}
        </div>

        <HealthBar current={currentHP} max={maxHP} temp={tempHP} showLabel className="mt-6 relative z-10" />

        {/* HP Controls */}
        <div className="mt-4 flex items-center gap-2 relative z-10">
          <input
            type="number"
            value={hpDelta}
            onChange={(e) => setHpDelta(e.target.value)}
            placeholder="0"
            min="0"
            aria-label="Hit point adjustment amount"
            className="w-20 bg-surface-container-highest rounded-sm px-3 py-2 text-center font-headline text-lg text-on-surface border border-outline-variant/10 outline-none focus:ring-1 focus:ring-secondary/40 focus:border-secondary/30 transition-all"
          />
          <button
            onClick={applyDamage}
            aria-label="Apply damage"
            className="interactive-lift px-3 py-2 min-h-[44px] bg-error-container/30 text-error rounded-sm text-xs font-label uppercase flex items-center gap-1.5 border border-error/10 hover:bg-error-container/50 hover:border-error/30 hover:shadow-[0_0_15px_rgba(147,0,10,0.3)] transition-all"
          >
            <Icon name="heart_broken" size={16} filled />
            <span className="hidden sm:inline">Damage</span>
          </button>
          <button
            onClick={applyHeal}
            aria-label="Apply healing"
            className="interactive-lift px-3 py-2 min-h-[44px] bg-green-900/30 text-green-400 rounded-sm text-xs font-label uppercase flex items-center gap-1.5 border border-green-400/10 hover:bg-green-900/50 hover:border-green-400/30 hover:shadow-[0_0_15px_rgba(74,222,128,0.2)] transition-all"
          >
            <Icon name="favorite" size={16} filled />
            <span className="hidden sm:inline">Heal</span>
          </button>
          <button
            onClick={addTempHP}
            aria-label="Add temporary hit points"
            className="interactive-lift px-3 py-2 min-h-[44px] bg-secondary-container/20 text-secondary rounded-sm text-xs font-label uppercase flex items-center gap-1.5 border border-secondary/10 hover:bg-secondary-container/40 hover:border-secondary/30 hover:shadow-[0_0_15px_rgba(233,195,73,0.2)] transition-all"
          >
            <Icon name="shield" size={16} filled />
            <span className="hidden sm:inline">Temp</span>
          </button>
        </div>
      </div>

      {/* AC */}
      <div className="col-span-6 md:col-span-3 bg-surface-container-low p-6 rounded-sm flex flex-col justify-center items-center gap-3 relative overflow-hidden shadow-whisper">
        <div className="decorative-orb w-32 h-32 top-0 left-1/2 -translate-x-1/2" style={{ background: "#e9c349" }} />
        <span className="font-label text-xs text-on-surface/50 uppercase tracking-widest relative z-10">Armor Class</span>
        <div className="w-20 h-20 rounded-full border-2 border-secondary/40 flex items-center justify-center bg-surface-container-highest/80 animate-pulse-glow relative z-10">
          <div className="absolute inset-0 rounded-full bg-secondary/5" />
          <span className="font-headline text-4xl text-secondary relative z-10">{armorClass}</span>
        </div>
        <div className="flex items-center gap-1 text-on-surface/30 relative z-10">
          <Icon name="shield" size={12} />
          <span className="font-label text-[10px] uppercase">Defense</span>
        </div>
      </div>

      {/* Initiative */}
      <div className="col-span-6 md:col-span-3 bg-surface-container-low p-6 rounded-sm flex flex-col justify-center items-center gap-3 relative overflow-hidden shadow-whisper">
        <div className="decorative-orb w-32 h-32 top-0 left-1/2 -translate-x-1/2" style={{ background: "#a52a2a" }} />
        <span className="font-label text-xs text-on-surface/50 uppercase tracking-widest relative z-10">Initiative</span>
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-sm rotate-45 border-2 border-primary/40 flex items-center justify-center bg-surface-container-highest/80 animate-border-glow">
            <div className="absolute inset-0 rounded-sm bg-primary/5" />
            <span className="font-headline text-4xl text-primary -rotate-45 relative z-10">
              {initiative >= 0 ? "+" : ""}{initiative}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-on-surface/30 relative z-10 mt-1">
          <Icon name="bolt" size={12} />
          <span className="font-label text-[10px] uppercase">Reflexes</span>
        </div>
      </div>
    </section>
  );
}
