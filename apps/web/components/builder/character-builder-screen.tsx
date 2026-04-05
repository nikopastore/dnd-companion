"use client";

import { useEffect } from "react";
import { AbilityScores } from "@/components/builder/ability-scores";
import { BackgroundSelection } from "@/components/builder/background-selection";
import { ClassSelection } from "@/components/builder/class-selection";
import { IdentityDetails } from "@/components/builder/identity-details";
import { RaceSelection } from "@/components/builder/race-selection";
import { ReviewAndCreate } from "@/components/builder/review-and-create";
import { AtmosphericHero } from "@/components/ui/atmospheric-hero";
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
    <main className="relative mx-auto min-h-screen max-w-7xl overflow-hidden px-6 pb-32 pt-24">
      <div className="decorative-orb fixed -right-48 -top-48 h-[600px] w-[600px] bg-primary-container opacity-40" />
      <div className="decorative-orb fixed -bottom-32 -left-32 h-[400px] w-[400px] bg-secondary opacity-30" />
      <div className="decorative-orb fixed left-1/2 top-1/2 h-[300px] w-[300px] bg-tertiary opacity-20" />

      <div className="relative z-10 space-y-8">
        <AtmosphericHero
          eyebrow="Character Builder"
          title="Forge Your Legend"
          description="Choose your ancestry, master a discipline, and shape the identity of the hero who will enter the world. Every choice matters — take your time."
          entityType="character"
          imageName="The Ashen Wanderer"
          chips={[
            "Guided Creation",
            "Visual Choices",
            state.campaignName ? `Campaign: ${state.campaignName}` : "Standalone Hero",
            "Race",
            "Class",
            "Background",
          ]}
          highlights={[
            { icon: "diversity_3", label: "Current Step", value: BUILDER_STEPS[state.step] },
            {
              icon: "checklist",
              label: "Completed",
              value: `${state.step} / ${BUILDER_STEPS.length - 1}`,
            },
            {
              icon: "shield",
              label: "Destination",
              value: state.campaignName || "Character vault",
            },
          ]}
          sideContent={
            <div className="space-y-3">
              <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/80">
                Your Journey
              </p>
              <div className="grid gap-3 text-sm text-on-surface-variant">
                <div className="rounded-xl border border-outline-variant/10 bg-background/40 p-3">
                  Select a race, class, and background — then assign ability scores
                  and give your hero a name and story.
                </div>
                <div className="rounded-xl border border-outline-variant/10 bg-background/40 p-3">
                  Inspect each option in detail before committing.
                  You can always go back to change earlier choices.
                </div>
              </div>
            </div>
          }
        />

        <section className="rounded-xl border border-outline-variant/10 bg-surface-container/70 p-5 backdrop-blur-sm">
          <div className="mb-5 flex items-center gap-2">
            <Icon name="route" size={16} className="text-secondary" />
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/85">
              Creation Path
            </p>
          </div>
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
            {BUILDER_STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <button
                  onClick={() => i <= state.step && builder.goToStep(i)}
                  disabled={i > state.step}
                  className={`flex items-center gap-2 rounded-sm px-3 py-1.5 text-xs font-label uppercase tracking-widest transition-all ${
                    i === state.step
                      ? "bg-primary-container text-on-primary-container"
                      : i < state.step
                        ? "cursor-pointer bg-surface-container-high text-secondary hover:bg-surface-bright"
                        : "bg-surface-container text-on-surface/30"
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-lowest text-[10px] font-bold">
                    {i < state.step ? <Icon name="done" size={12} /> : i + 1}
                  </span>
                  <span className="hidden md:inline">{label}</span>
                </button>
                {i < BUILDER_STEPS.length - 1 && (
                  <div
                    className={`h-[1px] w-8 ${
                      i < state.step ? "bg-secondary/40" : "bg-outline-variant/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-on-surface-variant">
            Move step by step or return to any completed section before final review.
          </p>
        </section>
      </div>

      <div key={state.step} className="relative z-10 animate-fade-in-up">
        {steps[state.step]}
      </div>
    </main>
  );
}
