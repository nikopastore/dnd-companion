"use client";

import { useState, useRef } from "react";
import { Icon } from "@/components/ui/icon";

const DICE = [4, 6, 8, 10, 12, 20, 100] as const;

interface RollResult {
  dice: string;
  rolls: number[];
  modifier: number;
  total: number;
  timestamp: number;
}

const DICE_COLORS: Record<number, string> = {
  4: "hover:bg-emerald-900/40 hover:text-emerald-300 hover:border-emerald-500/30",
  6: "hover:bg-blue-900/40 hover:text-blue-300 hover:border-blue-500/30",
  8: "hover:bg-violet-900/40 hover:text-violet-300 hover:border-violet-500/30",
  10: "hover:bg-orange-900/40 hover:text-orange-300 hover:border-orange-500/30",
  12: "hover:bg-primary-container/40 hover:text-primary hover:border-primary/30",
  20: "hover:bg-secondary-container/40 hover:text-secondary hover:border-secondary/30",
  100: "hover:bg-pink-900/40 hover:text-pink-300 hover:border-pink-500/30",
};

const DICE_ACTIVE_COLORS: Record<number, string> = {
  4: "bg-emerald-900/40 text-emerald-300 border-emerald-500/30",
  6: "bg-blue-900/40 text-blue-300 border-blue-500/30",
  8: "bg-violet-900/40 text-violet-300 border-violet-500/30",
  10: "bg-orange-900/40 text-orange-300 border-orange-500/30",
  12: "bg-primary-container/40 text-primary border-primary/30",
  20: "bg-secondary-container/40 text-secondary border-secondary/30",
  100: "bg-pink-900/40 text-pink-300 border-pink-500/30",
};

