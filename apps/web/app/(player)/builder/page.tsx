"use client";

import { useCharacterBuilder, BUILDER_STEPS } from "@/hooks/use-character-builder";
import { RaceSelection } from "@/components/builder/race-selection";
import { ClassSelection } from "@/components/builder/class-selection";
import { BackgroundSelection } from "@/components/builder/background-selection";
import { AbilityScores } from "@/components/builder/ability-scores";
import { ReviewAndCreate } from "@/components/builder/review-and-create";

export default function CharacterBuilderPage() {
  const builder = useCharacterBuilder();
  const { state } = builder;

  const steps = [
    <RaceSelection key="race" builder={builder} />,
    <ClassSelection key="class" builder={builder} />,
    <BackgroundSelection key="background" builder={builder} />,
    <AbilityScores key="abilities" builder={builder} />,
    <ReviewAndCreate key="review" builder={builder} />,
  ];

  return (
    <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto min-h-screen relative overflow-hidden">
      {/* Background decorative orbs */}
      <div className="decorative-orb w-[600px] h-[600px] bg-primary-container -top-48 -right-48 fixed opacity-40" />
      <div className="decorative-orb w-[400px] h-[400px] bg-secondary -bottom-32 -left-32 fixed opacity-30" />
      <div className="decorative-orb w-[300px] h-[300px] bg-tertiary top-1/2 left-1/2 fixed opacity-20" />

      {/* Step Progress */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center gap-2 justify-center mb-6">
          {BUILDER_STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <button
                onClick={() => i <= state.step && builder.goToStep(i)}
                disabled={i > state.step}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-label uppercase tracking-widest transition-all ${
                  i === state.step
                    ? "bg-primary-container text-on-primary-container"
                    : i < state.step
                      ? "bg-surface-container-high text-secondary cursor-pointer hover:bg-surface-bright"
                      : "bg-surface-container text-on-surface/30"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-surface-container-lowest flex items-center justify-center text-[10px] font-bold">
                  {i < state.step ? "✓" : i + 1}
                </span>
                <span className="hidden md:inline">{label}</span>
              </button>
              {i < BUILDER_STEPS.length - 1 && (
                <div
                  className={`w-8 h-[1px] ${
                    i < state.step ? "bg-secondary/40" : "bg-outline-variant/20"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step */}
      <div key={state.step} className="animate-fade-in-up relative z-10">
        {steps[state.step]}
      </div>
    </main>
  );
}
