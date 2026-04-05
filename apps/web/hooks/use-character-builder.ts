"use client";

import { useEffect, useRef, useState } from "react";

export interface BuilderState {
  step: number;
  campaignId: string | null;
  campaignName: string;
  name: string;
  portraitUrl: string | null;
  raceId: string | null;
  raceName: string;
  subraceId: string | null;
  subraceRequired: boolean;
  classId: string | null;
  className: string;
  backgroundId: string | null;
  backgroundName: string;
  backstory: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  racialBonuses: Record<string, number>;
  skillProficiencies: string[];
  availableSkills: string[];
  numSkillChoices: number;
}

const INITIAL_STATE: BuilderState = {
  step: 0,
  campaignId: null,
  campaignName: "",
  name: "",
  portraitUrl: null,
  raceId: null,
  raceName: "",
  subraceId: null,
  subraceRequired: false,
  classId: null,
  className: "",
  backgroundId: null,
  backgroundName: "",
  backstory: "",
  personalityTraits: "",
  ideals: "",
  bonds: "",
  flaws: "",
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  racialBonuses: {},
  skillProficiencies: [],
  availableSkills: [],
  numSkillChoices: 0,
};

export const BUILDER_STEPS = [
  "Race",
  "Class",
  "Background",
  "Abilities",
  "Identity",
  "Review",
] as const;

const STORAGE_KEY = "dnd-character-builder-state";

function loadSavedState(): BuilderState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BuilderState;
    if (parsed && typeof parsed.step === "number" && typeof parsed.name === "string") {
      return { ...INITIAL_STATE, ...parsed };
    }
  } catch {
    // corrupt data - ignore
  }
  return null;
}

export function useCharacterBuilder() {
  const [state, setState] = useState<BuilderState>(() => loadSavedState() ?? INITIAL_STATE);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full or unavailable - ignore
    }
  }, [state]);

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
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return { state, update, nextStep, prevStep, goToStep, reset };
}
