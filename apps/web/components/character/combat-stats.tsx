"use client";

import { useState } from "react";
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

  return (
    <section className="grid grid-cols-12 gap-4">
      {/* Vitality */}
      <div className="col-span-12 md:col-span-6 bg-surface-container-low paper-texture p-6 rounded-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <span className="font-headline text-secondary uppercase tracking-widest text-xs">Vitality</span>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex flex-col">
            <span className="font-headline text-6xl font-bold text-on-background leading-none">{currentHP}</span>
            <span className="font-label text-xs text-primary uppercase mt-2">Current HP</span>
          </div>
          <div className="h-12 w-[2px] bg-secondary/10 mb-2" />
          <div className="flex flex-col pb-1">
            <span className="font-headline text-2xl text-on-surface/60">{maxHP}</span>
            <span className="font-label text-[10px] text-on-surface/40 uppercase">Maximum</span>
          </div>
          {tempHP > 0 && (
            <>
              <div className="h-12 w-[2px] bg-secondary/10 mb-2" />
              <div className="flex flex-col pb-1">
                <span className="font-headline text-2xl text-secondary">{tempHP}</span>
                <span className="font-label text-[10px] text-secondary/60 uppercase">Temp</span>
              </div>
            </>
          )}
        </div>
        <HealthBar current={currentHP} max={maxHP} temp={tempHP} className="mt-6" />

        {/* HP Controls */}
        <div className="mt-4 flex items-center gap-2">
          <input
            type="number"
            value={hpDelta}
            onChange={(e) => setHpDelta(e.target.value)}
            placeholder="0"
            min="0"
            className="w-20 bg-surface-container-highest rounded-sm px-3 py-2 text-center font-headline text-lg text-on-surface border-0 outline-none focus:ring-1 focus:ring-secondary/40"
          />
          <button onClick={applyDamage} className="px-3 py-2 bg-error-container/30 text-error rounded-sm text-xs font-label uppercase hover:bg-error-container/50 transition-colors">
            <Icon name="heart_broken" size={14} />
          </button>
          <button onClick={applyHeal} className="px-3 py-2 bg-green-900/30 text-green-400 rounded-sm text-xs font-label uppercase hover:bg-green-900/50 transition-colors">
            <Icon name="favorite" size={14} />
          </button>
          <button onClick={addTempHP} className="px-3 py-2 bg-secondary-container/20 text-secondary rounded-sm text-xs font-label uppercase hover:bg-secondary-container/40 transition-colors">
            <Icon name="shield" size={14} />
          </button>
        </div>
      </div>

      {/* AC */}
      <div className="col-span-6 md:col-span-3 bg-surface-container-low p-6 rounded-sm border-l-4 border-secondary flex flex-col justify-center items-center gap-2">
        <span className="font-label text-xs text-on-surface/50 uppercase tracking-tighter">Armor Class</span>
        <div className="w-16 h-16 rounded-full border-2 border-secondary/30 flex items-center justify-center bg-surface-container-highest glow-gold">
          <span className="font-headline text-3xl text-secondary">{armorClass}</span>
        </div>
      </div>

      {/* Initiative */}
      <div className="col-span-6 md:col-span-3 bg-surface-container-low p-6 rounded-sm border-l-4 border-primary flex flex-col justify-center items-center gap-2">
        <span className="font-label text-xs text-on-surface/50 uppercase tracking-tighter">Initiative</span>
        <div className="w-16 h-16 rounded-sm rotate-45 border border-primary/30 flex items-center justify-center bg-surface-container-highest">
          <span className="font-headline text-3xl text-primary -rotate-45">
            {initiative >= 0 ? "+" : ""}{initiative}
          </span>
        </div>
      </div>
    </section>
  );
}
