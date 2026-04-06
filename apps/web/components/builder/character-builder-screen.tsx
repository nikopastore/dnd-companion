"use client";

import { useEffect } from "react";
import { AbilityScores } from "@/components/builder/ability-scores";
import { BackgroundSelection } from "@/components/builder/background-selection";
import { ClassSelection } from "@/components/builder/class-selection";
import { IdentityDetails } from "@/components/builder/identity-details";
import { RaceSelection } from "@/components/builder/race-selection";
import { ReviewAndCreate } from "@/components/builder/review-and-create";
import { Icon } from "@/components/ui/icon";
import { BUILDER_STEPS, useCharacterBuilder } from "@/hooks/use-character-builder";

interface CharacterBuilderScreenProps {
  initialCampaignId?: string;
  initialCampaignName?: string;
}

export function CharacterBuilderScreen({
  initialCampaignId,
  initialCampaignName,
}: CharacterBuilderScreenProps) {
  const builder = useCharacterBuilder();
  const { state } = builder;

  useEffect(() => {
    if (!initialCampaignId || state.campaignId === initialCampaignId) {
      return;
    }

    builder.update({
      campaignId: initialCampaignId,
      campaignName: initialCampaignName || "",
    });
  }, [builder, initialCampaignId, initialCampaignName, state.campaignId]);

  const steps = [
    <RaceSelection key="race" builder={builder} />,
    <ClassSelection key="class" builder={builder} />,
    <BackgroundSelection key="background" builder={builder} />,
    <AbilityScores key="abilities" builder={builder} />,
    <IdentityDetails key="identity" builder={builder} />,
    <ReviewAndCreate key="review" builder={builder} />,
  ];

  return (
    <main className="relative mx-auto min-h-screen max-w-5xl px-6 pb-32 pt-24">
      <div className="decorative-orb fixed -right-48 -top-48 h-[500px] w-[500px] bg-primary-container opacity-20" />
      <div className="decorative-orb fixed -bottom-32 -left-32 h-[350px] w-[350px] bg-secondary opacity-15" />

      {/* Step bar */}
      <div className="relative z-10 mb-8 flex flex-wrap items-center justify-center gap-1">
        {BUILDER_STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1">
            <button
              onClick={() => i <= state.step && builder.goToStep(i)}
              disabled={i > state.step}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all ${
                i === state.step
                  ? "bg-secondary/15 text-secondary font-bold"
                  : i < state.step
                    ? "cursor-pointer text-on-surface-variant/70 hover:text-secondary"
                    : "text-on-surface/20"
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                i < state.step
                  ? "bg-secondary/15 text-secondary"
                  : i === state.step
                    ? "bg-secondary text-on-secondary"
                    : "bg-surface-container-high text-on-surface/30"
              }`}>
                {i < state.step ? <Icon name="done" size={12} /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < BUILDER_STEPS.length - 1 && (
              <div className={`h-px w-4 ${i < state.step ? "bg-secondary/30" : "bg-outline-variant/15"}`} />
            )}
          </div>
        ))}
      </div>

      <div key={state.step} className="relative z-10 animate-fade-in-up">
        {steps[state.step]}
      </div>
    </main>
  );
}
