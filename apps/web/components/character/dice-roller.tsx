"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

const DICE = [4, 6, 8, 10, 12, 20, 100] as const;

interface RollResult {
  dice: string;
  rolls: number[];
  modifier: number;
  total: number;
}

export function DiceRoller() {
  const [modifier, setModifier] = useState(0);
  const [numDice, setNumDice] = useState(1);
  const [result, setResult] = useState<RollResult | null>(null);

  function roll(sides: number) {
    const rolls: number[] = [];
    for (let i = 0; i < numDice; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    const total = rolls.reduce((a, b) => a + b, 0) + modifier;
    setResult({
      dice: `${numDice}d${sides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ""}`,
      rolls,
      modifier,
      total,
    });
  }

  return (
    <div className="bg-surface-container-low p-6 rounded-sm space-y-4">
      <span className="font-headline text-secondary uppercase tracking-widest text-xs">
        Dice Roller
      </span>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setNumDice(Math.max(1, numDice - 1))}
            className="w-7 h-7 rounded-sm bg-surface-container-highest flex items-center justify-center text-on-surface/60 hover:text-on-surface"
          >
            <Icon name="remove" size={14} />
          </button>
          <span className="font-headline text-lg text-on-surface w-6 text-center">{numDice}</span>
          <button
            onClick={() => setNumDice(Math.min(10, numDice + 1))}
            className="w-7 h-7 rounded-sm bg-surface-container-highest flex items-center justify-center text-on-surface/60 hover:text-on-surface"
          >
            <Icon name="add" size={14} />
          </button>
        </div>
        <span className="text-on-surface/30 font-headline">d</span>
        <div className="flex gap-1.5 flex-wrap flex-1">
          {DICE.map((d) => (
            <button
              key={d}
              onClick={() => roll(d)}
              className="px-3 py-2 bg-surface-container-highest rounded-sm font-headline text-sm text-on-surface hover:bg-primary-container hover:text-on-primary-container transition-colors active:scale-95"
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setModifier(modifier - 1)}
            className="w-7 h-7 rounded-sm bg-surface-container-highest flex items-center justify-center text-on-surface/60 hover:text-on-surface"
          >
            <Icon name="remove" size={14} />
          </button>
          <span className="font-body text-sm text-secondary w-8 text-center">
            {modifier >= 0 ? `+${modifier}` : modifier}
          </span>
          <button
            onClick={() => setModifier(modifier + 1)}
            className="w-7 h-7 rounded-sm bg-surface-container-highest flex items-center justify-center text-on-surface/60 hover:text-on-surface"
          >
            <Icon name="add" size={14} />
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-surface-container p-4 rounded-sm text-center space-y-2">
          <div className="font-label text-[10px] uppercase tracking-widest text-on-surface/40">
            {result.dice}
          </div>
          <div className="font-headline text-5xl text-primary">{result.total}</div>
          {result.rolls.length > 1 && (
            <div className="font-body text-xs text-on-surface/50">
              [{result.rolls.join(", ")}]{result.modifier !== 0 ? ` ${result.modifier > 0 ? "+" : ""}${result.modifier}` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