export function DiceRoller() {
  const [modifier, setModifier] = useState(0);
  const [numDice, setNumDice] = useState(1);
  const [result, setResult] = useState<RollResult | null>(null);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [lastDie, setLastDie] = useState<number | null>(null);
  const rollKeyRef = useRef(0);

  function roll(sides: number) {
    const rolls: number[] = [];
    for (let i = 0; i < numDice; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    const total = rolls.reduce((a, b) => a + b, 0) + modifier;
    const newResult: RollResult = {
      dice: `${numDice}d${sides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ""}`,
      rolls,
      modifier,
      total,
      timestamp: Date.now(),
    };

    setLastDie(sides);
    setIsRolling(true);
    rollKeyRef.current += 1;

    // Briefly show rolling animation then reveal result
    setTimeout(() => {
      setIsRolling(false);
      setResult(newResult);
      setHistory((prev) => [newResult, ...prev].slice(0, 3));
    }, 600);
  }

  // Determine if last roll was a nat 20 or nat 1 on a d20
  const isNat20 = result && lastDie === 20 && numDice === 1 && result.rolls[0] === 20;
  const isNat1 = result && lastDie === 20 && numDice === 1 && result.rolls[0] === 1;

  return (
    <div className="bg-surface-container-low p-6 rounded-sm space-y-5 shadow-whisper animate-fade-in-up relative overflow-hidden">
      <div className="decorative-orb w-48 h-48 -top-16 -right-16" style={{ background: "#e9c349" }} />

      <div className="flex items-center justify-between relative z-10">
        <span className="font-headline text-secondary uppercase tracking-widest text-xs">
          Dice Roller
        </span>
        <Icon name="casino" size={16} className="text-secondary/30" />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Num dice control */}
        <div className="flex items-center gap-1 bg-surface-container rounded-sm p-1">
          <button
            onClick={() => setNumDice(Math.max(1, numDice - 1))}
            aria-label="Decrease number of dice"
            className="min-w-[44px] min-h-[44px] w-7 h-7 rounded-sm bg-surface-container-highest flex items-center justify-center text-on-surface/60 hover:text-on-surface hover:bg-surface-bright transition-colors"
          >
            <Icon name="remove" size={14} />
          </button>
          <span className="font-headline text-lg text-on-surface w-6 text-center">{numDice}</span>
          <button
            onClick={() => setNumDice(Math.min(10, numDice + 1))}
            aria-label="Increase number of dice"
            className="min-w-[44px] min-h-[44px] w-7 h-7 rounded-sm bg-surface-container-highest flex items-center justify-center text-on-surface/60 hover:text-on-surface hover:bg-surface-bright transition-colors"
          >
            <Icon name="add" size={14} />
          </button>
        </div>

        <span className="text-on-surface/30 font-headline text-lg">d</span>

        {/* Die buttons */}
        <div className="flex gap-1.5 flex-wrap flex-1">
          {DICE.map((d) => (
            <button
              key={d}
              onClick={() => roll(d)}
              aria-label={`Roll d${d}`}
              className={`px-3 py-2 min-h-[44px] rounded-sm font-headline text-sm border border-transparent transition-all duration-300 interactive-lift ${
                lastDie === d && result
                  ? DICE_ACTIVE_COLORS[d]
                  : `bg-surface-container-highest text-on-surface ${DICE_COLORS[d]}`
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Modifier control */}
        <div className="flex items-center gap-1 bg-surface-container rounded-sm p-1">
          <button
            onClick={() => setModifier(modifier - 1)}
            aria-label="Decrease modifier"
            className="min-w-[44px] min-h-[44px] w-7 h-7 rounded-sm bg-surface-container-highest flex items-center justify-center text-on-surface/60 hover:text-on-surface hover:bg-surface-bright transition-colors"
          >
            <Icon name="remove" size={14} />
          </button>
          <span className={`font-headline text-sm w-10 text-center ${
            modifier > 0 ? "text-secondary" : modifier < 0 ? "text-error" : "text-on-surface/50"
          }`}>
            {modifier >= 0 ? `+${modifier}` : modifier}
          </span>
          <button
            onClick={() => setModifier(modifier + 1)}
            aria-label="Increase modifier"
            className="min-w-[44px] min-h-[44px] w-7 h-7 rounded-sm bg-surface-container-highest flex items-center justify-center text-on-surface/60 hover:text-on-surface hover:bg-surface-bright transition-colors"
          >
            <Icon name="add" size={14} />
          </button>
        </div>
      </div>

      {/* Result */}
      {(result || isRolling) && (
        <div
          key={rollKeyRef.current}
          className={`relative bg-surface-container p-6 rounded-sm text-center space-y-2 border transition-all duration-500 ${
            isRolling
              ? "border-secondary/20"
              : isNat20
                ? "border-secondary/40 glow-gold-strong"
                : isNat1
                  ? "border-error/40 glow-danger"
                  : "border-outline-variant/10"
          }`}
        >
          {isRolling ? (
            <div className="py-4">
              <Icon name="casino" size={48} className="text-secondary/60 animate-dice-roll mx-auto" />
            </div>
          ) : result && (
            <>
              <div className="font-label text-[10px] uppercase tracking-widest text-on-surface/40">
                {result.dice}
              </div>
              <div className={`font-headline text-6xl animate-count-up ${
                isNat20 ? "text-secondary glow-gold-strong" : isNat1 ? "text-error" : "text-primary"
              }`}>
                {result.total}
              </div>
              {isNat20 && (
                <span className="font-label text-[10px] uppercase tracking-widest text-secondary animate-scale-in">
                  Natural 20!
                </span>
              )}
              {isNat1 && (
                <span className="font-label text-[10px] uppercase tracking-widest text-error animate-scale-in">
                  Critical Fail!
                </span>
              )}
              {result.rolls.length > 1 && (
                <div className="font-body text-xs text-on-surface/50 animate-fade-in">
                  [{result.rolls.join(", ")}]{result.modifier !== 0 ? ` ${result.modifier > 0 ? "+" : ""}${result.modifier}` : ""}
                </div>
              )}
              {result.rolls.length === 1 && result.modifier !== 0 && (
                <div className="font-body text-xs text-on-surface/50 animate-fade-in">
                  {result.rolls[0]} {result.modifier > 0 ? "+" : ""}{result.modifier}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Roll History */}
      {history.length > 1 && (
        <div className="relative z-10 animate-fade-in">
          <span className="font-label text-[9px] text-on-surface/30 uppercase tracking-widest block mb-2">
            Recent Rolls
          </span>
          <div className="flex gap-2">
            {history.slice(1).map((h) => (
              <div
                key={h.timestamp}
                className="flex-1 bg-surface-container/50 rounded-sm px-3 py-2 text-center border border-outline-variant/5"
              >
                <span className="font-label text-[9px] text-on-surface/30 uppercase block">{h.dice}</span>
                <span className="font-headline text-sm text-on-surface/60">{h.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
