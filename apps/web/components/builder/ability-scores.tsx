"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  ABILITIES,
  POINT_BUY_COSTS,
  POINT_BUY_TOTAL,
  STANDARD_ARRAY,
  getAbilityModifier,
  formatModifier,
} from "@dnd-companion/shared";
import type { useCharacterBuilder } from "@/hooks/use-character-builder";
import type { AbilityKey } from "@dnd-companion/shared";

interface Props {
  builder: ReturnType<typeof useCharacterBuilder>;
}

type Method = "pointbuy" | "standard";
type AssignmentState = Record<string, number | null>;

function rollAbilityScore() {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  const kept = [...rolls].sort((a, b) => b - a).slice(0, 3);
  return kept.reduce((sum, value) => sum + value, 0);
}

export function AbilityScores({ builder }: Props) {
  const { state, update, nextStep, prevStep } = builder;
  const [method, setMethod] = useState<Method | "rolled">("pointbuy");
  const [standardAssignment, setStandardAssignment] = useState<AssignmentState>({});
  const [rolledPool, setRolledPool] = useState<number[]>([]);
  const [rolledAssignment, setRolledAssignment] = useState<AssignmentState>({});

  const scores = state.abilityScores;
  const pointsSpent = Object.values(scores).reduce(
    (sum, v) => sum + (POINT_BUY_COSTS[v] ?? 0),
    0
  );
  const pointsRemaining = POINT_BUY_TOTAL - pointsSpent;

  function adjustScore(ability: AbilityKey, delta: number) {
    const current = scores[ability];
    const next = current + delta;
    if (next < 8 || next > 15) return;

    const newScores = { ...scores, [ability]: next };
    const newSpent = Object.values(newScores).reduce(
      (sum, v) => sum + (POINT_BUY_COSTS[v] ?? 0),
      0
    );
    if (newSpent > POINT_BUY_TOTAL) return;

    update({ abilityScores: newScores });
  }

  function applyAssignment(assignment: AssignmentState) {
    const newScores = { ...scores };
    for (const [key, val] of Object.entries(assignment)) {
      if (val !== null) (newScores as Record<string, number>)[key] = val;
    }
    update({ abilityScores: newScores as typeof scores });
  }

  function applyStandardArray() {
    const sorted = [...STANDARD_ARRAY];
    const assignment: Record<string, number> = {};
    ABILITIES.forEach((a, i) => {
      const val = standardAssignment[a.key];
      assignment[a.key] = val ?? sorted[i];
    });
    update({ abilityScores: assignment as typeof scores });
  }

  function assignStandardValue(
    ability: string,
    value: number
  ) {
    // Remove this value from any other ability
    const newAssignment = { ...standardAssignment };
    for (const key of Object.keys(newAssignment)) {
      if (newAssignment[key] === value) newAssignment[key] = null;
    }
    newAssignment[ability] = value;
    setStandardAssignment(newAssignment);
    applyAssignment(newAssignment);
  }

  function assignRolledValue(ability: string, value: number) {
    const availableCount = rolledPool.filter((entry) => entry === value).length;
    const currentValue = rolledAssignment[ability];
    const usedCount = Object.entries(rolledAssignment).reduce((count, [key, entry]) => {
      if (key === ability) {
        return count;
      }
      return entry === value ? count + 1 : count;
    }, 0);

    if (usedCount >= availableCount) {
      return;
    }

    const nextAssignment = { ...rolledAssignment, [ability]: value };
    setRolledAssignment(nextAssignment);
    applyAssignment(nextAssignment);
  }

  function generateRolledPool() {
    const nextPool = Array.from({ length: 6 }, () => rollAbilityScore()).sort((a, b) => b - a);
    setRolledPool(nextPool);
    setRolledAssignment({});
    update({
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    });
  }

  const scoresValid =
    method === "pointbuy"
      ? pointsRemaining >= 0 && Object.values(scores).some((v) => v !== 10)
      : method === "standard"
        ? Object.values(standardAssignment).filter((v) => v !== null).length === 6
        : method === "rolled"
          ? Object.values(rolledAssignment).filter((v) => v !== null).length === 6
          : false;

  const usedStandardValues = new Set(Object.values(standardAssignment).filter((v) => v !== null));
  const rolledValueUsage = rolledPool.reduce<Record<number, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
  const rolledAssignedUsage = Object.values(rolledAssignment).reduce<Record<number, number>>(
    (counts, value) => {
      if (value !== null) {
        counts[value] = (counts[value] ?? 0) + 1;
      }
      return counts;
    },
    {}
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-12 text-center md:text-left">
        <h2 className="font-headline text-4xl md:text-5xl text-primary mb-2 tracking-tight animate-fade-in-up">
          Forge Your Attributes
        </h2>
        <p className="font-body text-on-surface-variant text-lg max-w-2xl italic animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          Distribute your ability scores to define your character&apos;s strengths and weaknesses.
        </p>
      </div>

      {/* Method Toggle */}
      <div className="flex gap-2 mb-8 justify-center md:justify-start animate-scale-in">
        <button
          onClick={() => setMethod("pointbuy")}
          className={`px-5 py-2.5 rounded-sm font-label text-xs uppercase tracking-widest transition-all duration-500 ${
            method === "pointbuy"
              ? "bg-primary-container text-on-primary-container shadow-elevated glow-gold"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright border border-outline-variant/10"
          }`}
        >
          Point Buy
        </button>
        <button
          onClick={() => { setMethod("standard"); applyStandardArray(); }}
          className={`px-5 py-2.5 rounded-sm font-label text-xs uppercase tracking-widest transition-all duration-500 ${
            method === "standard"
              ? "bg-primary-container text-on-primary-container shadow-elevated glow-gold"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright border border-outline-variant/10"
          }`}
        >
          Standard Array
        </button>
        <button
          onClick={() => {
            setMethod("rolled");
            if (rolledPool.length === 0) {
              generateRolledPool();
            }
          }}
          className={`px-5 py-2.5 rounded-sm font-label text-xs uppercase tracking-widest transition-all duration-500 ${
            method === "rolled"
              ? "bg-primary-container text-on-primary-container shadow-elevated glow-gold"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright border border-outline-variant/10"
          }`}
        >
          Roll Scores
        </button>
      </div>

      {/* Point Buy */}
      {method === "pointbuy" && (
        <div className="space-y-6 animate-fade-in-up">
          <div className={`bg-surface-container-low p-4 rounded-sm text-center border border-outline-variant/8 transition-all duration-500 ${
            pointsRemaining > 3 ? "glow-gold" : pointsRemaining > 0 ? "" : pointsRemaining === 0 ? "glow-gold" : "glow-crimson"
          }`}>
            <span className="font-label text-xs uppercase tracking-widest text-on-surface/40">Points Remaining</span>
            <div className={`font-headline text-4xl animate-count-up ${pointsRemaining > 0 ? "text-secondary" : pointsRemaining === 0 ? "text-green-400" : "text-error"}`}>
              {pointsRemaining}
            </div>
            <span className="font-label text-[10px] text-on-surface/30">of {POINT_BUY_TOTAL}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger-children">
            {ABILITIES.map((ability) => {
              const score = scores[ability.key];
              const mod = getAbilityModifier(score);
              return (
                <div key={ability.key} className="bg-surface-container-low p-5 rounded-sm text-center space-y-3 interactive-lift border border-outline-variant/8 animate-fade-in-up">
                  <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">
                    {ability.abbreviation}
                  </span>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => adjustScore(ability.key, -1)}
                      disabled={score <= 8}
                      aria-label={`Decrease ${ability.abbreviation}`}
                      className="min-w-[44px] min-h-[44px] w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface disabled:opacity-30 hover:bg-surface-bright transition-all duration-300 hover:scale-110"
                    >
                      <Icon name="remove" size={16} />
                    </button>
                    <div>
                      <div className="font-headline text-3xl text-on-surface animate-count-up" key={score}>
                        {score}
                      </div>
                      <div className="font-body text-xs text-secondary/70 font-bold">
                        {formatModifier(mod)}
                      </div>
                    </div>
                    <button
                      onClick={() => adjustScore(ability.key, 1)}
                      disabled={score >= 15 || pointsRemaining <= 0}
                      aria-label={`Increase ${ability.abbreviation}`}
                      className="min-w-[44px] min-h-[44px] w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface disabled:opacity-30 hover:bg-surface-bright transition-all duration-300 hover:scale-110"
                    >
                      <Icon name="add" size={16} />
                    </button>
                  </div>
                  <span className="font-label text-[10px] text-on-surface/30">
                    Cost: {POINT_BUY_COSTS[score] ?? 0}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Standard Array */}
      {method === "standard" && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex gap-3 justify-center flex-wrap mb-4 stagger-children">
            {STANDARD_ARRAY.map((val) => (
              <span
                key={val}
                className={`px-3 py-1 rounded-sm font-headline text-lg transition-all duration-500 animate-fade-in-up ${
                  usedStandardValues.has(val) ? "bg-secondary-container/20 text-secondary/50 opacity-60" : "bg-surface-container-high text-secondary glow-gold"
                }`}
              >
                {val}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger-children">
            {ABILITIES.map((ability) => {
              const assigned = standardAssignment[ability.key];
              const mod = assigned ? getAbilityModifier(assigned) : 0;
              return (
                <div key={ability.key} className="bg-surface-container-low p-5 rounded-sm text-center space-y-3 interactive-lift border border-outline-variant/8 animate-fade-in-up">
                  <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">
                    {ability.abbreviation}
                  </span>
                  <div className="font-headline text-3xl text-on-surface animate-count-up" key={`${ability.key}-${assigned}`}>
                    {assigned ?? "\u2014"}
                  </div>
                  {assigned && (
                    <div className="font-body text-xs text-secondary/70 font-bold animate-fade-in">
                      {formatModifier(mod)}
                    </div>
                  )}
                  <div className="flex gap-1 flex-wrap justify-center">
                    {STANDARD_ARRAY.map((val) => (
                      <button
                        key={val}
                        onClick={() => assignStandardValue(ability.key, val)}
                        disabled={usedStandardValues.has(val) && standardAssignment[ability.key] !== val}
                        className={`w-8 h-8 rounded-sm text-xs font-bold transition-all duration-300 ${
                          assigned === val
                            ? "bg-secondary text-on-secondary glow-gold"
                            : usedStandardValues.has(val)
                              ? "bg-surface-container text-on-surface/20"
                              : "bg-surface-container-high text-on-surface hover:bg-surface-bright hover:scale-110"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {method === "rolled" && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Button variant="secondary" onClick={generateRolledPool}>
              <Icon name="casino" size={16} />
              Roll a New Set
            </Button>
            <p className="text-sm text-on-surface-variant">
              Roll 4d6, drop the lowest die, and assign the six totals where you want them.
            </p>
          </div>

          <div className="flex gap-3 justify-center flex-wrap mb-4 stagger-children">
            {rolledPool.map((val, index) => (
              <span
                key={`${val}-${index}`}
                className={`px-3 py-1 rounded-sm font-headline text-lg transition-all duration-500 animate-fade-in-up ${
                  (rolledAssignedUsage[val] ?? 0) >= (rolledValueUsage[val] ?? 0)
                    ? "bg-secondary-container/20 text-secondary/50 opacity-60"
                    : "bg-surface-container-high text-secondary glow-gold"
                }`}
              >
                {val}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger-children">
            {ABILITIES.map((ability) => {
              const assigned = rolledAssignment[ability.key];
              const mod = assigned ? getAbilityModifier(assigned) : 0;
              return (
                <div
                  key={ability.key}
                  className="bg-surface-container-low p-5 rounded-sm text-center space-y-3 interactive-lift border border-outline-variant/8 animate-fade-in-up"
                >
                  <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">
                    {ability.abbreviation}
                  </span>
                  <div
                    className="font-headline text-3xl text-on-surface animate-count-up"
                    key={`${ability.key}-${assigned}`}
                  >
                    {assigned ?? "\u2014"}
                  </div>
                  {assigned && (
                    <div className="font-body text-xs text-secondary/70 font-bold animate-fade-in">
                      {formatModifier(mod)}
                    </div>
                  )}
                  <div className="flex gap-1 flex-wrap justify-center">
                    {rolledPool.map((val, index) => (
                      <button
                        key={`${ability.key}-${val}-${index}`}
                        onClick={() => assignRolledValue(ability.key, val)}
                        disabled={
                          rolledAssignment[ability.key] !== val &&
                          (rolledAssignedUsage[val] ?? 0) >= (rolledValueUsage[val] ?? 0)
                        }
                        className={`w-8 h-8 rounded-sm text-xs font-bold transition-all duration-300 ${
                          assigned === val
                            ? "bg-secondary text-on-secondary glow-gold"
                            : (rolledAssignedUsage[val] ?? 0) >= (rolledValueUsage[val] ?? 0)
                              ? "bg-surface-container text-on-surface/20"
                              : "bg-surface-container-high text-on-surface hover:bg-surface-bright hover:scale-110"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Racial Bonuses Display */}
      {Object.keys(state.racialBonuses).length > 0 && (
        <div className="mt-8 rounded-sm border border-secondary/15 bg-secondary/5 p-5 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="diversity_3" size={16} className="text-secondary" />
            <span className="font-label text-xs uppercase tracking-widest text-secondary font-bold">
              Racial Ability Bonuses ({state.raceName})
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(state.racialBonuses).map(([ability, bonus]) => (
              <div key={ability} className="flex items-center gap-2 rounded-xl bg-secondary/10 border border-secondary/20 px-3 py-1.5">
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{ability.slice(0, 3)}</span>
                <span className="font-headline text-lg text-secondary">+{bonus}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-on-surface-variant/60">
            These bonuses are added on top of your base scores when your character is created.
          </p>
        </div>
      )}

      <div className="flex justify-between mt-12">
        <Button variant="ghost" onClick={prevStep}>
          <Icon name="arrow_back" size={16} /> Back
        </Button>
        <Button onClick={nextStep} disabled={!scoresValid}>
          Continue to Identity <Icon name="arrow_forward" size={16} />
        </Button>
      </div>
    </div>
  );
}
