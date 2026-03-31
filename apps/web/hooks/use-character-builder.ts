"use client";

import { useState } from "react";

export interface BuilderState {
  step: number;
  name: string;
  raceId: string | null;
  raceName: string;
  subraceId: string | null;
  classId: string | null;
  className: string;
  backgroundId: string | null;
  backgroundName: string;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  skillProficiencies: string[];
  campaignId: string | null;
}

const INITIAL_STATE: BuilderState = {
  step: 0,
  name: "",
  raceId: null,
  raceName: "",
  subraceId: null,
  classId: null,
  className: "",
  backgroundId: null,
  backgroundName: "",
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  skillProficiencies: [],
  campaignId: null,
};

export const BUILDER_STEPS = [
  "Race",
  "Class",
  "Background",
  "Abilities",
  "Review",
] as const;

export function useCharacterBuilder() {
  const [state, setState] = useState<BuilderState>(INITIAL_STATE);

  function update(partial: Partial<BuilderState>) {
    setState((prev) => ({ ...prev, ...partial }));
  }

  function nextStep() {
    setState((prev) => ({ ...prev, step: Math.min(prev.step + 1, BUILDER_STEPS.length - 1) }));
  }

  function prevStep() {
    setState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 0) }));
  }

  function goToStep(step: number) {
    setState((prev) => ({ ...prev, step }));
  }

  function reset() {
    setState(INITIAL_STATE);
  }

  return { state, update, nextStep, prevStep, goToStep, reset };
}
