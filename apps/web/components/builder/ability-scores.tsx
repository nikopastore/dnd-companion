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

export function AbilityScores({ builder }: Props) {
  const { state, update, nextStep, prevStep } = builder;
  const [method, setMethod] = useState<Method>("pointbuy");
  const [standardAssignment, setStandardAssignment] = useState<Record<string, number | null>>({});

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

  function applyStandardArray() {
    const sorted = [...STANDARD_ARRAY];
    const assignment: Record<string, number> = {};
    ABILITIES.forEach((a, i) => {
      const val = standardAssignment[a.key];
      assignment[a.key] = val ?? sorted[i];
    });
    update({ abilityScores: assignment as typeof scores });
  }

  function assignStandardValue(ability: string, value: number) {
    // Remove this value from any other ability
    const newAssignment = { ...standardAssignment };
    for (const key of Object.keys(newAssignment)) {
      if (newAssignment[key] === value) newAssignment[key] = null;
    }
    newAssignment[ability] = value;
    setStandardAssignment(newAssignment);

    // Apply all assigned values
    const newScores = { ...scores };
    for (const [key, val] of Object.entries(newAssignment)) {
      if (val !== null) (newScores as Record<string, number>)[key] = val;
    }
    update({ abilityScores: newScores as typeof scores });
  }

  const usedStandardValues = new Set(Object.values(standardAssignment).filter((v) => v !== null));

  return (
    <div>
      <div className="mb-12 text-center md:text-left">
        <h2 className="font-headline text-4xl md:text-5xl text-primary mb-2 tracking-tight">
          Forge Your Attributes
        </h2>
        <p className="font-body text-on-surface-variant text-lg max-w-2xl italic">
          Distribute your ability scores to define your character's strengths and weaknesses.
        </p>
      </div>

      {/* Method Toggle */}
      <div className="flex gap-2 mb-8 justify-center md:justify-start">
        <button
          onClick={() => setMethod("pointbuy")}
          className={`px-4 py-2 rounded-sm font-label text-xs uppercase tracking-widest transition-all ${
            method === "pointbuy"
              ? "bg-primary-container text-on-primary-container"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright"
          }`}
        >
          Point Buy
        </button>
        <button
          onClick={() => { setMethod("standard"); applyStandardArray(); }}
          className={`px-4 py-2 rounded-sm font-label text-xs uppercase tracking-widest transition-all ${
            method === "standard"
              ? "bg-primary-container text-on-primary-container"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright"
          }`}
        >
          Standard Array
        </button>
      </div>

      {/* Point Buy */}
      {method === "pointbuy" && (
        <div className="space-y-6">
          <div className="bg-surface-container-low p-4 rounded-sm text-center">
            <span className="font-label text-xs uppercase tracking-widest text-on-surface/40">Points Remaining</span>
            <div className={`font-headline text-4xl ${pointsRemaining > 0 ? "text-secondary" : pointsRemaining === 0 ? "text-green-400" : "text-error"}`}>
              {pointsRemaining}
            </div>
            <span className="font-label text-[10px] text-on-surface/30">of {POINT_BUY_TOTAL}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ABILITIES.map((ability) => {
              const score = scores[ability.key];
              const mod = getAbilityModifier(score);
              return (
                <div key={ability.key} className="bg-surface-container-low p-5 rounded-sm text-center space-y-3">
                  <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">
                    {ability.abbreviation}
                  </span>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => adjustScore(ability.key, -1)}
                      disabled={score <= 8}
                      className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface disabled:opacity-30 hover:bg-surface-bright transition-colors"
                    >
                      <Icon name="remove" size={16} />
                    </button>
                    <div>
                      <div className="font-headline text-3xl text-on-surface">{score}</div>
                      <div className="font-body text-xs text-secondary/70 font-bold">
                        {formatModifier(mod)}
                      </div>
                    </div>
                    <button
                      onClick={() => adjustScore(ability.key, 1)}
                      disabled={score >= 15 || pointsRemaining <= 0}
                      className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface disabled:opacity-30 hover:bg-surface-bright transition-colors"
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
        <div className="space-y-6">
          <div className="flex gap-3 justify-center flex-wrap mb-4">
            {STANDARD_ARRAY.map((val) => (
              <span
                key={val}
                className={`px-3 py-1 rounded-sm font-headline text-lg ${
                  usedStandardValues.has(val) ? "bg-secondary-container/20 text-secondary/50" : "bg-surface-container-high text-secondary"
                }`}
              >
                {val}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ABILITIES.map((ability) => {
              const assigned = standardAssignment[ability.key];
              const mod = assigned ? getAbilityModifier(assigned) : 0;
              return (
                <div key={ability.key} className="bg-surface-container-low p-5 rounded-sm text-center space-y-3">
                  <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">
                    {ability.abbreviation}
                  </span>
                  <div className="font-headline text-3xl text-on-surface">
                    {assigned ?? "—"}
                  </div>
                  {assigned && (
                    <div className="font-body text-xs text-secondary/70 font-bold">
                      {formatModifier(mod)}
                    </div>
                  )}
                  <div className="flex gap-1 flex-wrap justify-center">
                    {STANDARD_ARRAY.map((val) => (
                      <button
                        key={val}
                        onClick={() => assignStandardValue(ability.key, val)}
                        disabled={usedStandardValues.has(val) && standardAssignment[ability.key] !== val}
                        className={`w-8 h-8 rounded-sm text-xs font-bold transition-all ${
                          assigned === val
                            ? "bg-secondary text-on-secondary"
                            : usedStandardValues.has(val)
                              ? "bg-surface-container text-on-surface/20"
                              : "bg-surface-container-high text-on-surface hover:bg-surface-bright"
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

      <div className="flex justify-between mt-12">
        <Button variant="ghost" onClick={prevStep}>
          <Icon name="arrow_back" size={16} /> Back
        </Button>
        <Button onClick={nextStep}>
          Review Character <Icon name="arrow_forward" size={16} />
        </Button>
      </div>
    </div>
  );
}
